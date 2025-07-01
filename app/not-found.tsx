'use client';

import Link from 'next/link';
import SynapseAnimation from './utils/SynapseAnimation';

export default function ErrorPage({
    error,
    reset,
}: {
    error?: Error & { digest?: string };
    reset?: () => void;
}) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br  relative overflow-hidden">
            {/* Animated background */}
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10" />

            {/* Main card */}
            <div className="max-w-md w-full bg-[#181828] border border-[#29294d] rounded-2xl shadow-2xl px-8 py-12 text-center relative z-10 flex flex-col items-center">
                {/* Icon */}
                <div className="absolute left-1/2 -top-14 transform -translate-x-1/2">
                    <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] shadow-lg border-4 border-[#181828]">
                        <svg
                            width="40"
                            height="40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#fff"
                            strokeWidth="1.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.675 1.732-3L13.732 4c-.77-1.325-2.694-1.325-3.464 0L3.34 17c-.77 1.325.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                </div>
                <h1 className="mt-8 text-4xl font-extrabold text-white">
                    Oops! Something went wrong
                </h1>
                <p className="text-gray-400 mt-4">
                    Sorry, we ran into a problem processing your request.
                </p>
                {error?.message && (
                    <div className="bg-[#251a32] text-[#f87171] rounded-lg px-4 py-2 mt-6 mb-2 font-mono text-sm border border-[#a78bfa]/10 break-words">
                        {error.message}
                    </div>
                )}
                <div className="flex gap-4 justify-center mt-8">
                    {reset && (
                        <button
                            onClick={() => reset()}
                            className="px-6 py-2 rounded-full bg-[#8B5CF6] hover:bg-[#A78BFA] text-white font-semibold shadow transition"
                        >
                            Try Again
                        </button>
                    )}
                    <Link href="/">
                        <span className="px-6 py-2 rounded-full border border-[#8B5CF6] text-[#8B5CF6] font-semibold hover:bg-[#8B5CF6]/10 transition cursor-pointer">
                            Go Home
                        </span>
                    </Link>
                </div>
                <div className="mt-8 text-xs text-gray-500">
                    <span>Need help?</span>{' '}
                    <a
                        href="mailto:support@translaye.it"
                        className="underline hover:text-[#A78BFA]"
                    >
                        Contact support
                    </a>
                </div>
            </div>
        </div>
    );
}
