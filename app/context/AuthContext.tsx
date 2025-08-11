'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface User {
    uid: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    photoURL?: string;
    phone?: string;
    plan?: string;
    trialEndsAt?: string;
    company?: string;
    jobTitle?: string;
    bio?: string;
    country?: string;
    state?: string;
    city?: string;
    zip?: string;
    githubConnected?: boolean;
    googleConnected?: boolean;
    slackConnected?: boolean;
    subscription?: { status: string | null };
    keys_month?: number;
    chars_month?: number;
}

interface AuthContext {
    user: User | null;
    authUser: import('firebase/auth').User | null;
    loading: boolean;
}

const AuthCtx = createContext<AuthContext>({
    user: null,
    authUser: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authUser, loading] = useAuthState(auth);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!loading && authUser) {
            const userRef = doc(db, 'users', authUser.uid);
            getDoc(userRef)
                .then(snap => {
                    if (snap.exists()) {
                        const userData = snap.data();
                        // Merge Firebase Auth user methods with Firestore data
                        setUser({
                            ...userData,
                            uid: authUser.uid,
                        } as User);
                    } else {
                        const [firstName, ...rest] = (authUser.displayName || '').split(' ');
                        const lastName = rest.join(' ');
                        const profile: User = {
                            uid: authUser.uid,
                            displayName: authUser.displayName || '',
                            firstName,
                            lastName,
                            email: authUser.email ?? '',
                            photoURL: authUser.photoURL ?? '',
                            plan: 'trial',
                            trialEndsAt: new Date(
                                Date.now() + 7 * 24 * 60 * 60 * 1000,
                            ).toISOString(),
                            keys_month: 0,
                            chars_month: 0,
                            subscription: { status: null },
                        };
                        setDoc(userRef, profile)
                            .then(() => setUser(profile))
                            .catch(err => console.error('Error creating user doc:', err));
                    }
                })
                .catch(err => console.error('Error fetching user doc:', err));
        } else {
            setUser(null);
        }
    }, [loading, authUser]);

    return (
        <AuthCtx.Provider value={{ user, authUser: authUser ?? null, loading }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
