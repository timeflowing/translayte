'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebaseClient';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    orgId?: string;
}

export default function InviteModal({ isOpen, onClose, projectId, orgId }: InviteModalProps) {
    const [user] = useAuthState(auth);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
    const [loading, setLoading] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !email.trim()) return;

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/invitations/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    projectId,
                    orgId,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            toast.success('Invitation sent successfully!');
            setEmail('');
            setRole('viewer');
            onClose();
        } catch (error) {
            console.error('Invite error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#232136] rounded-xl shadow-lg p-6 min-w-[400px] relative">
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-[#A78BFA] text-xl"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>

                <h2 className="text-xl font-bold mb-4 text-[#A78BFA]">Invite Team Member</h2>

                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="w-full px-3 py-2 bg-[#191627] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#A78BFA]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as 'viewer' | 'editor')}
                            className="w-full px-3 py-2 bg-[#191627] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#A78BFA]"
                        >
                            <option value="viewer">Viewer - Can view translations</option>
                            <option value="editor">Editor - Can view and edit translations</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="flex-1 px-4 py-2 bg-[#A78BFA] text-white rounded-lg hover:bg-[#7C5AE6] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
