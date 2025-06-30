'use client';

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

const GoogleLoginButton = () => {
    const handleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error('Google login error:', err);
        }
    };

    return (
        <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full px-6 py-3 mt-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 shadow-sm"
        >
            <GoogleIcon />
            Continue with Google
        </button>
    );
};

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
        <path
            fill="#4285F4"
            d="M43.6 20.5H42V20H24v8h11.3C34.1 32.3 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.6-5.6C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.5-.4-3.5z"
        />
        <path
            fill="#34A853"
            d="M6.3 14.7l6.6 4.8C14.2 16 18.7 13 24 13c3 0 5.8 1.1 7.9 3l5.6-5.6C33.4 6.1 28.9 4 24 4 15.6 4 8.6 9.3 6.3 14.7z"
        />
        <path
            fill="#FBBC05"
            d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.6-4.7 2.5-7.5 2.5-5.5 0-10.1-3.7-11.6-8.6l-6.6 5C9.6 39.7 16.3 44 24 44z"
        />
        <path
            fill="#EA4335"
            d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.6-4.5 6.1-8.3 6.1-5.5 0-10.1-3.7-11.6-8.6l-6.6 5C9.6 39.7 16.3 44 24 44c11 0 20-9 20-20 0-1.3-.1-2.5-.4-3.5z"
        />
    </svg>
);

export default GoogleLoginButton;
