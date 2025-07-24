'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
interface HistoryItem {
    id: string;
    fileName?: string;
    createdAt?: { seconds: number; nanoseconds: number };
    targetLanguages?: string[]; // Added property for target languages
    // Add other properties from your history item type if needed
    // [key: string]: any; // Removed to avoid 'any' type error
}

interface HistoryAsideProps {
    history: HistoryItem[];
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onUpdateTitle: (id: string, newTitle: string) => void;
    loading: boolean;
}

const ITEMS_PER_PAGE = 5;

export const HistoryAside: React.FC<HistoryAsideProps> = ({
    history,
    onLoad,
    onDelete,
    onUpdateTitle,
    loading,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    // Dynamically create the map from your LANGUAGE_OPTIONS constant
    const formatDateTime = (date: Date) => {
        return `${date.toLocaleDateString()}   ${date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })}`;
    };

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedHistory = history.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleDoubleClick = (item: HistoryItem) => {
        setEditingId(item.id);
        setEditingText(item.fileName ?? 'Untitled');
    };

    const handleSave = (id: string) => {
        if (editingText.trim()) {
            onUpdateTitle(id, editingText.trim());
        } else {
            toast.error('Title cannot be empty.');
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleSave(id);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <i className="fa-solid fa-spinner fa-spin text-xl text-[#8B5CF6]"></i>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center text-sm text-gray-500 py-4">
                No translation history found.
            </div>
        );
    }

    return (
        <div>
            <ul className="space-y-2">
                {paginatedHistory.map(item => (
                    <li
                        key={item.id}
                        onDoubleClick={() => handleDoubleClick(item)}
                        className="group bg-[#0F0F0F] p-3 rounded-lg border border-gray-700/50 transition-all hover:border-[#8B5CF6]/70 hover:bg-[#8B5CF6]/10 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 overflow-hidden">
                                {editingId === item.id ? (
                                    <input
                                        type="text"
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        onBlur={() => handleSave(item.id)}
                                        onKeyDown={e => handleKeyDown(e, item.id)}
                                        className="text-sm font-medium text-white bg-transparent border-b border-[#8B5CF6] focus:outline-none w-full"
                                        autoFocus
                                        onDoubleClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <p
                                            className="text-sm font-medium text-white truncate"
                                            title={item.fileName ?? 'Untitled'}
                                        >
                                            {item.fileName ?? 'Untitled'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {item.createdAt?.seconds
                                                ? formatDateTime(
                                                      new Date(item.createdAt.seconds * 1000),
                                                  )
                                                : 'No date'}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-end min-w-[50px]">
                                    <span
                                        className="px-2 py-0.5 text-xs font-semibold text-white bg-[#8B5CF6] rounded-full"
                                        title={`${(item.targetLanguages || []).length} languages`}
                                    >
                                        {(item.targetLanguages || []).length} lang
                                    </span>
                                </div>
                                <div
                                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onDoubleClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => onLoad(item)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-600/50 hover:bg-[#8B5CF6] text-white transition"
                                        title="Load translation"
                                    >
                                        <i className="fa-solid fa-arrow-rotate-left text-xs" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Are you sure you want to delete this item?',
                                                )
                                            ) {
                                                onDelete(item.id);
                                            }
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-600/50 hover:bg-red-500 text-white transition"
                                        title="Delete translation"
                                    >
                                        <i className="fa-solid fa-trash text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs rounded-md bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Prev
                    </button>
                    <span className="text-xs text-gray-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs rounded-md bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};
