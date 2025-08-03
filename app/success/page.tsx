'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function SuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/translator');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-gray-900 to-gray-900 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_400px_at_50%_300px,#a855f722,#0000)]"></div>

            <div className="relative z-10 max-w-lg w-full bg-gray-800/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 text-center p-8 md:p-12">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center text-green-400">
                        <CheckCircle size={40} strokeWidth={1.5} />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4">
                    Welcome to Pro
                </h1>
                <p className="text-gray-300 text-lg mb-8">
                    Your upgrade is complete. You now have unlimited access to all premium features.
                    Let&apos;s create something amazing.
                </p>
                <div className="flex flex-col items-center space-y-4">
                    <Link
                        href="/translator"
                        className="group flex items-center justify-center w-full md:w-auto px-8 py-3 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                        Start Translating
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <p className="text-sm text-gray-500">
                        You will be redirected automatically in 5 seconds...
                    </p>
                </div>
            </div>
        </div>
    );
}
