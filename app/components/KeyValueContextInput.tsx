'use client';
import React, { useState, useEffect } from 'react';

interface Entry {
    key: string;
    value: string;
    context: string;
}

export default function KeyValueContextInput({
    onChange,
    rows: initialRows,
}: {
    onChange: (entries: Entry[]) => void;
    rows: Entry[];
}) {
    const [rows, setRows] = useState<Entry[]>(initialRows);

    const updateRow = (index: number, field: keyof Entry, value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
        onChange(newRows);

        // If editing the last row and both key & value are filled, add a new row automatically
        if (
            index === newRows.length - 1 &&
            field !== 'context' &&
            newRows[index].key.trim() &&
            newRows[index].value.trim()
        ) {
            setRows([...newRows, { key: '', value: '', context: '' }]);
        }
    };

    const addRow = () => {
        setRows([...rows, { key: '', value: '', context: '' }]);
    };

    const removeRow = (index: number) => {
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows.length ? newRows : [{ key: '', value: '', context: '' }]);
        onChange(newRows);
    };

    return (
        <div className="bg-[#0F0F0F] border border-gray-700/50 shadow-xl rounded-xl p-6 w-full max-w-4xl mx-auto">
            <div className="flex flex-col gap-4">
                {rows.map((row, index) => (
                    <div
                        key={index}
                        className="flex flex-col md:flex-row items-start md:items-center gap-2"
                    >
                        <span className="w-6 text-right text-gray-400 font-mono">{index + 1}.</span>
                        <input
                            className="w-full md:w-1/3 focus:outline-none bg-transparent border border-gray-700/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/40 transition"
                            placeholder="Key"
                            value={row.key}
                            onChange={e => updateRow(index, 'key', e.target.value)}
                        />
                        <input
                            className="w-full md:w-1/3 focus:outline-none bg-transparent border border-gray-700/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/40 transition"
                            placeholder="Value"
                            value={row.value}
                            onChange={e => updateRow(index, 'value', e.target.value)}
                        />
                        <input
                            className="w-full md:w-1/3 focus:outline-none bg-transparent border border-gray-700/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/40 transition"
                            placeholder="Context (optional)"
                            value={row.context}
                            onChange={e => updateRow(index, 'context', e.target.value)}
                        />
                        <button
                            onClick={() => removeRow(index)}
                            className="text-sm text-gray-400 hover:text-red-500 mt-2 md:mt-0"
                            title="Remove row"
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={addRow}
                className="inline-flex items-center gap-2 mt-6 text-sm text-[#8B5CF6] hover:underline"
            >
                <i className="fa-solid fa-plus" />
                Add Key
            </button>
        </div>
    );
}
