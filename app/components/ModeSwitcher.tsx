'use client';
import React from 'react';

const ModeSwitcher = ({
    mode,
    setMode,
    onCreateProject,
}: {
    mode: 'file' | 'keys';
    setMode: React.Dispatch<React.SetStateAction<'file' | 'keys'>>;
    onCreateProject?: () => void;
}) => (
    <div className="flex justify-center mb-10">
        <div className="inline-flex w-full max-w-xl gap-2 rounded-xl p-2 bg-[#0F0F0F] shadow-lg">
            {(['file', 'keys'] as const).map(m => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex flex-col items-center justify-center flex-1 px-3 py-3 rounded-lg border transition-all border-gray-700/50 ${
                            active ? 'bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]' : 'bg-primary/50'
                        } cursor-pointer`}
                    >
                        <i
                            className={
                                (m === 'file' ? 'fa-solid fa-file-arrow-up' : 'fa-solid fa-key') +
                                ' text-lg mb-1 ' +
                                (active ? 'text-[#8B5CF6]' : 'text-gray-400')
                            }
                        />
                        <span
                            className="font-bold text-sm"
                            style={{
                                color: active ? '#8B5CF6' : '#d1d5db',
                                fontWeight: active ? 800 : 600,
                            }}
                        >
                            {m === 'file' ? 'File Upload' : 'Key Input'}
                        </span>
                    </button>
                );
            })}
            <button
                onClick={onCreateProject}
                className="flex flex-col items-center justify-center px-4 py-3 rounded-lg border border-gray-700/50 bg-transparent text-gray-400 font-bold shadow-none hover:bg-gray-800/30 hover:text-white transition-all ml-2"
                title="Create New Project"
            >
                <i className="fa-solid fa-plus text-lg mb-1 text-gray-500 group-hover:text-white transition-colors" />
                <span className="text-sm font-bold">New Project</span>
            </button>
        </div>
    </div>
);

export default ModeSwitcher;
