'use client';

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/lib/firebaseClient';
import SynapseAnimation from '../utils/SynapseAnimation';
import NavigationBar from '../components/NavigationBar';

interface ProjectListItem {
    id: string;
    name?: string;
    status?: string;
}

const ProjectsListPage = () => {
    const [user] = useAuthState(auth);
    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        interface FirebaseUserWithToken {
            accessToken?: string;
            stsTokenManager?: {
                accessToken?: string;
            };
        }

        const firebaseUser = user as unknown as FirebaseUserWithToken;
        const accessToken = firebaseUser.accessToken || firebaseUser.stsTokenManager?.accessToken;

        fetch('/api/projects', {
            headers: { authorization: `Bearer ${accessToken}` },
        })
            .then(res => res.json())
            .then(data => {
                setProjects(data.projects || []);
                setLoading(false);
            });
    }, [user]);

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            <SynapseAnimation className="absolute inset-0 w-full h-full -z-10 pointer-events-none" />
            <NavigationBar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <div className="flex-1 flex items-center justify-center relative">
                <div className="max-w-3xl w-full mx-auto py-16 px-4 mt-16">
                    <h1 className="text-3xl font-bold text-white mb-8 text-center">
                        Your Projects
                    </h1>
                    {loading ? (
                        <div className="text-gray-400 text-center">Loading...</div>
                    ) : projects.length === 0 ? (
                        <div className="text-gray-400 text-center">No projects found.</div>
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectsListPage;
