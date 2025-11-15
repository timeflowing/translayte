import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

interface FeedbackModalProps {
    open: boolean;
    onClose: () => void;
    translationId: string;
    user: { uid?: string } | null;
}

export default function FeedbackModal({ open, onClose, translationId, user }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            console.log('Submitting feedback...', { translationId, userId: user?.uid, feedback });
            await addDoc(collection(db, 'translationFeedback'), {
                translationId,
                userId: user?.uid || null,
                feedback,
                createdAt: serverTimestamp(),
            });
            console.log('Feedback submitted successfully!');
            setSuccess(true);
            setFeedback('');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            setError(
                `Failed to submit feedback: ${
                    err instanceof Error ? err.message : 'Unknown error'
                }`,
            );
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#18132a] border-2 border-[#8B5CF6] rounded-2xl p-7 w-full max-w-md shadow-2xl relative animate-fadeIn">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl font-light leading-none"
                    onClick={onClose}
                >
                    ×
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h2>
                    <p className="text-sm text-gray-400">
                        Your feedback helps us improve and build better features for you!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <textarea
                            maxLength={500}
                            className="w-full p-4 rounded-xl border-2 border-gray-700 bg-[#0f0a1a] text-white placeholder-gray-500 transition-all duration-200 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/20 focus:bg-[#1a1128] focus:outline-none resize-none"
                            rows={5}
                            placeholder="Tell us what you think, suggest improvements, or report issues..."
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            required
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                            {feedback.length}/500
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !feedback}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-bold shadow-lg hover:shadow-[#8B5CF6]/50 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30 transition-all duration-200 text-base"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-spinner fa-spin" />
                                Submitting...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-paper-plane" />
                                Submit Feedback
                            </span>
                        )}
                    </button>
                </form>

                {success && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                        <i className="fa-solid fa-circle-check" />
                        Thank you for your feedback! We appreciate your input.
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
