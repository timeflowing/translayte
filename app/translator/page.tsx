'use client';
import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../translayte.css';
import { translateBatch } from '../utils/translator';
import TranslationPreview from '../components/TranslationPreview';

/* ---------------------------------------------------------------- data */
const LANGUAGE_OPTIONS = [
    { code: 'en_XX', name: 'English', shortcut: 'EN' },
    { code: 'cs_CZ', name: 'Czech', shortcut: 'CS' },
    { code: 'it_IT', name: 'Italian', shortcut: 'IT' },
    { code: 'fr_XX', name: 'French', shortcut: 'FR' },
    { code: 'de_DE', name: 'German', shortcut: 'DE' },
    { code: 'es_XX', name: 'Spanish', shortcut: 'ES' },
    { code: 'ru_RU', name: 'Russian', shortcut: 'RU' },
    { code: 'zh_CN', name: 'Chinese (Simplified)', shortcut: 'ZH' },
    { code: 'ar_AR', name: 'Arabic', shortcut: 'AR' },
    { code: 'hi_IN', name: 'Hindi', shortcut: 'HI' },
    { code: 'pl_PL', name: 'Polish', shortcut: 'PL' },
    { code: 'pt_XX', name: 'Portuguese', shortcut: 'PT' },
    { code: 'tr_TR', name: 'Turkish', shortcut: 'TR' },
    { code: 'vi_VN', name: 'Vietnamese', shortcut: 'VI' },
] as const;

/* ---------------------------------------------------------------- page */
export default function TranslatorPage() {
    /* ---------------- state */

    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(
        new Set(['EN', 'IT', 'CS']),
    );
    const [mode, setMode] = useState<'file' | 'keys'>('file');
    const [keepOrder, setKeepOrder] = useState(true);
    const [minify, setMinify] = useState(false);
    const [lastPayload, setLastPayload] = useState<Record<string, string> | null>(null);
    const [lastTargetCodes, setLastTargetCodes] = useState<string[]>([]);
    /* key-value mode */
    const [rows, setRows] = useState<{ key: string; value: string; context?: string }[]>([
        { key: '', value: '', context: '' },
    ]);

    /* JSON-file mode */
    const [jsonInput, setJsonInput] = useState('');

    /* misc */
    const [isTranslating, setIsTranslating] = useState(false);
    const [langLimitInfo, setLangLimitInfo] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    /* ---------- translation result (⚠️ FLAT) ---------- */
    const [translationResult, setTranslationResult] = useState<Record<
        string,
        Record<string, string>
    > | null>(null);
    /* ------------- helpers */
    const toggleLanguage = (shortcut: string) => {
        setSelectedShortcuts(prev => {
            const next = new Set(prev);
            if (next.has(shortcut)) {
                next.delete(shortcut);
                setLangLimitInfo(null);
            } else {
                if (next.size >= 2) {
                    setLangLimitInfo('Upgrade to Pro to select more than 2 languages.');
                    return prev;
                }
                next.add(shortcut);
                setLangLimitInfo(null);
            }
            return next;
        });
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                setJsonInput(JSON.stringify(json, null, 2));
                setMode('file');
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };
    type JsonValue = string | { [key: string]: JsonValue };

    function flattenJson(
        obj: JsonValue,
        prefix = '',
        res: Record<string, string> = {},
    ): Record<string, string> {
        if (typeof obj !== 'object' || obj === null) {
            return res;
        }

        for (const key in obj) {
            const val = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof val === 'string') {
                res[newKey] = val;
            } else {
                flattenJson(val, newKey, res);
            }
        }

        return res;
    }

    /* ---------------- translate ---------------- */
    const handleTranslate = async () => {
        const targetCodes = LANGUAGE_OPTIONS.filter(l => selectedShortcuts.has(l.shortcut)).map(
            l => l.code,
        );
        if (targetCodes.length === 0) return;

        /* ---- build payload ---- */
        const payload =
            mode === 'file'
                ? (() => {
                      try {
                          return flattenJson(JSON.parse(jsonInput || '{}'));
                      } catch {
                          alert('❌ Invalid JSON payload');
                          return null;
                      }
                  })()
                : (() => {
                      const kv = Object.fromEntries(
                          rows.filter(r => r.key && r.value).map(r => [r.key, r.value]),
                      );
                      return Object.keys(kv).length ? kv : null;
                  })();

        if (!payload) return;

        setIsTranslating(true);
        try {
            const translationsArr = await Promise.all(
                targetCodes.map(async code => {
                    try {
                        const data = await translateBatch(payload, code, 'en_XX');

                        /* ▼ flatten the nested object we get back from the server          */
                        const flatData = flattenJson(data);

                        return [code, flatData] as const;
                    } catch (e) {
                        console.error(`[Translayte] ${code} failed:`, e);
                        return [code, {}] as const;
                    }
                }),
            );
            setLastPayload(payload); // 🔹 save EN side for preview
            setLastTargetCodes(targetCodes); // 🔹 save target list
            setTranslationResult(Object.fromEntries(translationsArr));
        } catch (e) {
            console.error('[Translayte] Unexpected failure:', e);
        } finally {
            setIsTranslating(false);
        }
    };

    // const handleReset = () => {
    //     setSelectedShortcuts(new Set());
    //     setRows([{ key: '', value: '', context: '' }]);
    //     setJsonInput('');
    //     setTranslationResult(null);
    // };
    return (
        <>
            {/* background layer */}
            <div className="fixed inset-0 -z-10" />

            {/* header */}
            <header className="fixed w-full z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex justify-between">
                    <h1 className="text-xl font-bold gradient-text">Translayte</h1>
                </div>
            </header>

            {/* main */}
            <main className="pt-24 pb-20 container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row lg:space-x-6">
                    {/* ------------ upload / keys column ------------ */}
                    <section className="w-full lg:w-7/12 mb-10 lg:mb-0">
                        {/* mode switch */}
                        <ModeSwitcher mode={mode} setMode={setMode} />

                        {/* -----  file mode  ----- */}
                        {mode === 'file' && (
                            <>
                                <DropZone onSelect={handleFileUpload} fileName={fileName} />

                                {/* ---------------- JSON Editor ---------------- */}
                                <div className="mt-6 w-full max-w-3xl mx-auto bg-[#191919]/80 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                                    {/* top bar */}
                                    <div className="flex items-center justify-between h-10 px-4 border-b border-gray-800">
                                        <span className="text-sm text-gray-400 select-none">
                                            Paste or edit your text here…
                                        </span>
                                        <span className="px-3 py-1 rounded-md bg-[#34384b] text-xs font-semibold text-gray-300 tracking-wider select-none">
                                            JSON
                                        </span>
                                    </div>

                                    {/* textarea */}
                                    <textarea
                                        value={jsonInput}
                                        onChange={e => setJsonInput(e.target.value)}
                                        spellCheck={false}
                                        placeholder="{}"
                                        className="w-full h-56 resize-none bg-transparent px-4 py-4 font-mono text-sm text-gray-100 focus:outline-none  placeholder-gray-500"
                                    />
                                </div>

                                {/* live preview (only first target language) */}
                                {lastPayload && translationResult && lastTargetCodes.length > 0 && (
                                    <TranslationPreview
                                        original={lastPayload}
                                        translated={translationResult[lastTargetCodes[0]] ?? {}}
                                        targetLangCode={lastTargetCodes[0]}
                                        targetShortcut={
                                            LANGUAGE_OPTIONS.find(
                                                l => l.code === lastTargetCodes[0],
                                            )?.shortcut ?? lastTargetCodes[0]
                                        }
                                    />
                                )}
                            </>
                        )}

                        {/* -----  keys mode  ----- */}
                        {mode === 'keys' && <KeyTable rows={rows} setRows={setRows} />}

                        {/* toggles */}

                        {/* Language selection info */}
                    </section>

                    {/* ------------ picker ------------ */}
                    <aside className="w-full lg:w-5/12 h-fit sticky top-24">
                        <div className="bg-[#191919]/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                            {/* Lang limit info as a tab on top */}
                            <header className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-medium">Choose target languages</h3>
                                <span className="text-base text-gray-200 font-semibold">
                                    <span className="font-semibold" style={{ color: '#a78bfa' }}>
                                        {selectedShortcuts.size}
                                    </span>{' '}
                                    / {LANGUAGE_OPTIONS.length}
                                </span>
                            </header>

                            <LanguageGrid selected={selectedShortcuts} toggle={toggleLanguage} />

                            {langLimitInfo && (
                                <div
                                    className=" top-20 left-6 right-6 flex items-center gap-3 px-4 py-3 rounded-t-lg bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 border border-[#8B5CF6] shadow-lg z-10"
                                    style={{ marginBottom: '-1.5rem' }}
                                >
                                    <i className="fa-solid fa-crown text-yellow-300 text-xl drop-shadow mr-2" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white text-base mb-0.5">
                                            Pro plan required
                                        </div>
                                        <div className="text-sm text-gray-200 opacity-80">
                                            Upgrade to{' '}
                                            <span className="font-semibold text-yellow-200">
                                                Translayte Pro
                                            </span>{' '}
                                            to translate into more than 2 languages at once.
                                        </div>
                                    </div>
                                    <a
                                        href="/pricing"
                                        className="ml-2 px-4 py-2 rounded-full bg-yellow-400 text-gray-900 font-semibold shadow hover:bg-yellow-300 transition"
                                    >
                                        Upgrade
                                    </a>
                                </div>
                            )}
                        </div>
                        {/* buttons */}
                        <div className="bg-[#191919]/70 backdrop-blur-sm rounded-lg p-4 mt-4 flex flex-col  gap-4">
                            <Toggle
                                label="Save translation"
                                checked={minify}
                                onChange={setMinify}
                            />
                            <Toggle
                                label="Pro translayte"
                                checked={keepOrder}
                                onChange={setKeepOrder}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <TranslateButton onClick={handleTranslate} loading={isTranslating} />
                            {/* <button
                                onClick={handleReset}
                                disabled={isTranslating}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-gray-200 bg-[#191919]/80"
                            >
                                <i className="fa-solid fa-rotate-left mr-2" />
                            </button> */}
                        </div>
                        {/* … rest of the unchanged file … */}
                    </aside>
                </div>
            </main>
        </>
    );
}

/* ---------------------------------------------------------------- small ui helpers (unstyled) */
const ModeSwitcher = ({
    mode,
    setMode,
}: {
    mode: 'file' | 'keys';
    setMode: React.Dispatch<React.SetStateAction<'file' | 'keys'>>;
}) => (
    <div className="flex justify-center mb-10">
        {/* outer pill */}
        <div className="inline-flex w-full max-w-xl rounded-xl overflow-hidden shadow-lg">
            {(['file', 'keys'] as const).map((m, idx) => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex items-center gap-2 justify-center flex-1 py-4 font-semibold text-base transition-colors
              ${active ? 'bg-[#22173d] text-white' : 'bg-[#0F0F0F] text-gray-200'}
              cursor-pointer
            `}
                        style={{
                            borderLeft: idx === 1 ? '1px solid #151515' : undefined,
                        }}
                    >
                        <i
                            className={`${
                                m === 'file' ? 'fa-solid fa-file-arrow-up' : 'fa-solid fa-key'
                            } text-lg ${active ? 'text-white' : 'text-gray-400'}`}
                        />
                        {m === 'file' ? 'Translate File' : 'Translate Keys Only'}
                    </button>
                );
            })}
        </div>
    </div>
);

interface DZProps {
    onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
    fileName?: string | null;
}
const DropZone: React.FC<DZProps> = ({ onSelect, fileName }) => {
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

            // move
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;
            });

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
                    if (dist2 < 120 * 120) {
                        ctx.globalAlpha = 1 - dist2 / (120 * 120);
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
                const file = e.dataTransfer.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            JSON.parse(reader.result as string);
                            // Create a mock FileList with the required 'item' method
                            const files: FileList = {
                                0: file,
                                length: 1,
                                item: (index: number) => (index === 0 ? file : null),
                                [Symbol.iterator]: function* () {
                                    yield file;
                                },
                            } as unknown as FileList;
                            onSelect({ target: { files } } as ChangeEvent<HTMLInputElement>);
                        } catch {
                            alert('Invalid JSON');
                        }
                    };
                    reader.readAsText(file);
                }
            }}
            htmlFor="file-upload"
            className={`relative flex flex-col items-center justify-center h-60 mb-8 border-dashed rounded-xl cursor-pointer overflow-hidden transition-colors duration-200 ${
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
                        <p className="text-lg font-semibold">Drop your JSON file here</p>
                        <p className="text-gray-400 text-sm">or click to browse</p>
                        <span
                            className="mt-4 relative inline-flex items-center justify-center px-6 py-2
                        bg-[#8B5CF6]/50 rounded-lg font-bold text-base border"
                            style={{ color: '#8B5CF6', borderColor: '#a78bfa', borderWidth: 1 }}
                        >
                            Browse files
                        </span>
                    </>
                )}
            </div>
            <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={onSelect}
                className="sr-only"
            />
        </label>
    );
};

const KeyTable = ({
    rows,
    setRows,
}: {
    rows: { key: string; value: string; context?: string }[];
    setRows: React.Dispatch<
        React.SetStateAction<{ key: string; value: string; context?: string }[]>
    >;
}) => {
    const handleChange = (idx: number, field: 'key' | 'value' | 'context', val: string) => {
        setRows(r => {
            const nxt = [...r];
            nxt[idx] = { ...nxt[idx], [field]: val };
            return nxt;
        });
    };

    const addRow = () => setRows(r => [...r, { key: '', value: '', context: '' }]);

    const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

    return (
        <div className="bg-[#18103a]/80 border border-[#2d2250] rounded-2xl p-6 shadow-lg">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-gray-400 border-b border-[#2d2250]">
                        {['Key', 'Value', 'Context (opt.)', ''].map(h => (
                            <th key={h} className="text-left pb-3 font-semibold">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {(['key', 'value', 'context'] as const).map(col => (
                                <td key={col} className="pr-2 py-2 align-top">
                                    <input
                                        value={row[col] ?? ''}
                                        onChange={e => handleChange(i, col, e.target.value)}
                                        className="w-full bg-[#221a3e] border border-[#3a2c67] rounded-lg px-3 py-2 text-gray-100 focus:border-[#8B5CF6] focus:ring-2 focus:ring-secondary/30 focus:outline-none placeholder-gray-500 shadow-sm"
                                    />
                                </td>
                            ))}
                            <td className="py-2 align-top">
                                {rows.length > 1 && (
                                    <button
                                        onClick={() => removeRow(i)}
                                        className="text-gray-500 hover:text-red-500 cursor-pointer"
                                        title="Remove row"
                                    >
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mt-6">
                <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary to-accent text-white font-semibold shadow-lg hover:opacity-90 transition cursor-pointer"
                >
                    <i className="fa-solid fa-plus" /> Add new key
                </button>
            </div>
        </div>
    );
};
const LanguageGrid = ({
    selected,
    toggle,
}: {
    selected: Set<string>;
    toggle: (sc: string) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [perRow, setPerRow] = useState(2);

    useEffect(() => {
        if (window.innerWidth >= 640) setPerRow(3);
        else setPerRow(2);
    }, []);

    const visibleCount = expanded ? LANGUAGE_OPTIONS.length : perRow;

    return (
        <div>
            <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] pr-2 p-2 overflow-y-scroll"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Hide scrollbar for Chrome, Safari and Opera */}
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {LANGUAGE_OPTIONS.slice(0, visibleCount).map(lang => {
                    const isSel = selected.has(lang.shortcut);
                    return (
                        <button
                            key={lang.code}
                            onClick={() => toggle(lang.shortcut)}
                            className={`language-chip flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all
                border-gray-700/50 bg-primary/50
                ${
                    isSel
                        ? 'ring-2 ring-secondary border-secondary bg-secondary/10 bg-[#8B5CF6]/20'
                        : ''
                }
                cursor-pointer
              `}
                            style={{
                                boxShadow: isSel ? '0 0 0 1.5px #8B5CF6' : undefined,
                                fontWeight: isSel ? 700 : 500,
                            }}
                        >
                            <span
                                className={`font-bold ${isSel ? 'tracking-wide' : ''}`}
                                style={{
                                    color: isSel ? '#8B5CF6' : '#d1d5db',
                                    fontWeight: isSel ? 800 : 600,
                                }}
                            >
                                {lang.shortcut}
                            </span>
                            <span className="text-xs text-gray-400">{lang.name}</span>
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-col items-end">
                {!expanded && LANGUAGE_OPTIONS.length > visibleCount && (
                    <div className="mt-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium hover:bg-[#221a3e] transition text-sm cursor-pointer"
                            onClick={() => setExpanded(true)}
                        >
                            <i className="fa-solid fa-chevron-down" /> Show more languages
                        </button>
                    </div>
                )}
                {expanded && LANGUAGE_OPTIONS.length > perRow && (
                    <div className="mt-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium hover:bg-[#221a3e] transition text-sm cursor-pointer"
                            onClick={() => setExpanded(false)}
                        >
                            <i className="fa-solid fa-chevron-up" /> Show less
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TranslateButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="btn-primary w-full group relative inline-flex items-center justify-center"
    >
        <span className="absolute inset-0 rounded-lg" />
        <span className="relative z-10">
            {loading ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" /> Translating…
                </>
            ) : (
                'Translate'
            )}
        </span>
    </button>
);

/* toggle */
interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}
const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
    <label className="flex w-full items-center justify-between gap-4 cursor-pointer select-none">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="relative inline-block w-12 h-6">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="absolute inset-0 rounded-full transition bg-gray-700 peer-checked:bg-[#8B5CF6]" />
            <span
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition
          peer-checked:translate-x-6"
            />
        </span>
    </label>
);
