import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ history: [] });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch history for user
        const snapshot = await adminDB.collection('history').where('userId', '==', userId).get();
        const history = snapshot.docs.map(doc => doc.data());

        return NextResponse.json({ history });
    } catch {
        return NextResponse.json({ history: [] });
    }
}