'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebaseClient';

export default function SharePage() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter();

    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, authLoading] = useAuthState(auth);
    const [sharedData, setSharedData] = useState<{
        id: string;
        fileName: string;
        sourceLanguage: string;
        targetLanguages: string[];
        translationResult: Record<string, Record<string, string>>;
        createdAt?: { seconds: number };
        isOwner: boolean;
    } | null>(null);

    useEffect(() => {
        const fetchSharedData = async () => {
            if (authLoading) return;

            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };

                // Add auth header if user is logged in
                if (user) {
                    const idToken = await (
                        user as { getIdToken: () => Promise<string> }
                    ).getIdToken();
                    headers['Authorization'] = `Bearer ${idToken}`;
                }

                const response = await fetch(`/api/share/${token}`, {
                    method: 'GET',
                    headers,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to load shared translation');
                    setPageLoading(false);
                    return;
                }

                const data = await response.json();
                setSharedData(data);
            } catch (err) {
                console.error('Error fetching shared data:', err);
                setError('Failed to load shared translation');
            } finally {
                setPageLoading(false);
            }
        };

        fetchSharedData();
    }, [token, authLoading, user]);

    if (pageLoading || authLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading shared translation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#8B5CF6] text-white px-6 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (!sharedData) {
        return (
            <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <h1 className="text-2xl font-bold text-white mb-2">No Data</h1>
                    <p className="text-gray-300 mb-4">
                        This shared translation appears to be empty
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#8B5CF6] text-white px-6 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F23]">
            <div className="container mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Shared Translation</h1>
                    <h2 className="text-2xl text-[#8B5CF6] mb-2">{sharedData.fileName}</h2>
                    <p className="text-gray-300">
                        Languages: {sharedData.sourceLanguage} →{' '}
                        {sharedData.targetLanguages?.join(', ')}
                    </p>
                    {sharedData.createdAt && (
                        <p className="text-gray-400 text-sm">
                            Created on{' '}
                            {new Date(sharedData.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* Translation Results */}
                <div className="bg-[#18181b] rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Translation Results</h2>

                    {sharedData.translationResult &&
                    Object.keys(sharedData.translationResult).length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(sharedData.translationResult).map(
                                ([langCode, translations]) => (
                                    <div
                                        key={langCode}
                                        className="border border-gray-700 rounded-lg p-4"
                                    >
                                        <h3 className="text-lg font-medium text-[#8B5CF6] mb-3">
                                            {langCode.toUpperCase()}
                                        </h3>
                                        <div className="bg-[#0F0F23] rounded-lg p-4">
                                            <pre className="text-gray-200 text-sm overflow-x-auto">
                                                {JSON.stringify(translations, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400">No translations available</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 mt-8">
                    <button
                        onClick={() => router.push('/translator')}
                        className="bg-[#8B5CF6] text-white px-6 py-2 rounded-lg hover:bg-[#7C3AED] transition-colors"
                    >
                        Create Your Own Translation
                    </button>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(
                                JSON.stringify(sharedData.translationResult, null, 2),
                            );
                            alert('Translation copied to clipboard!');
                        }}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Copy Translation
                    </button>
                </div>
            </div>
        </div>
    );
}
