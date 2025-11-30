'use client';
import React from 'react';

const ModeSwitcher = ({
    mode,
    setMode,
}: {
    mode: 'file' | 'keys' | 'text';
    setMode: React.Dispatch<React.SetStateAction<'file' | 'keys' | 'text'>>;
}) => (
    <div className="flex justify-center mb-10">
        <div className="inline-flex w-full max-w-xl gap-2 rounded-xl p-2 bg-[#0F0F0F] shadow-lg">
            {(['file', 'keys', 'text'] as const).map(m => {
                const active = mode === m;
                let icon = '';
                let label = '';
                if (m === 'file') {
                    icon = 'fa-solid fa-file-arrow-up';
                    label = 'File Upload';
                } else if (m === 'keys') {
                    icon = 'fa-solid fa-key';
                    label = 'Key Input';
                } else if (m === 'text') {
                    icon = 'fa-solid fa-font';
                    label = 'Text Input';
                }
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
                                icon +
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
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

export default ModeSwitcher;
