'use client';
import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { translateIntoMultipleLanguagesx, translateText } from '../utils/translator';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';
/* ---------------------------------------------------------------- data */
const LANGUAGE_OPTIONS = [
    { code: 'eng_Latn', name: 'English', shortcut: 'EN' },
    { code: 'ces_Latn', name: 'Czech', shortcut: 'CS' },
    { code: 'ita_Latn', name: 'Italian', shortcut: 'IT' },
    { code: 'ben_Beng', name: 'Bengali', shortcut: 'BN' },
    { code: 'nld_Latn', name: 'Dutch', shortcut: 'NL' },
    { code: 'fra_Latn', name: 'French', shortcut: 'FR' },
    { code: 'deu_Latn', name: 'German', shortcut: 'DE' },
    { code: 'hin_Deva', name: 'Hindi', shortcut: 'HI' },
    { code: 'jpn_Jpan', name: 'Japanese', shortcut: 'JA' },
    { code: 'kor_Hang', name: 'Korean', shortcut: 'KO' },
    { code: 'msa_Latn', name: 'Malay', shortcut: 'MS' },
    { code: 'fas_Arab', name: 'Persian', shortcut: 'FA' },
    { code: 'pol_Latn', name: 'Polish', shortcut: 'PL' },
    { code: 'por_Latn', name: 'Portuguese', shortcut: 'PT' },
    { code: 'spa_Latn', name: 'Spanish', shortcut: 'ES' },
    { code: 'zho_Hans', name: 'Chinese (Simplified)', shortcut: 'ZH' },
    { code: 'rus_Cyrl', name: 'Russian', shortcut: 'RU' },
    { code: 'tur_Latn', name: 'Turkish', shortcut: 'TR' },
    { code: 'ara_Arab', name: 'Arabic', shortcut: 'AR' },
    { code: 'vie_Latn', name: 'Vietnamese', shortcut: 'VI' },
] as const;

/* handy maps */
const SHORTCUT_TO_CODE = Object.fromEntries(LANGUAGE_OPTIONS.map(l => [l.shortcut, l.code]));
const CODE_TO_SHORTCUT = Object.fromEntries(LANGUAGE_OPTIONS.map(l => [l.code, l.shortcut]));

/* ---------------------------------------------------------------- page */
export default function TranslatorPage() {
    /* ---------------- state */
    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(
        new Set(['EN', 'IT', 'CS']),
    );
    const [mode, setMode] = useState<'file' | 'keys'>('file');
    const [keepOrder, setKeepOrder] = useState(true);
    const [minify, setMinify] = useState(false);

    /* key-value mode */
    const [rows, setRows] = useState<{ key: string; value: string; context?: string }[]>([
        { key: '', value: '', context: '' },
    ]);

    /* file / json mode */
    const [jsonInput, setJsonInput] = useState('');

    /* result */
    const [isTranslating, setIsTranslating] = useState(false);
    const [jsonTranslations, setJsonTranslations] = useState<
        Record<string, Record<string, string>>
    >({});

    /* ------------- helpers */
    const toggleLanguage = (shortcut: string) => {
        setSelectedShortcuts(prev => {
            const next = new Set(prev);
            next.has(shortcut) ? next.delete(shortcut) : next.add(shortcut);
            return next;
        });
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                setJsonInput(JSON.stringify(json, null, 2));
                setMode('file'); // ensure correct mode
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    /* translate button */
    const handleTranslate = async () => {
        const targetCodes = [...selectedShortcuts].map(sc => SHORTCUT_TO_CODE[sc]!);
        if (targetCodes.length === 0) return;

        setIsTranslating(true);
        try {
            /* ---------- JSON mode ---------- */
            if (mode === 'file') {
                const parsed = JSON.parse(jsonInput || '{}');
                const result: Record<string, Record<string, string>> = {};
                for (const code of targetCodes) {
                    result[code] = {};
                    for (const [k, v] of Object.entries(parsed)) {
                        if (typeof v !== 'string') continue;
                        const t = await translateText(v, code, 'eng_Latn');
                        result[code][k] = t;
                    }
                }
                setJsonTranslations(result);
            }

            /* ---------- key/value mode ---------- */
            if (mode === 'keys') {
                const input = rows.filter(r => r.key && r.value);
                const result: Record<string, Record<string, string>> = {};
                for (const code of targetCodes) {
                    result[code] = {};
                    for (const { key, value } of input) {
                        const t = await translateText(value, code, 'eng_Latn');
                        result[code][key] = t;
                    }
                }
                setJsonTranslations(result);
            }
        } catch (err) {
            console.error(err);
            alert('Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleReset = () => {
        setSelectedShortcuts(new Set());
        setRows([{ key: '', value: '', context: '' }]);
        setJsonInput('');
        setJsonTranslations({});
    };

    /* ---------------------------------------------------------------- ui */
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
                                {/* drop zone */}
                                <DropZone onSelect={handleFileUpload} />

                                {/* json textarea */}
                                <textarea
                                    value={jsonInput}
                                    onChange={e => setJsonInput(e.target.value)}
                                    placeholder="// or paste JSON here…"
                                    className="w-full mt-4 h-48 bg-[#18103a] border border-[#2d2250] rounded-xl p-4 text-gray-300 font-mono text-sm focus:ring-secondary focus:outline-none"
                                />
                            </>
                        )}

                        {/* -----  keys mode  ----- */}
                        {mode === 'keys' && <KeyTable rows={rows} setRows={setRows} />}

                        {/* toggles */}
                        <div className="bg-[#030303]/70 backdrop-blur-sm rounded-lg p-4 mt-10 flex flex-col sm:flex-row sm:justify-between gap-4">
                            <Toggle
                                label="Keep keys order"
                                checked={keepOrder}
                                onChange={setKeepOrder}
                            />
                            <Toggle label="Minify output" checked={minify} onChange={setMinify} />
                        </div>

                        {/* buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                            <TranslateButton onClick={handleTranslate} loading={isTranslating} />
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 border border-gray-700 rounded-full text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </section>

                    {/* ------------ picker ------------ */}
                    <aside className="w-full lg:w-5/12 bg-[#030303]/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800 h-fit sticky top-24">
                        <header className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium">Choose target languages</h3>
                            <span className="text-base text-gray-200">
                                Selected{' '}
                                <span
                                    className="font-semibold"
                                    style={{ color: '#8B5CF6', fontSize: '1.1em' }}
                                >
                                    {selectedShortcuts.size}
                                </span>{' '}
                                / {LANGUAGE_OPTIONS.length}
                            </span>
                        </header>

                        <LanguageGrid selected={selectedShortcuts} toggle={toggleLanguage} />
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
        <div className="inline-flex bg-[#18103a]/90 rounded-xl shadow-lg border border-[#2d2250] overflow-hidden">
            {(['file', 'keys'] as const).map(m => (
                <button
                    key={m}
                    className={`px-8 py-3 font-semibold text-base transition
            ${mode === m ? 'bg-gradient-to-r from-secondary to-accent text-white' : 'text-gray-400'}
          `}
                    style={{
                        borderRight: m === 'file' ? '1px solid #2d2250' : undefined,
                        minWidth: 170,
                    }}
                    onClick={() => setMode(m)}
                >
                    <i className={`fa-${m === 'file' ? 'regular fa-file' : 'solid fa-key'} mr-2`} />
                    {m === 'file' ? 'Translate File' : 'Translate Keys Only'}
                </button>
            ))}
        </div>
    </div>
);
/* prettier-ignore */ const DropZone: React.FC<Props> = ({ onSelect }) => {
  const vantaRef = useRef<HTMLDivElement | null>(null);   // ← Vanta mounts here
  const zoneRef  = useRef<HTMLLabelElement | null>(null); // for focus & size

  /* mount Vanta just once */
  useEffect(() => {
    if (!vantaRef.current) return;

    const vanta = NET({
      el: vantaRef.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      color: 0x8B5CF6,
      backgroundColor: 0x0F0F0F,
      points: 8,
      maxDistance: 20,
      spacing: 16,
    });

    return () => vanta?.destroy();          // cleanup on unmount
  }, []);

  return (
    <label
      ref={zoneRef}
      htmlFor="file-upload"
      className="relative flex flex-col items-center justify-center h-64 mb-6
                 rounded-xl cursor-pointer overflow-hidden"
      style={{ border: '2px dashed #8B5CF6' }}   /* violet dashed frame */
    >
      {/* Vanta canvas lives in this absolutely-positioned div */}
      <div ref={vantaRef} className="absolute inset-0 -z-10" />

      {/* hidden file input */}
      <input
        id="file-upload"
        type="file"
        accept=".json,.js"
        className="sr-only"
        onChange={onSelect}
      />

      {/* foreground content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="w-16 h-16 mb-5 rounded-full bg-secondary/10 flex items-center justify-center">
          <i className="fa-solid fa-file-arrow-up text-2xl text-secondary" />
        </div>

        <p className="text-lg font-medium">Drop your JSON file here</p>
        <p className="text-gray-400 text-sm mb-6">or</p>

        <span className="relative inline-flex items-center justify-center px-8 py-2
                          rounded-full text-white border border-[#8B5CF6]">
          Browse files
        </span>

        <p className="text-gray-500 text-xs mt-6 flex items-center">
          <i className="fa-solid fa-lock mr-2" /> Your file never leaves this device
        </p>
      </div>
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
                                        className="text-gray-500 hover:text-red-500"
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary to-accent text-white font-semibold shadow-lg hover:opacity-90 transition"
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
}) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 p-2">
        {LANGUAGE_OPTIONS.map(lang => {
            const isSel = selected.has(lang.shortcut);
            return (
                <button
                    key={lang.code}
                    onClick={() => toggle(lang.shortcut)}
                    className={`language-chip flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all
            border-gray-700/50 bg-primary/50
            ${isSel ? 'ring-2 ring-secondary border-secondary bg-secondary/10' : ''}
          `}
                    style={{
                        boxShadow: isSel ? '0 0 0 2px #8B5CF6' : undefined,
                        fontWeight: isSel ? 700 : 500,
                    }}
                >
                    <span
                        className={isSel ? 'text-secondary font-bold' : 'text-gray-300 font-bold'}
                    >
                        {lang.shortcut}
                    </span>
                    <span className="text-xs text-gray-400">{lang.name}</span>
                </button>
            );
        })}
    </div>
);

const TranslateButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="group relative inline-flex items-center justify-center
      px-10 py-4 rounded-full font-semibold text-white shadow-lg
      transition-transform"
        style={{
            backgroundColor: '#8B5CF6',
            boxShadow: '0 2px 16px 0 #8B5CF633',
        }}
    >
        <span
            className="absolute inset-0 rounded-full"
            style={{
                background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
                opacity: 0.85,
                filter: 'blur(8px)',
            }}
        />
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
