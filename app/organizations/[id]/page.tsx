'use client';

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import NavigationBar from '@/app/components/NavigationBar';
import SynapseAnimation from '@/app/utils/SynapseAnimation';
import { useParams } from 'next/navigation';

interface OrganizationMember {
    id: string;
    name: string;
    email?: string;
}

interface Organization {
    id: string;
    name: string;
    members?: OrganizationMember[];
}

interface Project {
    id: string;
    name?: string;
    status?: string;
}

export default function OrganizationDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [user] = useAuthState(auth);
    const [org, setOrg] = useState<Organization | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !id) return;

        let ignore = false;
        (async () => {
            // Use a real ID token, not uid
            const accessToken = await user.getIdToken();
            const res = await fetch(`/api/organizations/${id}`, {
                headers: { authorization: `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (!ignore) {
                setOrg(data.organization);
                setProjects(data.projects || []);
                setLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [user, id]);

    if (!id) {
        return <div>Error: Organization ID not found.</div>;
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-br from-[#232136] to-[#191627]">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
            <NavigationBar mobileMenuOpen={false} setMobileMenuOpen={() => {}} />
            <div className="max-w-2xl mx-auto py-16 px-4 mt-16">
                {loading ? (
                    <div className="text-gray-400 text-center">Loading...</div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-white mb-4 text-center">
                            {org?.name}
                        </h1>
                        <div className="mb-8 text-center text-gray-300">
                            Members: {org?.members?.length ?? 0}
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-4">Projects</h2>
                        <div className="grid gap-6">
                            {projects.map(project => (
                                <a
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="block bg-[#232136]/80 border border-[#8B5CF6]/10 rounded-xl p-6 text-white hover:bg-[#232136]/60 transition"
                                >
                                    <div className="font-semibold text-lg">
                                        {project.name || 'Untitled Project'}
                                    </div>
                                    <div className="text-sm text-[#A78BFA] mt-2">
                                        Status: {project.status || 'N/A'}
                                    </div>
                                </a>
                            ))}
                        </div>
                        <button
                            className="py-2 px-4 rounded-lg bg-[#A78BFA] hover:bg-[#7C5AE6] text-white font-semibold transition mt-2"
                            onClick={() => {
                                /* open modal or redirect to project creation form */
                            }}
                        >
                            Create New Project
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
