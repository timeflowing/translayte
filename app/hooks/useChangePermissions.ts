import { updateDoc } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { Role } from '../types/Role';


export async function updatePermission(projectId: string, email: string, role: Role) {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (!data) return;
    const updated = (data.permissions ?? []).map((p: any) =>
        p.email === email ? { ...p, role } : p
    );
    await updateDoc(docRef, { permissions: updated });
}