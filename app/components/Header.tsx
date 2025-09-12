import Link from 'next/link';
import { useState } from 'react';
import { auth } from '../lib/firebaseClient';

type TranslatorHeaderProps = {
    user: { email?: string } | null;
    isPro: boolean;
    keysThisMonth: number;
    FREE_TIER_KEY_LIMIT: number;
};

export function TranslatorHeader({
    user,
    isPro,
    keysThisMonth,
    FREE_TIER_KEY_LIMIT,
}: TranslatorHeaderProps) {
    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <header className="fixed w-full z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-gray-800">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo/Home */}
                <Link href="/" className="text-xl font-bold gradient-text">
                    Phrasey
                </Link>
                {user && (
                    <div className="text-sm text-gray-300 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {!isPro && (
                                <>
                                    <i className="fa-solid fa-key text-purple-400" />
                                    {`${keysThisMonth} / ${FREE_TIER_KEY_LIMIT} keys`}
                                </>
                            )}
                        </div>
                    </div>
                )}
                {/* Auth nav */}
                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(o => !o)}
                            className="px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
                        >
                            Hello there, {user.email ? user.email.split('@')[0] : 'User'}
                            <i className="fa-solid fa-chevron-down text-xs" />
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-[#1f1f1f] border border-gray-700 rounded shadow-lg">
                                <Link href="/profile" className="block px-4 py-2 hover:bg-gray-800">
                                    Profile
                                </Link>
                                <Link href="/billing" className="block px-4 py-2 hover:bg-gray-800">
                                    Billing & Plan
                                </Link>
                                <button
                                    onClick={() => auth.signOut()}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-800"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="px-4 py-2 bg-[#8B5CF6] text-white rounded hover:opacity-90"
                    >
                        Log In
                    </Link>
                )}
            </div>
        </header>
    );
}
