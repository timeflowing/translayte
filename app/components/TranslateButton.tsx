import React from 'react';

interface TranslateButtonProps {
    onClick: () => void;
    loading: boolean;
    isRetranslate?: boolean;
    disabled: boolean;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({
    onClick,
    loading,
    isRetranslate,
    disabled,
}) => (
    <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`w-full px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-all text-lg flex items-center justify-center gap-3 border-2 border-transparent
            ${
                disabled || loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-60 border-gray-300'
                    : 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#8B5CF6] border-[#8B5CF6]'
            }
        `}
        style={{ letterSpacing: '0.03em' }}
    >
        {loading ? (
            <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-xl" />
                <span className="animate-pulse">
                    {isRetranslate ? 'Retranslating…' : 'Translating…'}
                </span>
            </span>
        ) : (
            <>
                <i
                    className={`fa-solid fa-language text-xl drop-shadow ${
                        isRetranslate ? 'text-[#8B5CF6]' : 'text-white'
                    }`}
                />
                <span className="tracking-wide text-shadow-lg">
                    {isRetranslate ? 'Retranslate' : 'Translate'}
                </span>
            </>
        )}
    </button>
);

export default TranslateButton;
