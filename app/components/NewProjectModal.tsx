import React, { useState } from 'react';

interface NewProjectModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, users: string[]) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ open, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [userInput, setUserInput] = useState('');
    const [users, setUsers] = useState<string[]>([]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-[#191919] border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl relative">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    onClick={onClose}
                >
                    <i className="fa-solid fa-xmark text-lg" />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
                <label className="block text-gray-300 mb-2 font-medium">Project Name</label>
                <input
                    className="w-full mb-4 px-3 py-2 rounded border border-gray-700/50 bg-transparent text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter project name"
                />
                <label className="block text-gray-300 mb-2 font-medium">
                    Invite Users (emails, optional)
                </label>
                <div className="flex gap-2 mb-4">
                    <input
                        className="flex-1 px-3 py-2 rounded border border-gray-700/50 bg-transparent text-white focus:outline-none focus:border-[#8B5CF6]"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Add user email and press Enter"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && userInput.trim()) {
                                setUsers([...users, userInput.trim()]);
                                setUserInput('');
                                e.preventDefault();
                            }
                        }}
                    />
                    <button
                        className="px-3 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                        onClick={() => {
                            if (userInput.trim()) {
                                setUsers([...users, userInput.trim()]);
                                setUserInput('');
                            }
                        }}
                        type="button"
                    >
                        <i className="fa-solid fa-plus" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {users.map((u, i) => (
                        <span
                            key={i}
                            className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full flex items-center gap-2"
                        >
                            {u}
                            <button
                                className="ml-1 text-gray-400 hover:text-red-400"
                                onClick={() => setUsers(users.filter((_, idx) => idx !== i))}
                                type="button"
                            >
                                <i className="fa-solid fa-xmark text-xs" />
                            </button>
                        </span>
                    ))}
                </div>
                <button
                    className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-700/50 bg-[#232323]/60 text-gray-200 font-semibold hover:bg-[#232323]/80 transition"
                    disabled={!name.trim()}
                    onClick={() => {
                        onCreate(name.trim(), users);
                        setName('');
                        setUsers([]);
                        setUserInput('');
                    }}
                >
                    Create Project
                </button>
            </div>
        </div>
    );
};

export default NewProjectModal;
