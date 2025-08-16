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
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Side - Branding */}
            <div
                className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-8 lg:px-12 py-8 lg:py-0"
                style={{ background: 'transparent' }}
            >
                <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />

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
                        Transform your content with intelligent translation
                    </h1>
                    <p className="text-gray-300 mb-4 lg:mb-8 max-w-lg text-sm sm:text-base">
                        Transform your content with intelligent translation powered by advanced AI
                        technology.
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
            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 min-h-[50vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-6 py-8 lg:py-0 bg-[#16131f]">
                <div className="w-full max-w-md bg-[#191627] p-6 sm:p-8 rounded-2xl shadow-xl">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                        Welcome Back
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#16131f] border border-[#282443] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#A383F7] outline-none transition text-sm sm:text-base"
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
                            className="w-full py-2.5 sm:py-3 rounded-lg bg-[#A383F7] text-white font-semibold shadow-md hover:bg-[#8257E6] transition text-sm sm:text-base"
                        >
                            Sign in
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
                    <p className="mt-4 text-xs text-center text-gray-400">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-white">
                            Terms of Service
                        </Link>
                        .
                    </p>
                    <p className="mt-4 sm:mt-6 text-center text-gray-400 text-sm">
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

export default LoginPage;
