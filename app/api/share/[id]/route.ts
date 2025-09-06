import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '../../../lib/firebaseAdmin';
import { rateLimit } from '../../../utils/rateLimiter';

/** Helpers */
function safeOrigin(req: NextRequest) {
  return req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || '';
}
type Role = 'viewer' | 'editor';

function getMyRole(translationData: Record<string, any>, uid: string | null): Role | null {
  if (!uid) return null;
  if (translationData?.userId === uid) return 'editor'; // treat owner as editor-capable
  const role = translationData?.sharedWith?.[uid]?.role;
  return role === 'editor' ? 'editor' : role === 'viewer' ? 'viewer' : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { id } = await params;
    const ref = adminDB.collection('translations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    const data = snap.data() || {};
    const authHeader = request.headers.get('authorization');
    let uid: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        // ignore bad token; access may still be allowed if publicly shared
      }
    }

    const isOwner = !!uid && data.userId === uid;
    const role = getMyRole(data, uid);
    const isShared = !!role;
    const isPublic = !!data.isPubliclyShared;

    const canRead = isOwner || isShared || isPublic;
    if (!canRead) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Auto-add authenticated viewers hitting a public link (one-time)
    if (!isOwner && isPublic && uid) {
      const currentShared = data.sharedWith || {};
      if (!currentShared[uid]) {
        try {
          await ref.update({
            [`sharedWith.${uid}`]: { role: 'viewer', addedAt: new Date().toISOString(), addedVia: 'public_link' }
          });
        } catch (e) {
          // non-fatal
          console.warn('Failed to auto-add viewer via public link', e);
        }
      }
    }

    // Return everything the client needs to *fully* render (including statuses & contexts)
    return NextResponse.json({
      id: snap.id,
      fileName: data.fileName || 'Untitled',
      sourceLanguage: data.sourceLanguage || 'en',
      targetLanguages: data.targetLanguages || [],
      translationResult: data.translationResult || {},
      statuses: data.statuses || {},        // ← include!
      contexts: data.contexts || {},        // ← include!
      createdAt: data.createdAt || null,
      isOwner,
      myRole: role,                         // 'viewer' | 'editor' | null
      isPubliclyShared: isPublic
    });
  } catch (error) {
    console.error('GET /share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);

    const { isPubliclyShared } = await request.json();

    const ref = adminDB.collection('translations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    const data = snap.data() || {};
    if (data.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Only the owner can change sharing settings' }, { status: 403 });
    }

    await ref.update({
      isPubliclyShared: !!isPubliclyShared,
      sharedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const shareUrl = `${safeOrigin(request)}/share/${id}`;
    return NextResponse.json({
      success: true,
      isPubliclyShared: !!isPubliclyShared,
      shareUrl: isPubliclyShared ? shareUrl : null
    });
  } catch (error) {
    console.error('POST /share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || 'local';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const { updates } = body || {};
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const ref = adminDB.collection('translations').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    const data = snap.data() || {};

    // Permission: owner OR shared editor
    const myRole = getMyRole(data, decoded.uid);
    const isOwner = data.userId === decoded.uid;
    const canEdit = isOwner || myRole === 'editor';
    if (!canEdit) {
      return NextResponse.json({ error: 'Only the owner or shared editor can update' }, { status: 403 });
    }

    // Build new objects by merging into current doc (no dotted keys)
    const newTR: Record<string, Record<string, string>> = { ...(data.translationResult || {}) };
    const newStatuses: Record<string, string> = { ...(data.statuses || {}) };
    const newContexts: Record<string, string> = { ...(data.contexts || {}) };

    // Normalize language keys in translationResult
    const normalizeLangKey = (lang: string) => lang.toLowerCase();

    // Debugging: Log mismatches between lang and translationResult keys
    console.log('Incoming updates:', updates);
    console.log('Existing translationResult keys:', Object.keys(newTR));

    for (const u of updates as Array<{ key: string; lang?: string; value?: string; context?: string; status?: string }>) {
      const { key, lang, value, context, status } = u || {};
      if (!key || (value === undefined && context === undefined && status === undefined && !lang)) {
        return NextResponse.json({ error: 'Invalid update object' }, { status: 400 });
      }

      // Validate that lang is one of the targetLanguages (case-insensitive)
      const normalizedTargetLanguages = data.targetLanguages.map(normalizeLangKey);

      // Ensure sourceLanguage is always allowed
      const allowedLanguages = new Set([...normalizedTargetLanguages, data.sourceLanguage.toLowerCase()]);

      // Validate that lang is one of the allowed languages
      if (lang && !allowedLanguages.has(normalizeLangKey(lang))) {
        console.warn(`Invalid language: ${lang}. Allowed languages:`, Array.from(allowedLanguages));
        return NextResponse.json({ error: `Invalid language: ${lang}` }, { status: 400 });
      }

      // Update translationResult for a specific language
      if (lang && value !== undefined) {
        const normLang = normalizeLangKey(lang);
        const matchedLang = Object.keys(newTR).find(
          k => normalizeLangKey(k).startsWith(normLang)
        ) || normLang; // Fallback to normalized lang if no match

        const currentLangMap = newTR[matchedLang] || {};
        newTR[matchedLang] = { ...currentLangMap, [key]: value ?? '' };

        console.log(`Updated translationResult for lang: ${matchedLang}, key: ${key}`);
      }

      // Debugging: Log how non-English languages are being processed
      console.log(`Processing update for lang: ${lang}, key: ${key}, value: ${value}`);
      console.log('Current translationResult:', newTR);

      // Update contexts map
      if (context !== undefined) {
        newContexts[key] = context ?? '';
      }

      // Update statuses map (ensure it’s one of allowed strings if you want)
      if (status !== undefined) {
        newStatuses[key] = status;
      }
    }

    console.log('Updated translationResult:', newTR);

    // Sort translationResult keys alphabetically
    // Custom sort to ensure 'title' does not appear first
    const sortedTranslationResult = Object.keys(newTR)
      .sort((a, b) => {
        if (a === 'title') return 1; // Push 'title' to the end
        if (b === 'title') return -1;
        return a.localeCompare(b); // Default alphabetical order
      })
      .reduce((acc: Record<string, Record<string, string>>, key) => {
        acc[key] = newTR[key];
        return acc;
      }, {});

    await ref.update({
      translationResult: sortedTranslationResult,
      statuses: newStatuses,
      contexts: newContexts,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}