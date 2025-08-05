'use client';

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import Modal from '@/app/components/Modal';

const HistoryPage = () => {
    const [user] = useAuthState(auth);
    const [history, setHistory] = useState<any[]>([]); // Load your history as needed
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState<any>(null);
    const [projectName, setProjectName] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [orgs, setOrgs] = useState<any[]>([]);

    // Fetch organizations for picker
    React.useEffect(() => {
        if (!user) return;
        const accessToken = (user as any).accessToken || (user as any).stsTokenManager?.accessToken;
        fetch('/api/organizations', {
            headers: { authorization: `Bearer ${accessToken}` },
        })
            .then(res => res.json())
            .then(data => setOrgs(data.organizations || []));
    }, [user]);

    // Fetch history
    React.useEffect(() => {
        if (!user) return;
        const accessToken = (user as any).accessToken || (user as any).stsTokenManager?.accessToken;
        fetch('/api/history', {
            headers: { authorization: `Bearer ${accessToken}` },
        })
            .then(res => res.json())
            .then(data => setHistory(data.history || []));
    }, [user]);

    // Save as project handler
    const handleCreateProject = async () => {
        if (!user || !selectedTranslation || !projectName || !selectedOrgId) return;
        const accessToken = (user as any).accessToken || (user as any).stsTokenManager?.accessToken;
        await fetch('/api/projects', {
            method: 'POST',
            headers: { authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: projectName,
                translation: selectedTranslation,
                orgId: selectedOrgId,
            }),
        });
        setShowCreateProjectModal(false);
        setProjectName('');
        setSelectedOrgId('');
        setSelectedTranslation(null);
        // Optionally show success or refresh projects
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#232136] to-[#191627]">
            {/* ...your header/navigation... */}
            <div className="max-w-2xl mx-auto py-16 px-4 mt-16">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                    Translation History
                </h1>
                <div className="grid gap-6">
                    {history.map((translation, idx) => (
                        <div
                            key={idx}
                            className="bg-[#232136]/80 border border-[#8B5CF6]/10 rounded-xl p-6 text-white mb-4 flex items-center gap-4"
                        >
                            {/* Icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-[#A78BFA] flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 17l4 4 4-4m0-5V3a1 1 0 00-1-1H7a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1z"
                                />
                            </svg>
                            {/* Translation text */}
                            <div className="flex-1">{translation.text}</div>
                            <button
                                className="py-2 px-4 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition mt-2"
                                onClick={() => {
                                    setSelectedTranslation(translation);
                                    setShowCreateProjectModal(true);
                                }}
                            >
                                Save as Project
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <Modal onClose={() => setShowCreateProjectModal(false)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-[#A78BFA]">
                            Create Project from Translation
                        </h2>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            className="mb-4 px-4 py-2 rounded-lg bg-[#232136] text-white border border-[#8B5CF6]/30 w-full"
                        />
                        <select
                            value={selectedOrgId}
                            onChange={e => setSelectedOrgId(e.target.value)}
                            className="mb-4 px-4 py-2 rounded-lg bg-[#232136] text-white border border-[#8B5CF6]/30 w-full"
                        >
                            <option value="">Select Organization</option>
                            {orgs.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition w-full"
                            onClick={handleCreateProject}
                        >
                            Create Project
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default HistoryPage;
