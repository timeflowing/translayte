'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import GoogleLoginButton from '../utils/signInWithGoogle';
import SynapseAnimation from '../utils/SynapseAnimation';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // Adjusted password validation to allow the provided password
        const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&\-]{8,}$/;
        if (!passwordStrengthRegex.test(password)) {
            setError(
                'Password must be at least 8 characters long, include an uppercase letter, a number, and optionally a special character.',
            );
            return;
        }

        if (!agreed) {
            setError('You must agree to the Terms and Conditions.');
            return;
        }
        if (password !== password2) {
            setError('Passwords do not match.');
            return;
        }

        setCreating(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName });
            router.push('/'); // Redirect to home or desired page
        } catch (error) {
            const firebaseError = error as { code?: string; message?: string };
            console.error('Firebase error:', firebaseError);
            // Parse Firebase error codes
            const errorMessage =
                firebaseError.code === 'auth/email-already-in-use'
                    ? 'This email is already in use. Please use a different email.'
                    : firebaseError.code === 'auth/weak-password'
                    ? 'The password is too weak. Please choose a stronger password.'
                    : firebaseError.message || 'Failed to create an account. Please try again.';
            setError(errorMessage);
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Side - Branding */}
            <div className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-8 lg:px-12 py-8 lg:py-0 bg-transparent">
                <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />
                <div className="flex flex-col gap-4 lg:gap-8 z-10 text-center lg:text-left">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#A383F7] to-[#8257E6] shadow-lg">
                            <div className="w-4 h-4 lg:w-5 lg:h-5 bg-black rounded-[6px]" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">
                            Translayte
                        </span>
                    </div>
                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                        Create Your Account
                    </h1>
                    <p className="text-gray-300 mb-4 lg:mb-8 max-w-lg text-sm sm:text-base">
                        Start transforming your content with intelligent translation, powered by
                        advanced AI.
                    </p>
                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 bg-[#191627] p-4 lg:p-6 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-md">
                        <Feature
                            title="AI Translation"
                            desc="Context-aware translations in 13+ languages"
                            icon="💡"
                        />
                        <Feature
                            title="Lightning Fast"
                            desc="Real-time processing with instant results"
                            icon="⚡"
                        />
                        <Feature
                            title="Secure"
                            desc="End-to-end encryption for your data"
                            icon="🔒"
                        />
                        <Feature
                            title="Smart Context"
                            desc="Understands context and nuance perfectly"
                            icon="🎯"
                        />
                    </div>
                </div>
            </div>
            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-6 py-8 lg:py-0 bg-[#16131f]">
                <div className="w-full max-w-md bg-[#191627] p-6 sm:p-8 rounded-2xl shadow-xl">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                        Sign Up
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div>
                            <label
                                htmlFor="displayName"
                                className="block text-sm font-medium text-gray-300 mb-1"
                            >
                                Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                autoComplete="name"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition text-sm sm:text-base"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-300 mb-1"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition text-sm sm:text-base"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-300 mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition text-sm sm:text-base"
                                placeholder="Password"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password2"
                                className="block text-sm font-medium text-gray-300 mb-1"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="password2"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password2}
                                onChange={e => setPassword2(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition text-sm sm:text-base"
                                placeholder="Repeat password"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        aria-describedby="terms"
                                        type="checkbox"
                                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                                        required
                                        checked={agreed}
                                        onChange={e => setAgreed(e.target.checked)}
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label
                                        htmlFor="terms"
                                        className="font-light text-gray-500 dark:text-gray-300"
                                    >
                                        I accept the{' '}
                                        <a
                                            className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                                            href="/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Terms and Conditions
                                        </a>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-2.5 sm:py-3 rounded-lg bg-[#A383F7] text-white font-semibold shadow-md hover:bg-[#8257E6] transition text-sm sm:text-base disabled:opacity-50"
                            disabled={creating || !agreed}
                        >
                            {creating ? 'Creating...' : 'Sign Up'}
                        </button>
                    </form>
                    {/* Divider */}
                    <div className="my-4 sm:my-6 flex items-center">
                        <hr className="flex-grow border-[#282443]" />
                        <span className="mx-3 text-sm text-gray-500">or continue with</span>
                        <hr className="flex-grow border-[#282443]" />
                    </div>
                    {/* Social Buttons */}
                    <div className="flex flex-col gap-3">
                        <GoogleLoginButton />
                    </div>
                    <p className="mt-4 sm:mt-6 text-center text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#A383F7] hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
    return (
        <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-lg sm:text-xl w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#252141] flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-white font-semibold text-sm sm:text-base">{title}</div>
                <div className="text-xs text-gray-400 leading-tight">{desc}</div>
            </div>
        </div>
    );
}

export default RegisterPage;
