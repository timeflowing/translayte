'use client';
import React, { useState } from 'react';

interface SimpleLinkShareModalProps {
    link: string;
    onClose: () => void;
    onTogglePublicSharing: () => Promise<void>;
    isPubliclyShared: boolean;
}

export default function SimpleLinkShareModal({
    link,
    onClose,
    onTogglePublicSharing,
    isPubliclyShared,
}: SimpleLinkShareModalProps) {
    const [copySuccess, setCopySuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Copy link to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    // Toggle public sharing
    const handleToggleSharing = async () => {
        setLoading(true);
        try {
            await onTogglePublicSharing();
        } catch (error) {
            console.error('Failed to toggle sharing:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-[#232136] rounded-xl shadow-xl p-8 w-full max-w-lg mx-4 border border-[#8B5CF6]/20">
                {/* Close Button */}
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-[#A78BFA] text-2xl transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-share-nodes text-white text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Share Translation Project
                    </h2>
                    <p className="text-gray-300 text-sm">
                        Share your translation with anyone using a simple link
                    </p>
                </div>

                {/* Public Sharing Toggle */}
                <div className="mb-6">
                    <div className="flex items-center justify-between p-4 bg-[#191627] rounded-lg border border-[#8B5CF6]/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center">
                                <i className="fa-solid fa-globe text-[#8B5CF6]"></i>
                            </div>
                            <div>
                                <div className="text-white font-semibold">Public Access</div>
                                <div className="text-xs text-gray-400">
                                    {isPubliclyShared
                                        ? 'Anyone with the link can view'
                                        : 'Only you can access this project'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleSharing}
                            disabled={loading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isPubliclyShared ? 'bg-[#8B5CF6]' : 'bg-gray-600'
                            } ${loading ? 'opacity-50' : ''}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                    isPubliclyShared ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Share Link Section */}
                {isPubliclyShared && (
                    <div className="mb-6">
                        <label className="block text-sm text-gray-300 mb-2 font-medium">
                            <i className="fa-solid fa-link mr-2"></i>
                            Share Link
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg bg-[#191627] text-white border border-[#8B5CF6]/30 text-sm font-mono"
                                value={link}
                                readOnly
                            />
                            <button
                                onClick={handleCopy}
                                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <i
                                    className={`fa-solid ${copySuccess ? 'fa-check' : 'fa-copy'}`}
                                ></i>
                                {copySuccess ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {isPubliclyShared ? (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <i className="fa-solid fa-circle-info text-green-400 mt-0.5"></i>
                            <div>
                                <div className="text-green-300 font-semibold text-sm">
                                    Ready to Share
                                </div>
                                <div className="text-green-200 text-xs mt-1">
                                    Copy the link above and share it with anyone. They&apos;ll be
                                    able to view your translation instantly.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800/40 border border-gray-600/30 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <i className="fa-solid fa-lock text-gray-400 mt-0.5"></i>
                            <div>
                                <div className="text-gray-300 font-semibold text-sm">
                                    Private Project
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                    Enable public access to generate a shareable link.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        className="flex-1 py-3 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    {isPubliclyShared && (
                        <button
                            onClick={handleCopy}
                            className="flex-1 py-3 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-share"></i>
                            Share Link
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
