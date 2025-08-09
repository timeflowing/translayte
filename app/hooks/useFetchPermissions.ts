import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';



export async function fetchPermissions(projectId: string): Promise<[]> {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (!data) return [];
    return data.permissions ?? [];
}