'use client';

import Link from 'next/link';
import { XCircle, ShieldQuestion, ArrowRight } from 'lucide-react';

export default function CancelPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-red-900/30 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_400px_at_50%_300px,#f43f5e22,#0000)]"></div>

            <div className="relative z-10 max-w-lg w-full bg-gray-800/50 backdrop-blur-lg border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/10 text-center p-8 md:p-12">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center text-red-400">
                        <XCircle size={40} strokeWidth={1.5} />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4">
                    Payment Cancelled
                </h1>
                <p className="text-gray-300 text-lg mb-8">
                    Your transaction was not completed. You can still enjoy our free plan, and
                    upgrade whenever you&apos;re ready.
                </p>
                <div className="flex flex-col items-center space-y-4">
                    <Link
                        href="/translator"
                        className="group flex items-center justify-center w-full md:w-auto px-8 py-3 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                        Continue with Free Plan
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/#pricing" // Assuming you have a pricing section on your homepage
                        className="group flex items-center justify-center text-gray-300 font-medium hover:text-white transition-colors duration-300"
                    >
                        <ShieldQuestion className="mr-2 h-5 w-5 text-purple-400" />
                        Why Go Pro?
                    </Link>
                </div>
            </div>
        </div>
    );
}
