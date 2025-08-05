import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

// GET /api/projects/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const projectId = params.id;

        // Get project
        const projectDoc = await adminDB.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const projectData = projectDoc.data();

        // Permission check
        if (
            !projectData ||
            (projectData.owner !== userId &&
            !(projectData.sharedWith || []).includes(userId))
        ) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        return NextResponse.json({ project: projectData });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}