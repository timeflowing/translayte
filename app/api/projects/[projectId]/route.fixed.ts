import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

// --- Simple in-memory rate limiter (for demonstration) ---
const requestCounts: { [key: string]: { count: number; last: number } } = {};
function rateLimit(ip: string, limit = 20, windowMs = 60000) {
    const now = Date.now();
    if (!requestCounts[ip] || now - requestCounts[ip].last > windowMs) {
        requestCounts[ip] = { count: 1, last: now };
        return false;
    }
    requestCounts[ip].count++;
    requestCounts[ip].last = now;
    return requestCounts[ip].count > limit;
}

// --- Helper: Validate and sanitize input ---
function sanitizeUpdate(body: Record<string, unknown>): Record<string, unknown> | null {
    if (typeof body !== 'object' || !body) return null;
    const allowedFields = ['name', 'translations', 'status'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (key in body) updateData[key] = body[key];
    }
    return Object.keys(updateData).length > 0 ? updateData : null;
}

// --- Helper: Permission check ---
async function hasEditPermission(projectId: string, userId: string) {
    const snap = await adminDB
        .collection('project_collaborators')
        .where('projectId', '==', projectId)
        .where('userId', '==', userId)
        .where('status', '==', 'accepted')
        .where('permission', '==', 'edit')
        .get();
    return !snap.empty;
}

// --- GET Project ---
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (rateLimit(ip as string)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decoded = await adminAuth.verifyIdToken(idToken);
        const projectRef = adminDB.collection('projects').doc(params.projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const projectData = projectDoc.data();
        // Only owner or accepted collaborators can view
        const isOwner = projectData && projectData.ownerId === decoded.uid;
        const isCollaborator = await adminDB
            .collection('project_collaborators')
            .where('projectId', '==', params.projectId)
            .where('userId', '==', decoded.uid)
            .where('status', '==', 'accepted')
            .get()
            .then(snap => !snap.empty);
        if (!(isOwner || isCollaborator)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return NextResponse.json({ project: { id: projectDoc.id, ...projectData } });
    } catch (error) {
        console.error('GET /api/projects/[projectId] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// --- PUT Project (Update) ---
export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (rateLimit(ip as string)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decoded = await adminAuth.verifyIdToken(idToken);
        const projectRef = adminDB.collection('projects').doc(params.projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const projectData = projectDoc.data();
        // Only owner or accepted editor can update
        const isOwner = projectData && projectData.ownerId === decoded.uid;
        const isEditor = await hasEditPermission(params.projectId, decoded.uid);
        if (!(isOwner || isEditor)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        const body = await req.json();
        const updateData = sanitizeUpdate(body);
        if (!updateData) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }
        await projectRef.update(updateData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT /api/projects/[projectId] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// --- DELETE Project ---
export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    let response;
    try {
        if (rateLimit(ip as string)) {
            response = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        } else {
            const authHeader = req.headers.get('authorization');
            if (!authHeader) {
                response = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            } else {
                const idToken = authHeader.replace('Bearer ', '');
                const decoded = await adminAuth.verifyIdToken(idToken);
                const projectRef = adminDB.collection('projects').doc(params.projectId);
                const projectDoc = await projectRef.get();
                if (!projectDoc.exists) {
                    response = NextResponse.json({ error: 'Project not found' }, { status: 404 });
                } else {
                    const projectData = projectDoc.data();
                    // Only owner can delete
                    const isOwner = projectData && projectData.ownerId === decoded.uid;
                    if (!isOwner) {
                        response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
                    } else {
                        await projectRef.delete();
                        response = NextResponse.json({ success: true });
                    }
                }
            }
        }
    } catch (error) {
        console.error('DELETE /api/projects/[projectId] error:', error);
        response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    return response;
}
