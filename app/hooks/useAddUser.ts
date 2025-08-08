import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { Role } from "../types/Role";

export async function addUser(projectId: string, email: string, role: Role, name?: string, avatarUrl?: string) {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (!data) return;
    // Nezdvojovat
    if ((data.permissions ?? []).some((p: any) => p.email === email)) return;
    const newPerm = { email, name: name || '', avatarUrl: avatarUrl || '', role };
    await updateDoc(docRef, { permissions: [...(data.permissions ?? []), newPerm] });
}