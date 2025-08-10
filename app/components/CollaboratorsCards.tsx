import Image from 'next/image';

export function CollaboratorsCard({
    collaborators,
    onInviteClick,
}: {
    collaborators: {
        uid: string;
        displayName: string;
        photoURL?: string;
        isEditing: boolean;
        lastEditAt?: number;
        isOnline: boolean;
    }[];
    onInviteClick: () => void;
}) {
    const timeAgo = (ts?: number) => {
        if (!ts) return '—';
        const diff = Date.now() - ts;
        const m = Math.round(diff / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.round(m / 60);
        return `${h}h ago`;
    };

    return (
        <div className="bg-[#191919]/70 rounded-lg p-4 border border-gray-700">
            <h3 className="text-base font-semibold text-white mb-3">Collaborators</h3>
            <ul className="space-y-3">
                {collaborators.map(c => (
                    <li key={c.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {c.photoURL ? (
                                <Image
                                    src={c.photoURL}
                                    alt={c.displayName}
                                    width={28}
                                    height={28}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                                    {c.displayName.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="text-sm text-white">{c.displayName}</div>
                                <div className="text-xs text-gray-400">
                                    {c.isOnline
                                        ? c.isEditing
                                            ? 'Editing now'
                                            : 'Online'
                                        : `Last edit: ${timeAgo(c.lastEditAt)}`}
                                </div>
                            </div>
                        </div>
                        <span
                            className={`text-xs px-2 py-1 rounded ${
                                c.isOnline
                                    ? 'bg-green-900/40 text-green-300'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            {c.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onInviteClick}
                className="mt-4 w-full py-2 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition flex items-center justify-center gap-2"
            >
                <i className="fa-solid fa-share-nodes" />
                Share Project
            </button>
        </div>
    );
}
