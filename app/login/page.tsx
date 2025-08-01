'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import GoogleLoginButton from '../utils/signInWithGoogle';
import { auth } from '../lib/firebaseClient';
import SynapseAnimation from '../utils/SynapseAnimation';
import { useAuthState } from 'react-firebase-hooks/auth';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [user, loading] = useAuthState(auth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/translator');
        } catch {
            setError('Login failed. Please check your email and password.');
        }
    };

    useEffect(() => {
        if (!loading && user) {
            router.push('/translator');
        }
    }, [user, loading, router]);
    return (
        <div className="flex flex-row min-h-screen">
            {/* Left Side - Branding */}
            <div
                className="w-1/2 min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-12"
                style={{ background: 'transparent' }}
            >
                <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />

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
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Transform your content with intelligent translation
                    </h1>
                    <p className="text-gray-300 mb-8 max-w-lg">
                        Transform your content with intelligent translation powered by advanced AI
                        technology.
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
            {/* Right Side - Login Form */}
            <div className="w-1/2 min-h-screen flex items-center justify-center px-6 bg-[#16131f]">
                <div className="w-full max-w-md bg-[#191627] p-8 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            <div className="flex justify-between items-center mb-1">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-[#A383F7] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition"
                                placeholder="Password"
                            />
                        </div>
                        <div className="flex items-center mb-2">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 text-[#A383F7] border-gray-300 rounded focus:ring-[#A383F7]"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                                Remember me for 30 days
                            </label>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-[#A383F7] text-white font-semibold shadow-md hover:bg-[#8257E6] transition"
                        >
                            Sign in
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
                    </div>
                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-[#A383F7] hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

// Feature component for the left panel
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

export default LoginPage;
