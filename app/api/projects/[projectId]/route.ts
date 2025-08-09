import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';


// GET handler to fetch a single project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const projectRef = adminDB.collection('translations').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data();

        // Check if the user is the owner or has been shared the project
        if (projectData?.userId !== userId && !projectData?.sharedWith?.includes(userId)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ id: projectDoc.id, ...projectData });
    } catch (error) {
        console.error(`GET /api/projects/${projectId} error:`, error);
        if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE handler to remove a project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const projectRef = adminDB.collection('translations').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data();

        // Security check: Only the owner can delete the project
        if (projectData?.userId !== userId) {
            return NextResponse.json({ error: 'Access denied. Only the owner can delete this project.' }, { status: 403 });
        }

        await projectRef.delete();

        return NextResponse.json({ success: true, message: 'Project deleted successfully.' });
    } catch (error) {
        console.error(`DELETE /api/projects/${projectId} error:`, error);
        if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST handler to update sharing permissions
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const projectRef = adminDB.collection('translations').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data();

        // Security check: Only the project owner can change sharing settings
        if (projectData?.userId !== userId) {
            return NextResponse.json({ error: 'Access denied. Only the owner can share this project.' }, { status: 403 });
        }

        const { sharedWith, permissions } = await req.json();

        // Validate input
        if (!Array.isArray(sharedWith) || typeof permissions !== 'object') {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Update the document with the new sharing settings
        await projectRef.update({
            sharedWith,
            permissions,
        });

        return NextResponse.json({ success: true, message: 'Project sharing updated.' });
    } catch (error) {
        console.error(`POST /api/projects/${projectId} error:`, error);
        if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}