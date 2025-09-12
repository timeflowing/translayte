'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import SynapseAnimation from '../utils/SynapseAnimation';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSent(false);
        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch {
            setError('Failed to send reset link. Please check your email address.');
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br">
            {/* Left Side - Branding */}
            <div className="w-1/2 min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-12">
                <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />
                <div className="flex flex-col gap-8 z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#A383F7] to-[#8257E6] shadow-lg">
                            <div className="w-5 h-5 bg-black rounded-[6px]" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">Phrasey</span>
                    </div>
                    {/* Title */}
                    <h1 className="text-4xl font-bold text-white mb-2">Reset your password</h1>
                    <p className="text-gray-300 mb-8 max-w-lg">
                        Forgot your password? No worries! Enter your email to receive a secure
                        password reset link.
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
            {/* Right Side - Reset Form */}
            <div className="w-1/2 min-h-screen flex items-center justify-center px-6 bg-[#16131f]">
                <div className="w-full max-w-md bg-[#191627] p-8 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Forgot Password</h2>
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
                        {sent && (
                            <p className="text-green-500 text-sm">
                                Password reset link sent! Please check your inbox.
                            </p>
                        )}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-[#A383F7] text-white font-semibold shadow-md hover:bg-[#8257E6] transition"
                            disabled={sent}
                        >
                            {sent ? 'Link Sent' : 'Send Reset Link'}
                        </button>
                    </form>
                    <div className="mt-8 flex justify-between">
                        <Link href="/login" className="text-sm text-[#A383F7] hover:underline">
                            &larr; Back to Login
                        </Link>
                        <Link
                            href="/signup"
                            className="text-sm text-gray-400 hover:text-[#A383F7] transition"
                        >
                            Sign Up
                        </Link>
                    </div>
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

export default ForgotPasswordPage;
