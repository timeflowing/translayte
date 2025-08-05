import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ organizations: [] });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch organizations for user
        const snapshot = await adminDB.collection('organizations').where('members', 'array-contains', userId).get();
        const organizations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ organizations });
    } catch {
        return NextResponse.json({ organizations: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Organization name required' }, { status: 400 });
        }

        // Create organization with creator as first member
        const orgRef = await adminDB.collection('organizations').add({
            name,
            members: [userId],
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ id: orgRef.id, name, members: [userId] });
    } catch (error) {
        console.error('Organization creation error:', error);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }
}