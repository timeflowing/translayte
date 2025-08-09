import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, collection,  deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { useAuth } from '../context/AuthContext';

type PresenceRow = {
  uid: string;
  displayName: string;
  photoURL?: string;
  isEditing: boolean;
  lastActive: number;       // client timestamp (ms)
  lastEditAt?: number;      // client timestamp (ms)
};

const ONLINE_THRESHOLD_MS = 30_000; // 30s window counts as online

export function usePresence(projectId?: string) {
  const { user } = useAuth();
  const [rows, setRows] = useState<PresenceRow[]>([]);
  const stopTimer = useRef<() => void>(() => {});

  useEffect(() => {
    if (!projectId || !user) return;

    const presenceRef = doc(db, 'translations', projectId, 'presence', user.uid);
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'User');

    // Create/update my presence doc immediately
    setDoc(presenceRef, {
      uid: user.uid,
      displayName: name,
      photoURL: user.photoURL ?? null,
      isEditing: false,
      lastActive: Date.now(),
      lastEditAt: null,
    }, { merge: true });

    // Heartbeat every 15s
    const t = setInterval(() => {
      updateDoc(presenceRef, { lastActive: Date.now() });
    }, 15_000);
    stopTimer.current = () => clearInterval(t);

    // Remove my presence on unload (best effort)
    const onUnload = () => deleteDoc(presenceRef);
    window.addEventListener('beforeunload', onUnload);

    // Listen to everyone’s presence
    const unsub = onSnapshot(collection(db, 'translations', projectId, 'presence'), snap => {
      const list: PresenceRow[] = snap.docs.map(d => d.data() as PresenceRow);
      setRows(list);
    });

    return () => {
      stopTimer.current();
      window.removeEventListener('beforeunload', onUnload);
      deleteDoc(presenceRef).catch(() => {});
      unsub();
    };
  }, [projectId, user]);

  const collaborators = useMemo(() => {
    const now = Date.now();
    return rows
      .map(r => ({
        ...r,
        isOnline: now - (r.lastActive ?? 0) < ONLINE_THRESHOLD_MS,
      }))
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [rows]);

  // Call this while user types; auto clears after silence
  const markEditing = (() => {
    let clearHandle: number | NodeJS.Timeout | undefined;
    return async (isTyping: boolean, projectIdLocal?: string) => {
      if (!projectId || !user) return;
      const pid = projectIdLocal ?? projectId;
      const presenceRef = doc(db, 'translations', pid, 'presence', user.uid);

      if (isTyping) {
        clearTimeout(clearHandle);
        await updateDoc(presenceRef, { isEditing: true, lastEditAt: Date.now(), lastActive: Date.now() });
        clearHandle = setTimeout(() => {
          updateDoc(presenceRef, { isEditing: false }).catch(() => {});
        }, 2000); // 2s idle -> not editing
      } else {
        await updateDoc(presenceRef, { isEditing: false });
      }
    };
  })();

  return { collaborators, markEditing };
}