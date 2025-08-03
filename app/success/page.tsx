'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Auto redirect to translator after 5 seconds
        const timer = setTimeout(() => {
            router.push('/translator');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-[#191627] p-8 rounded-2xl text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
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
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Payment Successful!</h1>
                <p className="text-gray-300 mb-6">
                    Welcome to Translayte Pro! You now have access to unlimited translations and
                    premium features.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/translator"
                        className="block w-full py-3 bg-[#A383F7] text-white rounded-lg font-semibold hover:bg-[#8257E6] transition"
                    >
                        Start Translating
                    </Link>
                    <p className="text-sm text-gray-400">
                        Redirecting automatically in 5 seconds...
                    </p>
                </div>
            </div>
        </div>
    );
}
