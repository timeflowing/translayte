'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface TeamInvitationProps {
    teamId: string;
    onInviteSuccess: () => void;
}

export default function TeamInvitation({ teamId, onInviteSuccess }: TeamInvitationProps) {
    const [emails, setEmails] = useState<string[]>(['']);
    const [role, setRole] = useState<'member' | 'admin'>('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const addEmailField = () => {
        setEmails([...emails, '']);
    };

    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const removeEmail = (index: number) => {
        if (emails.length > 1) {
            const newEmails = emails.filter((_, i) => i !== index);
            setEmails(newEmails);
        }
    };

    const handleInvite = async () => {
        if (!user) return;

        const validEmails = emails.filter(email => email.trim() && email.includes('@'));
        if (validEmails.length === 0) {
            setError('Please enter at least one valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/teams/${teamId}/invite`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: validEmails,
                    role,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send invitations');
            }

            setEmails(['']);
            onInviteSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invitations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Members</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Addresses
                    </label>
                    {emails.map((email, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => updateEmail(index, e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="colleague@company.com"
                            />
                            {emails.length > 1 && (
                                <button
                                    onClick={() => removeEmail(index)}
                                    className="text-red-600 hover:text-red-800 px-3"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addEmailField}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        + Add another email
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value as 'member' | 'admin')}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Admins can invite other members and manage team settings
                    </p>
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <button
                    onClick={handleInvite}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Sending invitations...' : 'Send Invitations'}
                </button>
            </div>
        </div>
    );
}
