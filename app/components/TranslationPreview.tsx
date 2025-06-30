/* ----------------------------------------------------------------
   TranslationPreview.tsx – SHOW TWO FLAT JSON OBJECTS SIDE-BY-SIDE
   ---------------------------------------------------------------- */
'use client';

import React from 'react';

type PreviewProps = {
    original: Record<string, string>; // EN flat:  key → text
    translated: Record<string, string>; // target flat: key → text
    targetLangCode: string; // e.g. "es_XX"
    targetShortcut: string; // e.g. "ES"
};

export default function TranslationPreview({
    original,
    translated,
    targetLangCode,
    targetShortcut,
}: PreviewProps) {
    /* pretty-print but keep keys unquoted-ish */
    const fmt = (obj: Record<string, string>) =>
        JSON.stringify(obj, null, 2).replace(/"(.*?)":/g, '"$1":');

    const Badge = ({
        children,
        className = '',
    }: {
        children: React.ReactNode;
        className?: string;
    }) => (
        <span
            aria-label="language shortcut"
            className={`ml-2 px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide ${className}`}
        >
            {children}
        </span>
    );

    return (
        <div className="w-[100vw] -mx-4 sm:-mx-8 px-4 sm:px-8 py-6">
            <div className="rounded-xl border border-gray-700/70 bg-[#0d0d0f]/80 shadow-lg p-6">
                {/* ---------- header ---------- */}
                <header className="mb-4 flex justify-between items-center">
                    <span className="flex items-center text-sm font-semibold text-gray-400">
                        ORIGINAL&nbsp;<span className="hidden sm:inline">(ENGLISH)</span>
                        <Badge className="bg-[#1e40af] text-white">EN</Badge>
                    </span>

                    <span className="flex items-center text-sm font-semibold text-gray-400">
                        TRANSLATED&nbsp;
                        <span className="hidden sm:inline">
                            ({targetLangCode.toUpperCase().replace('_XX', '')})
                        </span>
                        <Badge className="bg-[#064e3b] text-white">{targetShortcut}</Badge>
                    </span>
                </header>

                {/* ---------- code panes ---------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* left: EN */}
                    <pre className="scrollbar-hide rounded-lg bg-[#0b1120] p-4 text-[13px] leading-5 text-[#7dd3fc] overflow-x-auto">
                        {fmt(original)}
                    </pre>

                    {/* right: target */}
                    <pre className="scrollbar-hide rounded-lg bg-[#0b0f19] p-4 text-[13px] leading-5 text-[#fca5a5] overflow-x-auto">
                        {fmt(translated)}
                    </pre>
                </div>
            </div>

            {/* hide scrollbars for the <pre> blocks */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none; /* IE & Edge */
                    scrollbar-width: none; /* Firefox   */
                }
            `}</style>
        </div>
    );
}
