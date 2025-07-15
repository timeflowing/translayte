'use client';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

interface DropZoneProps {
    onSelect: (file: File) => void;
    fileName: string | null;
    translationResult: object | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ onSelect, fileName, translationResult }) => {
    const [isHovering, setIsHovering] = useState(false);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onSelect(acceptedFiles[0]);
            }
        },
        [onSelect],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json'],
        },
        onDragEnter: () => setIsHovering(true),
        onDragLeave: () => setIsHovering(false),
    });

    const dropzoneVariants = {
        initial: {
            borderColor: '#4B5563', // gray-600
            backgroundColor: '#1F2937', // gray-800
        },
        hover: {
            borderColor: '#8B5CF6', // purple-500
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
        },
        active: {
            borderColor: '#A78BFA', // purple-400
            backgroundColor: 'rgba(167, 139, 250, 0.2)',
        },
    };

    return (
        <motion.div
            {...getRootProps()}
            className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                translationResult ? 'rounded-b-none' : ''
            }`}
            variants={dropzoneVariants}
            initial="initial"
            animate={isDragActive ? 'active' : isHovering ? 'hover' : 'initial'}
            transition={{ duration: 0.3 }}
        >
            <input {...getInputProps()} />

            <motion.div
                className="flex flex-col items-center justify-center text-center"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: fileName ? 0 : 1, y: fileName ? -10 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <i className="fa-solid fa-file-arrow-up text-4xl text-gray-400 mb-4"></i>
                <p className="text-lg font-semibold text-gray-200">
                    {isDragActive
                        ? 'Drop the file here ...'
                        : 'Drag & drop a JSON file here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Only .json files are supported</p>
            </motion.div>

            {fileName && (
                <motion.div
                    className="absolute flex flex-col items-center justify-center text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <i className="fa-solid fa-file-circle-check text-4xl text-green-500 mb-4"></i>
                    <p className="text-lg font-semibold text-gray-200">{fileName}</p>
                    <p className="text-sm text-gray-500 mt-1">File ready for translation</p>
                </motion.div>
            )}
        </motion.div>
    );
};
