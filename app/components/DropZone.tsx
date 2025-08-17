import { useEffect, useRef, useState } from 'react';

interface DZProps {
    onFileRead: (content: string, fileName: string) => void;
    fileName?: string | null;
    translationResult?: Record<string, Record<string, string>> | null;
}

export const DropZone: React.FC<DZProps> = ({ onFileRead, fileName, translationResult }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [drag, setDrag] = useState(false);
    const dragRef = useRef(false);
    const pointer = useRef<{ x: number; y: number } | null>(null);

    // Keep drag state in a ref for animation
    useEffect(() => {
        dragRef.current = drag;
    }, [drag]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const DPR = window.devicePixelRatio || 1;
        const resize = () => {
            canvas.width = canvas.offsetWidth * DPR;
            canvas.height = canvas.offsetHeight * DPR;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(DPR, DPR);
        };
        resize();
        window.addEventListener('resize', resize);

        // Only create particles once
        const N = 120;
        const particles = Array.from({ length: N }, () => ({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
        }));

        let frame: number;
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Add opacity to the background fill (e.g. 0.85)
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#0F0F0F';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            const RADIUS = 2;
            // move
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce horizontally
                if (p.x < RADIUS) {
                    p.x = RADIUS;
                    p.vx = -p.vx;
                }
                if (p.x > canvas.offsetWidth - RADIUS) {
                    p.x = canvas.offsetWidth - RADIUS;
                    p.vx = -p.vx;
                }

                // Bounce vertically
                if (p.y < RADIUS) {
                    p.y = RADIUS;
                    p.vy = -p.vy;
                }
                if (p.y > canvas.offsetHeight - RADIUS) {
                    p.y = canvas.offsetHeight - RADIUS;
                    p.vy = -p.vy;
                }
            });

            const SYNAPSE_DIST = 250;
            // More synapses: lower the distance threshold
            ctx.strokeStyle = dragRef.current ? '#8B5CF6' : '#5034b5';
            ctx.lineWidth = 0.6;
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist2 = dx * dx + dy * dy;
                    if (dist2 < SYNAPSE_DIST * SYNAPSE_DIST) {
                        ctx.globalAlpha = 1 - dist2 / (SYNAPSE_DIST * SYNAPSE_DIST);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;

            // synapse lines to cursor while dragging
            if (dragRef.current && pointer.current) {
                ctx.strokeStyle = '#8B5CF6';
                particles.forEach(p => {
                    const dx = p.x - pointer.current!.x;
                    const dy = p.y - pointer.current!.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 180 * 180) {
                        ctx.globalAlpha = 1 - d2 / (180 * 180);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pointer.current!.x, pointer.current!.y);
                        ctx.stroke();
                    }
                });
                ctx.globalAlpha = 1;
            }

            // particles
            ctx.fillStyle = '#8B5CF6';
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            frame = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    const handleFile = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            const content = e.target?.result as string;
            if (!content) return;

            try {
                // Validate that the file is a valid JSON
                JSON.parse(content);
                // If valid, pass the content and name up to the parent
                onFileRead(content, file.name);
            } catch (error) {
                // Silently fail on invalid JSON, no alert
                console.error('The dropped file is not a valid JSON.', error);
            }
        };
        reader.readAsText(file);
    };

    /* ---------------- render */
    return (
        <label
            onDragEnter={e => {
                e.preventDefault();
                setDrag(true);
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onDragOver={e => {
                e.preventDefault();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onDragLeave={() => {
                setDrag(false);
                pointer.current = null;
            }}
            onDrop={e => {
                e.preventDefault();
                setDrag(false);
                pointer.current = null;
                handleFile(e.dataTransfer.files?.[0]);
            }}
            htmlFor="file-upload"
            className={`relative flex flex-col items-center justify-center ${
                translationResult ? 'h-20' : 'h-60'
            } mb-8 border-dashed rounded-xl cursor-pointer overflow-hidden transition-colors duration-200 ${
                drag
                    ? 'border-[#8B5CF6] bg-[#1a1333]/80'
                    : fileName
                    ? 'border-[#a78bfa] bg-[#a78bfa]/20'
                    : 'border-[#8B5CF633] bg-transparent'
            }`}
            style={
                {
                    // Remove background color from label, let canvas handle it
                }
            }
        >
            {/* Canvas for animation */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ zIndex: 0 }}
            />
            {/* Content always above the canvas */}
            <div className="relative z-10 flex flex-col items-center text-center px-4 pointer-events-none select-none">
                <i
                    className={`fa-solid ${
                        fileName ? 'fa-file-circle-check' : 'fa-cloud-arrow-up'
                    } text-4xl mb-4`}
                    style={{ color: fileName ? '#a78bfa' : '#8B5CF6' }}
                />
                {fileName ? (
                    <>
                        <p className="text-lg font-semibold" style={{ color: '#a78bfa' }}>
                            File loaded!
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#a78bfa' }}>
                            {fileName}
                        </p>
                        <span
                            className="mt-4 relative inline-flex items-center justify-center px-6 py-2
                        rounded-lg font-bold text-base border"
                            style={{
                                color: '#fff',
                                background: '#a78bfa',
                                borderColor: '#a78bfa',
                            }}
                        >
                            Change file
                        </span>
                    </>
                ) : (
                    <>
                        <p className="text-lg font-semibold">Drop or browse your JSON file here</p>
                    </>
                )}
            </div>
            <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
                className="sr-only"
            />
        </label>
    );
};
