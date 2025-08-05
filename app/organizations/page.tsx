'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import NavigationBar from '@/app/components/NavigationBar';
import SynapseAnimation from '@/app/utils/SynapseAnimation';

const OrganizationsPage = () => {
    const [user] = useAuthState(auth);
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrgName, setNewOrgName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        const accessToken = (user as any).accessToken || (user as any).stsTokenManager?.accessToken;
        fetch('/api/organizations', {
            headers: { authorization: `Bearer ${accessToken}` },
        })
            .then(res => res.json())
            .then(data => {
                setOrgs(data.organizations || []);
                setLoading(false);
            });
    }, [user]);

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return;
        setCreating(true);
        const accessToken = (user as any).accessToken || (user as any).stsTokenManager?.accessToken;
        await fetch('/api/organizations', {
            method: 'POST',
            headers: { authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newOrgName }),
        });
        setNewOrgName('');
        setCreating(false);
        // Optionally refetch orgs
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-br from-[#232136] to-[#191627]">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
            <NavigationBar mobileMenuOpen={false} setMobileMenuOpen={() => {}} />
            <div className="max-w-2xl mx-auto py-16 px-4 mt-16">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                    Your Organizations
                </h1>
                {loading ? (
                    <div className="text-gray-400 text-center">Loading...</div>
                ) : (
                    <div className="grid gap-6 mb-8">
                        {orgs.map(org => (
                            <a
                                key={org.id}
                                href={`/organizations/${org.id}`}
                                className="block bg-[#232136]/80 border border-[#8B5CF6]/10 rounded-xl p-6 text-white hover:bg-[#232136]/60 transition"
                            >
                                <div className="font-semibold text-lg">{org.name}</div>
                                <div className="text-sm text-[#A78BFA] mt-2">
                                    Members: {org.members?.length || 1}
                                </div>
                            </a>
                        ))}
                    </div>
                )}
                <div className="mt-8">
                    <input
                        type="text"
                        value={newOrgName}
                        onChange={e => setNewOrgName(e.target.value)}
                        placeholder="New organization name"
                        className="px-4 py-2 rounded-lg bg-[#232136] text-white border border-[#8B5CF6]/30 mr-2"
                    />
                    <button
                        className="py-2 px-6 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition"
                        onClick={handleCreateOrg}
                        disabled={creating}
                    >
                        {creating ? 'Creating...' : 'Create Organization'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default OrganizationsPage;
