'use client';
import React, { useState } from 'react';

interface ShareUser {
    uid: string;
    email: string;
    canEdit: boolean;
}

export default function ShareModal({
    open,
    onClose,

    sharedWith,
    onShare,
}: {
    open: boolean;
    onClose: () => void;
    translationId: string;
    sharedWith: ShareUser[];
    onShare: (users: ShareUser[]) => void;
}) {
    const [email, setEmail] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [pending, setPending] = useState(false);

    const handleAdd = async () => {
        setPending(true);
        // TODO: Replace with your user lookup logic
        const user = await fetch(`/api/userByEmail?email=${encodeURIComponent(email)}`).then(res =>
            res.json(),
        );
        if (user?.uid) {
            onShare([...sharedWith, { uid: user.uid, email, canEdit }]);
            setEmail('');
            setCanEdit(false);
        }
        setPending(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-[#18181b] rounded-xl p-6 w-full max-w-md border border-gray-700">
                <h2 className="text-lg font-bold mb-4 text-purple-300">Share Translation</h2>
                <div className="mb-4">
                    <input
                        className="w-full px-3 py-2 rounded bg-[#222] border border-gray-700 text-gray-200"
                        placeholder="User email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={pending}
                    />
                    <label className="flex items-center mt-2 gap-2 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={canEdit}
                            onChange={e => setCanEdit(e.target.checked)}
                            disabled={pending}
                        />
                        Can edit
                    </label>
                    <button
                        className="mt-3 px-4 py-2 rounded bg-purple-700 text-white text-sm hover:bg-purple-800"
                        onClick={handleAdd}
                        disabled={pending || !email}
                    >
                        Add
                    </button>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Shared With:</h3>
                    <ul>
                        {sharedWith.map(u => (
                            <li key={u.uid} className="flex items-center gap-2 mb-1">
                                <span className="text-gray-200">{u.email}</span>
                                <span
                                    className={`text-xs ${
                                        u.canEdit ? 'text-green-400' : 'text-gray-400'
                                    }`}
                                >
                                    {u.canEdit ? 'Can edit' : 'View only'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    className="mt-4 px-4 py-2 rounded bg-gray-700 text-white text-sm hover:bg-gray-800"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
