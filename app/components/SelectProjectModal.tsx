import React from 'react';

export type HistoryItem = {
    id: string;
    userId?: string;
    fileName?: string;
    targetLanguages?: string[];
    translationResult?: Record<string, Record<string, string>>;
    createdAt?: { seconds: number; nanoseconds: number };
};

interface SelectProjectModalProps {
    history: HistoryItem[];
    onSelect: (id: string) => void;
    onClose: () => void;
}

const SelectProjectModal: React.FC<SelectProjectModalProps> = ({ history, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#18132a] border-2 border-[#8B5CF6] rounded-2xl p-7 w-full max-w-md shadow-2xl relative animate-fadeIn">
                <h2 className="text-2xl font-extrabold text-white mb-5 flex items-center gap-2">
                    <span className="inline-block w-2 h-6 rounded bg-gradient-to-b from-[#8B5CF6] to-[#7C3AED] mr-2" />
                    Select a Project to Share
                </h2>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#2a1e4a] rounded-lg bg-[#19132a]/60 border border-[#2a1e4a] mb-2">
                    {history.length === 0 ? (
                        <div className="text-gray-400 text-center py-10">
                            <i className="fa-regular fa-folder-open text-3xl text-[#8B5CF6] mb-3" />
                            <div>No projects found in your history.</div>
                        </div>
                    ) : (
                        history.map(item => (
                            <button
                                key={item.id}
                                className="w-full text-left px-4 py-3 transition-all rounded-lg flex flex-col mb-1 border-2 border-transparent hover:border-[#8B5CF6] hover:bg-[#22184a]/80 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] group"
                                onClick={() => onSelect(item.id)}
                            >
                                <span className="font-semibold text-white group-hover:text-[#a78bfa] transition-colors">
                                    {item.fileName || 'Untitled'}
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-[#c4b5fd] transition-colors">
                                    {item.id}
                                </span>
                            </button>
                        ))
                    )}
                </div>
                <button
                    className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg font-bold shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all text-lg"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <style jsx>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.97);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                `}</style>
            </div>
        </div>
    );
};

export default SelectProjectModal;
