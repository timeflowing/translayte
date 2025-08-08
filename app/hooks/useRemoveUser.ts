import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';


type Permission = {
    email: string;
    // add other fields if necessary
};

export async function removeUser(projectId: string, email: string) {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (!data) return;
    const updated = (data.permissions ?? []).filter((p: Permission) => p.email !== email);
    await updateDoc(docRef, { permissions: updated });
}