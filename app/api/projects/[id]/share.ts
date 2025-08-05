import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

// POST /api/projects/:id/share
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const projectId = params.id;

        const { sharedWith, permissions } = await req.json(); // sharedWith: string[], permissions: { [userId]: 'view' | 'edit' }

        // Get project
        const projectRef = adminDB.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const projectData = projectDoc.data();
        if (!projectData || projectData.owner !== userId) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Update sharing info
        await projectRef.update({
            sharedWith,
            permissions,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to share project' }, { status: 500 });
    }
}