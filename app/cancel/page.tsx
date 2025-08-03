'use client';

import Link from 'next/link';

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-[#191627] p-8 rounded-2xl text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Payment Cancelled</h1>
                <p className="text-gray-300 mb-6">
                    No worries! You can upgrade to Pro anytime to unlock unlimited translations.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/translator"
                        className="block w-full py-3 bg-[#A383F7] text-white rounded-lg font-semibold hover:bg-[#8257E6] transition"
                    >
                        Continue with Free Plan
                    </Link>
                    <Link
                        href="/pricing"
                        className="block w-full py-3 border border-[#A383F7] text-[#A383F7] rounded-lg font-semibold hover:bg-[#A383F7] hover:text-white transition"
                    >
                        View Pricing Again
                    </Link>
                </div>
            </div>
        </div>
    );
}
