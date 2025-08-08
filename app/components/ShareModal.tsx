'use client';
import React, { useState, useEffect } from 'react';

// --- TYPES ---
type Role = 'viewer' | 'editor';
interface UserPermission {
    email: string;
    name: string;
    avatarUrl?: string;
    role: Role;
}

interface ShareModalProps {
    projectId: string;
    link: string;
    onClose: () => void;
    // fetch, update, and addUser should use your backend (Firestore)
    fetchPermissions: () => Promise<UserPermission[]>;
    updatePermission: (email: string, role: Role) => Promise<void>;
    removeUser: (email: string) => Promise<void>;
    addUser: (email: string, role: Role) => Promise<void>;
    generalAccess: { enabled: boolean; role: Role };
    setGeneralAccess: (role: Role) => Promise<void>;
}

// --- COMPONENT ---
export default function ShareProjectModal({
    projectId,
    link,
    onClose,
    fetchPermissions,
    updatePermission,
    removeUser,
    addUser,
    generalAccess,
    setGeneralAccess,
}: ShareModalProps) {
    const [users, setUsers] = useState<UserPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<Role>('viewer');
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch user permissions on open
    useEffect(() => {
        setLoading(true);
        fetchPermissions()
            .then(setUsers)
            .catch(() => setError('Failed to load users.'))
            .finally(() => setLoading(false));
    }, [fetchPermissions]);

    // Add user
    const handleAddUser = async () => {
        if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError('Invalid email');
        setError(null);
        setLoading(true);
        try {
            await addUser(newEmail, newRole);
            setUsers(await fetchPermissions());
            setNewEmail('');
        } catch {
            setError('Failed to add user.');
        }
        setLoading(false);
    };

    // Update user role
    const handleRoleChange = async (email: string, role: Role) => {
        setLoading(true);
        await updatePermission(email, role);
        setUsers(await fetchPermissions());
        setLoading(false);
    };

    // Remove user
    const handleRemove = async (email: string) => {
        setLoading(true);
        await removeUser(email);
        setUsers(await fetchPermissions());
        setLoading(false);
    };

    // Copy link
    const handleCopy = async () => {
        await navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1200);
    };

    // Update general access
    const handleGeneralAccess = async (role: Role) => {
        setLoading(true);
        await setGeneralAccess(role);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="relative bg-[#232136] rounded-xl shadow-xl p-8 w-full max-w-lg mx-4">
                {/* Close */}
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-[#A78BFA] text-2xl"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-4 text-[#A78BFA] text-center">
                    Share Translation Project
                </h2>

                {/* Project Link */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Project Link</label>
                    <div className="flex items-center gap-2">
                        <input
                            className="flex-1 px-3 py-2 rounded-lg bg-[#191627] text-white border border-[#A78BFA]/30"
                            value={link}
                            readOnly
                        />
                        <button
                            onClick={handleCopy}
                            className="bg-[#A78BFA] hover:bg-[#7C5AE6] text-white px-3 py-2 rounded-lg text-sm font-semibold"
                        >
                            {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Permissions</label>
                    {loading ? (
                        <div className="text-center text-gray-400">Loading...</div>
                    ) : (
                        users.map(user => (
                            <div
                                key={user.email}
                                className="flex items-center justify-between gap-3 bg-[#191627] rounded-lg px-4 py-2 mb-2"
                            >
                                {/* Avatar */}
                                <div className="flex items-center gap-3">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                            {user.name?.[0] || user.email[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-white font-semibold">
                                            {user.name || user.email}
                                        </div>
                                        <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                </div>
                                {/* Role Dropdown */}
                                <select
                                    className="bg-[#2a273f] text-white px-2 py-1 rounded-lg"
                                    value={user.role}
                                    onChange={e =>
                                        handleRoleChange(user.email, e.target.value as Role)
                                    }
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </select>
                                {/* Remove */}
                                <button
                                    className="ml-2 text-gray-400 hover:text-red-400 text-lg"
                                    onClick={() => handleRemove(user.email)}
                                    title="Remove"
                                >
                                    &times;
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add People */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Add people by email"
                            className="flex-1 px-3 py-2 rounded-lg bg-[#191627] text-white border border-[#A78BFA]/30"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddUser()}
                            disabled={loading}
                        />
                        <select
                            className="bg-[#2a273f] text-white px-2 py-1 rounded-lg"
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as Role)}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                        <button
                            className="bg-[#A78BFA] hover:bg-[#7C5AE6] text-white px-4 py-2 rounded-lg font-semibold"
                            onClick={handleAddUser}
                            disabled={loading}
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* General Access */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">General Access</label>
                    <div className="flex items-center justify-between bg-[#191627] px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="bg-[#A78BFA] text-white rounded-full w-8 h-8 flex items-center justify-center">
                                <i className="fa-solid fa-link"></i>
                            </span>
                            <div>
                                <div className="text-white font-semibold">Anyone with the link</div>
                                <div className="text-xs text-gray-400">
                                    Anyone on the internet with the link can access
                                </div>
                            </div>
                        </div>
                        {generalAccess && (
                            <select
                                className="bg-[#2a273f] text-white px-2 py-1 rounded-lg"
                                value={generalAccess.role}
                                onChange={e => handleGeneralAccess(e.target.value as Role)}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Errors */}
                {error && <div className="text-red-400 mb-2">{error}</div>}

                <button
                    className="w-full py-2 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition mt-2"
                    onClick={onClose}
                >
                    Done
                </button>
            </div>
        </div>
    );
}
