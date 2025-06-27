// app/context/AuthContext.tsx
'use client';
import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseClient';

// Define context type
type AuthContextType = {
    user: User | null;
    loading: boolean;
};

// Create the context
const AuthCtx = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u); // Save Firebase user
            setLoading(false); // Done loading
        });
        return unsub; // Clean up listener
    }, []);

    return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>;
};
