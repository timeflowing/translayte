'use client';

import React, { useEffect, useState } from 'react';
import SynapseAnimation from '../utils/SynapseAnimation';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebaseClient';

// Simple navigation bar for app pages
const NavigationBar = () => (
    <nav className="w-full bg-[#232136] border-b border-[#8B5CF6]/20 py-3 px-6 flex items-center justify-between mb-8 rounded-b-xl shadow-lg">
        <div className="flex items-center gap-4">
            <Link href="/" className="text-white font-bold text-lg hover:text-[#A78BFA]">
                Translayte
            </Link>
            <Link href="/translator" className="text-gray-300 hover:text-[#A78BFA]">
                Translate
            </Link>
            <Link href="/projects" className="text-gray-300 hover:text-[#A78BFA]">
                Projects
            </Link>
            <Link href="/billing" className="text-[#A78BFA] font-semibold">
                Billing
            </Link>
        </div>
        <div>
            <Link href="/profile" className="text-gray-300 hover:text-[#A78BFA]">
                Profile
            </Link>
        </div>
    </nav>
);

const BillingPage = () => {
    const [user, loadingAuth] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    interface SubscriptionData {
        plan: string;
        status: string;
        nextBillingDate?: string;
    }
    interface InvoiceData {
        date: string;
        amount: string;
        status: string;
        invoiceUrl: string;
    }
    interface BillingResponse {
        subscription: SubscriptionData | null;
        billingHistory: InvoiceData[];
    }
    const [billing, setBilling] = useState<BillingResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        // Use accessToken for Firebase user
        // @ts-expect-error: accessToken is available on user object from react-firebase-hooks
        const accessToken = user?.accessToken || user?.stsTokenManager?.accessToken;
        fetch('/api/billing', {
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        })
            .then(res => res.json())
            .then((data: BillingResponse) => {
                setBilling(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load billing info.');
                setLoading(false);
            });
    }, [user]);

    const handleCancel = async () => {
        window.open('https://billing.stripe.com/p/login', '_blank');
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
            <NavigationBar />
            <div className="flex-1 flex items-center justify-center relative">
                <div className="bg-[#191627]/90 border border-[#8B5CF6]/10 shadow-xl rounded-2xl p-10 max-w-2xl w-full mx-4 relative z-10">
                    <h1 className="text-3xl font-bold mb-2 text-white text-center tracking-tight">
                        Billing & Subscription
                    </h1>
                    <p className="text-gray-300 text-center mb-8 text-base">
                        Manage your subscription, view payment history, and access legal
                        information.
                    </p>
                    {loadingAuth || loading ? (
                        <div className="text-center text-gray-400">Loading...</div>
                    ) : error ? (
                        <div className="text-center text-red-400">{error}</div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                                    billing?.subscription?.plan === 'Pro'
                                                        ? 'bg-[#A78BFA]/20 text-[#A78BFA]'
                                                        : 'bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {billing?.subscription?.plan || 'Free'}
                                            </span>
                                            {billing?.subscription?.plan === 'Pro' && (
                                                <span className="inline-block bg-[#A78BFA] text-white px-2 py-1 rounded-full text-xs font-bold">
                                                    PRO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            Status:{' '}
                                            <span
                                                className={`font-bold px-2 py-1 rounded ${
                                                    billing?.subscription?.status === 'active'
                                                        ? 'bg-green-700 text-green-200'
                                                        : 'bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {billing?.subscription?.status || 'none'}
                                            </span>
                                        </div>
                                        {billing?.subscription?.nextBillingDate && (
                                            <div className="text-sm text-gray-300 mt-1">
                                                Next Billing Date:{' '}
                                                <span className="font-bold text-[#A78BFA]">
                                                    {billing.subscription.nextBillingDate}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {billing?.subscription?.status === 'active' && (
                                        <button
                                            className="py-2 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center gap-2"
                                            onClick={handleCancel}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                            Cancel Subscription
                                        </button>
                                    )}
                                    {billing?.subscription?.status !== 'active' && (
                                        <button
                                            className="py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition flex items-center gap-2 mt-4"
                                            onClick={() =>
                                                window.open(
                                                    'https://billing.stripe.com/p/login',
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                            Upgrade to Pro
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 text-[#A78BFA]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 9V7a5 5 0 00-10 0v2M5 13h14l1 9H4l1-9z"
                                        />
                                    </svg>
                                    Payment History
                                </h2>
                                {billing?.billingHistory?.length ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-gray-300 border border-gray-700 rounded-lg">
                                            <thead>
                                                <tr className="bg-[#232136]">
                                                    <th className="py-2 px-4">Date</th>
                                                    <th className="py-2 px-4">Amount</th>
                                                    <th className="py-2 px-4">Status</th>
                                                    <th className="py-2 px-4">Invoice</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billing.billingHistory.map(
                                                    (inv: InvoiceData, idx: number) => (
                                                        <tr
                                                            key={idx}
                                                            className="border-t border-gray-700"
                                                        >
                                                            <td className="py-2 px-4">
                                                                {inv.date}
                                                            </td>
                                                            <td className="py-2 px-4 font-bold text-[#A78BFA]">
                                                                {inv.amount}
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                        inv.status === 'paid'
                                                                            ? 'bg-green-700 text-green-200'
                                                                            : 'bg-gray-700 text-gray-300'
                                                                    }`}
                                                                >
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                <a
                                                                    href={inv.invoiceUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="underline text-[#A78BFA] font-semibold"
                                                                >
                                                                    View
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-gray-400">No payment history found.</div>
                                )}
                            </div>
                            <div className="mt-6 text-xs text-gray-500 text-center">
                                <span className="inline-block bg-[#232136] px-3 py-1 rounded-full text-[#A78BFA] font-semibold mr-2">
                                    Legal
                                </span>
                                By subscribing you agree to our{' '}
                                <Link href="/privacy" className="underline hover:text-[#A78BFA]">
                                    Privacy Policy
                                </Link>{' '}
                                and{' '}
                                <Link href="/terms" className="underline hover:text-[#A78BFA]">
                                    Terms of Service
                                </Link>
                                .
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
