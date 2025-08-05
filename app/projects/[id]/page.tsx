'use client';

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import SynapseAnimation from '@/app/utils/SynapseAnimation';
import NavigationBar from '@/app/components/NavigationBar';

// Fallback Modal if you don't have one
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#232136] rounded-xl shadow-lg p-6 min-w-[320px] relative">
            <button
                className="absolute top-2 right-2 text-gray-400 hover:text-[#A78BFA] text-xl"
                onClick={onClose}
                aria-label="Close"
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

// Types
interface OrgMember {
    uid: string;
    displayName?: string;
    email?: string;
}
interface Project {
    name?: string;
    status?: string;
    translation?: { text?: string };
    orgId?: string;
    sharedWith?: string[];
    permissions?: { [uid: string]: 'view' | 'edit' };
}

const ProjectPage = ({ params }: { params: { id: string } }) => {
    interface FirebaseUser {
        uid: string;
        email?: string;
        displayName?: string;
        accessToken?: string;
        stsTokenManager?: {
            accessToken: string;
        };
        [key: string]: unknown;
    }
    const [user] = useAuthState(auth) as [FirebaseUser | null, boolean, Error | undefined];
    const [project, setProject] = useState<Project | null>(null);
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);

    const [permissions, setPermissions] = useState<{ [userId: string]: 'view' | 'edit' }>({});
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch project details
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        setError(null);
        const accessToken =
            (user as FirebaseUser).accessToken ||
            (user as FirebaseUser).stsTokenManager?.accessToken;
        fetch(`/api/projects/${params.id}`, {
            headers: { authorization: `Bearer ${accessToken}` },
        })
            .then(res => res.json())
            .then(data => {
                if (!data.project) throw new Error(data.error || 'Project not found');
                setProject(data.project);
                // Fetch org members
                fetch(`/api/organizations/${data.project.orgId}/members`, {
                    headers: { authorization: `Bearer ${accessToken}` },
                })
                    .then(res => res.json())
                    .then(data => setOrgMembers(data.members || []))
                    .catch(() => setOrgMembers([]));
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load project.');
                setLoading(false);
            });
    }, [user, params.id]);

    // Share handler
    const handleShare = async () => {
        if (!user) return;
        const accessToken =
            (user as FirebaseUser).accessToken ||
            (user as FirebaseUser).stsTokenManager?.accessToken;
        await fetch(`/api/projects/${params.id}/share`, {
            method: 'POST',
            headers: { authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sharedWith: selectedUsers, permissions }),
        });
        setShowShareModal(false);
        // Optionally refetch project
    };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-br from-[#232136] to-[#191627]">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />

            <NavigationBar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex items-center justify-center relative">
                <div className="bg-[#191627]/70 border border-[#8B5CF6]/10 shadow-xl rounded-2xl p-10 max-w-2xl w-full mx-4 relative z-10">
                    {loading ? (
                        <div className="text-center text-gray-400">Loading...</div>
                    ) : error ? (
                        <div className="text-center text-red-400">{error}</div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-2 text-white text-center tracking-tight">
                                Project: {project?.name || 'Untitled'}
                            </h1>
                            <p className="text-gray-300 text-center mb-8 text-base">
                                Translation status:{' '}
                                <span className="font-bold text-[#A78BFA]">{project?.status}</span>
                            </p>
                            {/* Translation content */}
                            <div className="bg-[#232136]/60 rounded-lg p-4 mb-6 text-white">
                                {project?.translation?.text || 'No translation yet.'}
                            </div>
                            {/* Share Button */}
                            <button
                                className="py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition flex items-center gap-2 mb-6"
                                onClick={() => setShowShareModal(true)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Share Project
                            </button>
                            {/* Shared Users List */}
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-white mb-2">
                                    Shared With
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {project?.sharedWith?.length ? (
                                        project.sharedWith.map(uid => (
                                            <span
                                                key={uid}
                                                className="bg-[#A78BFA]/20 text-[#A78BFA] px-3 py-1 rounded-full text-sm font-semibold"
                                            >
                                                {uid} ({project.permissions?.[uid]})
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400">Not shared yet.</span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Share Modal */}
            {showShareModal && (
                <Modal onClose={() => setShowShareModal(false)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-[#A78BFA]">Share Project</h2>
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">
                                Select users to share with:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {orgMembers.map(member => (
                                    <label
                                        key={member.uid}
                                        className="flex items-center gap-2 bg-[#232136]/60 px-3 py-2 rounded-lg text-white"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(member.uid)}
                                            onChange={e => {
                                                setSelectedUsers(prev =>
                                                    e.target.checked
                                                        ? [...prev, member.uid]
                                                        : prev.filter(uid => uid !== member.uid),
                                                );
                                            }}
                                        />
                                        {member.displayName || member.email || member.uid}
                                        <select
                                            className="ml-2 bg-[#191627] text-[#A78BFA] rounded px-2 py-1"
                                            value={permissions[member.uid] || 'view'}
                                            onChange={e =>
                                                setPermissions(prev => ({
                                                    ...prev,
                                                    [member.uid]: e.target.value as 'view' | 'edit',
                                                }))
                                            }
                                        >
                                            <option value="view">View</option>
                                            <option value="edit">Edit</option>
                                        </select>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            className="py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition w-full"
                            onClick={handleShare}
                        >
                            Share
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ProjectPage;
