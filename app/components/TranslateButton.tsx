'use client';
import React from 'react';

export const TranslateButton = ({
    onClick,
    loading,
}: {
    onClick: () => void;
    loading: boolean;
}) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center px-8 py-4 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-[#8B5CF6] to-[#5A3E8A] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
    >
        {loading ? (
            <>
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Translating...
            </>
        ) : (
            <>
                <i className="fa-solid fa-bolt mr-2" />
                Translate
            </>
        )}
    </button>
);
