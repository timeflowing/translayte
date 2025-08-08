import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { Role } from "../types/Role";

export async function getGeneralAccess(projectId: string) {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    return data?.generalAccess ?? { enabled: true, role: "viewer" };
}

export async function setGeneralAccess(projectId: string, role: Role) {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, { generalAccess: { enabled: true, role } });
}