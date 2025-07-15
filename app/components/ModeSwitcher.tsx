'use client';

import React from 'react';

export const ModeSwitcher = ({
    mode,
    setMode,
}: {
    mode: 'file' | 'keys';
    setMode: React.Dispatch<React.SetStateAction<'file' | 'keys'>>;
}) => (
    <div className="flex justify-center mb-10">
        <div className="inline-flex w-full max-w-xl gap-2 rounded-xl p-2 bg-[#0F0F0F] shadow-lg">
            {(['file', 'keys'] as const).map(m => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex flex-col items-center justify-center flex-1 px-3 py-3 rounded-lg border transition-all
                            border-gray-700/50
                            ${active ? 'bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]' : 'bg-primary/50'}
                            cursor-pointer
                        `}
                    >
                        <i
                            className={`${
                                m === 'file' ? 'fa-solid fa-file-arrow-up' : 'fa-solid fa-key'
                            } text-lg mb-1 ${active ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
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
        </div>
    </div>
);
