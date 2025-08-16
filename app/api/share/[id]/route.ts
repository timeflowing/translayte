import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '../../../lib/firebaseAdmin';
import { rateLimit } from '../../../utils/rateLimiter';

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
    
    // Get the translation document
    const translationDoc = await adminDB.collection('translations').doc(id).get();
    
    if (!translationDoc.exists) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    
    const translationData = translationDoc.data();
    
    // Check if translation is publicly shareable or if user has access
    const authHeader = request.headers.get('authorization');
    let hasAccess = false;
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const idToken = authHeader.replace('Bearer ', '');
        const decoded = await adminAuth.verifyIdToken(idToken);
        userId = decoded.uid;
        
        // Check if user is owner or has shared access
        hasAccess = translationData?.userId === decoded.uid || 
                   translationData?.sharedWith?.[decoded.uid] !== undefined;
      } catch {
        // Invalid token, continue with public access check
      }
    }
    
    // Check if translation has public sharing enabled
    if (!hasAccess && !translationData?.isPubliclyShared) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // If user is authenticated and accessing a publicly shared translation,
    // automatically add them as a collaborator (if not already owner)
    if (userId && translationData?.isPubliclyShared && translationData?.userId !== userId) {
      const currentSharedWith = translationData?.sharedWith || {};
      
      // Only add if not already a collaborator
      if (!currentSharedWith[userId]) {
        try {
          await adminDB.collection('translations').doc(id).update({
            [`sharedWith.${userId}`]: { 
              role: 'viewer',
              addedAt: new Date().toISOString(),
              addedVia: 'public_link'
            },
            [`permissions.${userId}`]: 'viewer'
          });
        } catch (error) {
          console.error('Error adding collaborator:', error);
          // Continue even if this fails
        }
      }
    }
    
    // Return shareable data (remove sensitive information)
    const shareableData = {
      id: translationDoc.id,
      fileName: translationData?.fileName || 'Untitled',
      sourceLanguage: translationData?.sourceLanguage || 'EN',
      targetLanguages: translationData?.targetLanguages || [],
      translationResult: translationData?.translationResult || {},
      createdAt: translationData?.createdAt,
      isOwner: hasAccess && translationData?.userId === userId
    };
    
    return NextResponse.json(shareableData);
    
  } catch (error) {
    console.error('Error fetching shared translation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/share/[id] - Enable/disable public sharing for a translation
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
    
    const idToken = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    const { isPubliclyShared } = await request.json();
    
    // Get the translation document
    const translationRef = adminDB.collection('translations').doc(id);
    const translationDoc = await translationRef.get();
    
    if (!translationDoc.exists) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    
    const translationData = translationDoc.data();
    
    // Check if user is the owner
    if (translationData?.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Only the owner can change sharing settings' }, { status: 403 });
    }
    
    // Update sharing status
    await translationRef.update({
      isPubliclyShared: !!isPubliclyShared,
      sharedAt: new Date().toISOString()
    });
    
    const shareUrl = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL}/share/${id}`;
    
    return NextResponse.json({ 
      success: true,
      isPubliclyShared: !!isPubliclyShared,
      shareUrl: isPubliclyShared ? shareUrl : null
    });
    
  } catch (error) {
    console.error('Error updating sharing settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
