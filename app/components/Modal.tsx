'use client';
import React from 'react';

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#232136] rounded-xl shadow-lg p-6 min-w-[320px] relative">
            <button
                className="absolute top-2 right-2 text-gray-400 hover:text-[#A78BFA] text-xl"
                onClick={onClose}
                aria-label="Close"
            >
                &times;
            </button>
            {children}
        </div>
    </div>
);

export default Modal;
