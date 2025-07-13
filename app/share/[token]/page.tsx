'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';

interface Project {
    name: string;
    description?: string;
    targetLanguages: string[];
}

interface ShareData {
    project: Project;
    permissions: string;
    isExpired: boolean;
}

export default function SharePage({ params }: { params: { token: string } }) {
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        async function loadShareData() {
            try {
                const response = await fetch(`/api/share/${params.token}`);

                if (!response.ok) {
                    throw new Error('Share link not found or expired');
                }

                const data = await response.json();
                setShareData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load shared project');
            } finally {
                setLoading(false);
            }
        }

        loadShareData();
    }, [params.token]);

    const handleAcceptShare = async () => {
        if (!user) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        try {
            const response = await fetch(`/api/share/${params.token}/accept`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${await user.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const { projectId } = await response.json();
                router.push(`/projects/${projectId}`);
            } else {
                throw new Error('Failed to accept share');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept share');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading shared project...</p>
                </div>
            </div>
        );
    }

    if (error || !shareData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Share Link Invalid</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (shareData.isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-yellow-600 mb-4">Share Link Expired</h1>
                    <p className="text-gray-600 mb-4">This share link has expired.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        You&apos;ve been invited to collaborate
                    </h1>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {shareData.project.name}
                        </h2>
                        {shareData.project.description && (
                            <p className="text-gray-600 mt-2">{shareData.project.description}</p>
                        )}
                        <div className="mt-4 text-sm text-gray-500">
                            <p>
                                Permission:{' '}
                                <span className="font-medium">{shareData.permissions}</span>
                            </p>
                            <p>Languages: {shareData.project.targetLanguages.join(', ')}</p>
                        </div>
                    </div>

                    {!user ? (
                        <div>
                            <p className="text-gray-600 mb-4">
                                Please sign in to access this shared project.
                            </p>
                            <button
                                onClick={() =>
                                    router.push(
                                        '/login?redirect=' +
                                            encodeURIComponent(window.location.pathname),
                                    )
                                }
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                            >
                                Sign In
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-4">
                                Click below to access the shared translation project.
                            </p>
                            <button
                                onClick={handleAcceptShare}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                            >
                                Access Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
