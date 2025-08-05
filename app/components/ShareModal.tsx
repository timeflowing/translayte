'use client';
import React from 'react';

export default function ShareProjectModal({
    onClose,
    emails,
    setEmails,
    permissions,
    setPermissions,
    loading,
    error,
    success,
    onShare,
    newEmail,
    setNewEmail,
}: {
    onClose: () => void;
    emails: string[];
    setEmails: (emails: string[]) => void;
    permissions: { [email: string]: { view: boolean; edit: boolean; comment: boolean } };
    setPermissions: (p: {
        [email: string]: { view: boolean; edit: boolean; comment: boolean };
    }) => void;
    loading: boolean;
    error: string | null;
    success: string | null;
    onShare: () => void;
    newEmail: string;
    setNewEmail: (e: string) => void;
}) {
    // Add new email with default permissions
    const handleAddEmail = () => {
        if (newEmail && !emails.includes(newEmail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            setEmails([...emails, newEmail]);
            setPermissions({
                ...permissions,
                [newEmail]: { view: true, edit: false, comment: false },
            });
            setNewEmail('');
        }
    };

    // Remove user
    const handleRemoveEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email));
        const newPerm = { ...permissions };
        delete newPerm[email];
        setPermissions(newPerm);
    };

    // Toggle permission
    const handleTogglePermission = (email: string, perm: keyof (typeof permissions)[string]) => {
        setPermissions({
            ...permissions,
            [email]: {
                ...permissions[email],
                [perm]: !permissions[email][perm],
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#232136] rounded-xl shadow-lg p-8 min-w-[350px] max-w-[95vw] relative">
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-[#A78BFA] text-xl"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-4 text-[#A78BFA] text-center">
                    Share Project
                </h2>
                <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Invite user by email</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="user@email.com"
                            className="flex-1 px-4 py-2 rounded-lg bg-[#191919] text-white border border-[#A78BFA]/60"
                        />
                        <button
                            className="px-4 py-2 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition"
                            onClick={handleAddEmail}
                            disabled={!newEmail || emails.includes(newEmail)}
                        >
                            Add
                        </button>
                    </div>
                </div>
                {emails.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm text-gray-300 mb-2">Shared with:</label>
                        <div className="space-y-2">
                            {emails.map(email => (
                                <div
                                    key={email}
                                    className="flex flex-col md:flex-row md:items-center justify-between bg-[#191919] rounded-lg px-4 py-2"
                                >
                                    <span className="text-white mb-2 md:mb-0">{email}</span>
                                    <div className="flex gap-2 items-center">
                                        <label className="flex items-center gap-1 text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={permissions[email]?.view || false}
                                                onChange={() =>
                                                    handleTogglePermission(email, 'view')
                                                }
                                            />
                                            View
                                        </label>
                                        <label className="flex items-center gap-1 text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={permissions[email]?.edit || false}
                                                onChange={() =>
                                                    handleTogglePermission(email, 'edit')
                                                }
                                            />
                                            Edit
                                        </label>
                                        <label className="flex items-center gap-1 text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={permissions[email]?.comment || false}
                                                onChange={() =>
                                                    handleTogglePermission(email, 'comment')
                                                }
                                            />
                                            Comment
                                        </label>
                                        <button
                                            className="text-gray-400 hover:text-red-400 ml-2"
                                            onClick={() => handleRemoveEmail(email)}
                                            title="Remove"
                                        >
                                            <i className="fa-solid fa-xmark" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {error && <div className="text-red-400 mb-2">{error}</div>}
                {success && <div className="text-green-400 mb-2">{success}</div>}
                <button
                    className="w-full py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition mt-4"
                    onClick={onShare}
                    disabled={loading || emails.length === 0}
                >
                    {loading ? 'Sharing...' : 'Share Project'}
                </button>
            </div>
        </div>
    );
}
