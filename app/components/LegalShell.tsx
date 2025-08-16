// ============================================================================
// components/LegalShell.tsx
// ============================================================================
'use client';
import React from 'react';

export default function LegalShell({
    title,
    subtitle,
    children,
    lastUpdated = 'August 16, 2025',
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    lastUpdated?: string;
}) {
    return (
        <main className="relative min-h-screen bg-white text-slate-800">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.04),rgba(0,0,0,0))]" />
            <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
                <header className="mb-8 sm:mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        {title}
                    </h1>
                    {subtitle ? <p className="mt-2 text-sm text-neutral-600">{subtitle}</p> : null}
                    <p className="mt-2 text-xs text-neutral-500">Last updated: {lastUpdated}</p>
                </header>
                <article className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:mt-10 prose-h2:text-xl prose-h3:mt-6 prose-h3:text-lg prose-p:leading-relaxed prose-a:font-medium prose-a:text-violet-600 prose-a:no-underline hover:prose-a:text-violet-800">
                    {children}
                </article>
            </section>
        </main>
    );
}
