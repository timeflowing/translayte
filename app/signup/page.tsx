'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import GoogleLoginButton from '../utils/signInWithGoogle';
import GitHubLoginButton from '../utils/singInWithGithub';
import SynapseAnimation from '../utils/SynapseAnimation';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== password2) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        try {
            setCreating(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName.trim()) {
                await updateProfile(userCredential.user, { displayName });
            }
            router.push('/translator'); // or wherever your dashboard/landing is
        } catch (err) {
            if (err && typeof err === 'object' && 'code' in err) {
                const error = err as { code: string };
                setError(
                    error.code === 'auth/email-already-in-use'
                        ? 'Email already in use.'
                        : 'Failed to create account. Please check your details.',
                );
            } else {
                setError('Failed to create account. Please check your details.');
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Left Side - Branding */}
            <div className="w-full md:w-1/2 min-h-[400px] md:min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-8 md:px-12 bg-transparent">
                <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />
                <div className="flex flex-col gap-8 z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#A383F7] to-[#8257E6] shadow-lg">
                            <div className="w-5 h-5 bg-black rounded-[6px]" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">
                            Translayte
                        </span>
                    </div>
                    {/* Title */}
                    <h1 className="text-4xl font-bold text-white mb-2">Create Your Account</h1>
                    <p className="text-gray-300 mb-8 max-w-lg">
                        Start transforming your content with intelligent translation, powered by
                        advanced AI.
                    </p>
                    {/* Features */}
                    <div className="grid grid-cols-2 gap-6 bg-[#191627] p-6 rounded-2xl shadow-lg w-full max-w-md">
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
            <div className="w-1/2 min-h-screen flex items-center justify-center px-6 bg-[#16131f]">
                <div className="w-full max-w-md bg-[#191627] p-8 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                className="w-full px-4 py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition"
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
                                className="w-full px-4 py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition"
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
                                className="w-full px-4 py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition"
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
                                className="w-full px-4 py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition"
                                placeholder="Repeat password"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-[#A383F7] text-white font-semibold shadow-md hover:bg-[#8257E6] transition"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Sign Up'}
                        </button>
                    </form>
                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <hr className="flex-grow border-[#282443]" />
                        <span className="mx-3 text-sm text-gray-500">or continue with</span>
                        <hr className="flex-grow border-[#282443]" />
                    </div>
                    {/* Social Buttons */}
                    <div className="flex flex-col gap-3">
                        <GoogleLoginButton />
                        <GitHubLoginButton />
                    </div>
                    <p className="mt-6 text-center text-gray-400 text-sm">
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
        <div className="flex items-start gap-3">
            <div className="text-xl w-8 h-8 flex items-center justify-center rounded-lg bg-[#252141]">
                {icon}
            </div>
            <div>
                <div className="text-white font-semibold text-base">{title}</div>
                <div className="text-xs text-gray-400">{desc}</div>
            </div>
        </div>
    );
}

export default RegisterPage;
