'use client';

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import SynapseAnimation from '@/app/utils/SynapseAnimation';
import NavigationBar from '@/app/components/NavigationBar';
import { useParams } from 'next/navigation';

// Fallback Modal (can be replaced with your actual Modal component)
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

const ProjectPage = () => {
    // Use the official User type from firebase/auth
    const [user, loadingAuth] = useAuthState(auth);
    const [project, setProject] = useState<Project | null>(null);
    const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);

    const [permissions, setPermissions] = useState<{ [userId: string]: 'view' | 'edit' }>({});
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const projectId = params.id;

    // Fetch project details
    useEffect(() => {
        if (loadingAuth || !user || !projectId) {
            if (!loadingAuth && !user) {
                setError('You must be logged in to view this project.');
                setLoading(false);
            }
            return;
        }

        const fetchProject = async () => {
            setLoading(true);
            setError(null);
            try {
                // FIX: This is the correct and reliable way to get the token
                const token = await user.getIdToken();
                const response = await fetch(`/api/projects/${projectId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch project');
                }

                const data = await response.json();
                setProject(data);

                if (data.orgId) {
                    fetch(`/api/organizations/${data.orgId}/members`, {
                        headers: { authorization: `Bearer ${token}` },
                    })
                        .then(res => res.json())
                        .then(data => setOrgMembers(data.members || []))
                        .catch(() => setOrgMembers([]));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [user, projectId, loadingAuth]);

    // Share handler
    const handleShare = async () => {
        if (!user) return;
        try {
            // FIX: Use getIdToken() here as well for consistency and reliability
            const token = await user.getIdToken();
            await fetch(`/api/projects/${projectId}/share`, {
                method: 'POST',
                headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sharedWith: selectedUsers, permissions }),
            });
            setShowShareModal(false);
            // Optionally refetch project data to show changes
        } catch (err) {
            console.error('Failed to share project:', err);
            // You could show a toast notification here for the error
        }
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
                            <div className="bg-[#232136]/60 rounded-lg p-4 mb-6 text-white">
                                {project?.translation?.text || 'No translation yet.'}
                            </div>
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
