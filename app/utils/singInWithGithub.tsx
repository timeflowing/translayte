'use client';

import { signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebaseClient';

const GitHubLoginButton = () => {
    const handleLogin = async () => {
        try {
            const provider = new GithubAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error('GitHub login error:', err);
        }
    };

    return (
        <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full px-6 py-3 mt-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 shadow-sm"
        >
            <GitHubIcon />
            Continue with GitHub
        </button>
    );
};

const GitHubIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 0a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.35-1.78-1.35-1.78-1.1-.76.08-.75.08-.75 1.22.09 1.87 1.25 1.87 1.25 1.08 1.86 2.84 1.32 3.54 1.01.11-.78.42-1.32.76-1.62-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12 12 0 0012 0z"
        />
    </svg>
);

export default GitHubLoginButton;
