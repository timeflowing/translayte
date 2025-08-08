import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';


type UserPermission = {
    // Define the structure of a user permission object here
    // For example:
    // role: string;
    // userId: string;
};

export async function fetchPermissions(projectId: string): Promise<UserPermission[]> {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (!data) return [];
    return data.permissions ?? [];
}