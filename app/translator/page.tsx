'use client';
import React, { useRef, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { translateIntoMultipleLanguages, translateText } from '../utils/translator';

/**
 * TranslatorPage – React / Next component
 * ---------------------------------------------------------------------------
 * • Dark‑violet theme (matches landing page).
 * • Drag‑drop upload **or** paste‑keys mode.
 * • Responsive language picker with selectable chips.
 * • Sticky Translate / Reset controls.
 * • Vanta.NET background (subtle, zoomed‑in).
 *
 * NOTE ─ real translation logic / i18n API calls are left as TODOs.
 */
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
];

export default function TranslatorPage() {
    /* ---------------------------------------------------------------- state */
    const [selected, setSelected] = useState<Set<string>>(new Set(['EN', 'IT', 'CS']));
    const [showPaste, setShowPaste] = useState(false);
    const [keepOrder, setKeepOrder] = useState(true);
    const [minify, setMinify] = useState(false);
    const [keyValue, setKeyValue] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [mode, setMode] = useState<'file' | 'keys'>('file');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
        'eng_Latn',
        'ces_Latn',
        'ita_Latn',
    ]);
    /* -------------------------------------------------------------- refs */
    const bgRef = useRef<HTMLDivElement | null>(null);

    /* ------------------------------------------------------- bg animation */

    /* ------------------------------------------------------ handlers */
    const toggleLanguage = (code: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const [translations, setTranslations] = useState<{ language: string; translation: string }[]>(
        [],
    );
    const [copiedMessage, setCopiedMessage] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [jsonTranslations, setJsonTranslations] = useState<
        Record<string, Record<string, string>>
    >({});

    const handleCheckboxChange = (languageCode: string) => {
        setSelectedLanguages(prev =>
            prev.includes(languageCode)
                ? prev.filter(code => code !== languageCode)
                : [...prev, languageCode],
        );
    };

    const handleTranslate = async () => {
        setLoading(true);
        try {
            const translations = await translateIntoMultipleLanguages(
                text,
                selectedLanguages,
                'eng_Latn',
            );
            setTranslations(translations);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyJSONForTranslation = (translation: string) => {
        const jsonSnippet = `"${keyValue}": "${translation}",`;
        navigator.clipboard.writeText(jsonSnippet).then(() => {
            setCopiedMessage('Copied to clipboard!');
            setTimeout(() => setCopiedMessage(''), 2000);
        });
    };

    const handleJsonTranslate = async () => {
        setLoading(true);
        try {
            const parsed = JSON.parse(jsonInput);
            const result: Record<string, Record<string, string>> = {};

            for (const lang of selectedLanguages) {
                result[lang] = {};
                for (const [key, value] of Object.entries(parsed)) {
                    if (typeof value === 'string') {
                        const translated = await translateText(value, lang, 'eng_Latn');
                        result[lang][key] = translated;
                    } else {
                        console.warn(`Skipping key "${key}" as its value is not a string.`);
                    }
                }
            }
            setJsonTranslations(result);
        } catch {
            alert('Invalid JSON');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                setJsonInput(JSON.stringify(json, null, 2));
            } catch {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };
    const handleReset = () => {
        setSelected(new Set());
        setShowPaste(false);
        // reset other inputs / states
    };

    /* ------------------------------------------------------------ ui */
    return (
        <>
            {/* background layer */}
            <div ref={bgRef} className="fixed inset-0 -z-10" />

            {/* header */}
            <header className="fixed w-full z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold gradient-text">Translayte</h1>
                </div>
            </header>

            {/* main */}
            <main className="pt-24 pb-20 container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row lg:space-x-6">
                    {/* ------------ upload / paste column ------------ */}
                    <section className="w-full lg:w-7/12 mb-10 lg:mb-0">
                        {/* --- Switcher --- */}
                        <div className="flex justify-center mb-10">
                            <div className="inline-flex bg-[#18103a]/90 rounded-xl shadow-lg border border-[#2d2250] overflow-hidden">
                                <button
                                    className={`
                                px-8 py-3 font-semibold text-base transition-all duration-200
                                focus:outline-none
                                ${
                                    mode === 'file'
                                        ? 'bg-gradient-to-r from-secondary to-accent text-white shadow-md'
                                        : 'bg-transparent text-gray-400 hover:text-secondary'
                                }
                              `}
                                    style={{
                                        borderRight: '1px solid #2d2250',
                                        borderRadius:
                                            mode === 'file' ? '12px 0 0 12px' : '12px 0 0 12px',
                                        minWidth: 170,
                                    }}
                                    onClick={() => setMode('file')}
                                >
                                    <i className="fa-regular fa-file mr-2" />
                                    <span>Translate File</span>
                                </button>
                                <button
                                    className={`
                                px-8 py-3 font-semibold text-base transition-all duration-200
                                focus:outline-none
                                ${
                                    mode === 'keys'
                                        ? 'bg-gradient-to-r from-secondary to-accent text-white shadow-md'
                                        : 'bg-transparent text-gray-400 hover:text-secondary'
                                }
                              `}
                                    style={{
                                        borderRadius:
                                            mode === 'keys' ? '0 12px 12px 0' : '0 12px 12px 0',
                                        minWidth: 170,
                                    }}
                                    onClick={() => setMode('keys')}
                                >
                                    <i className="fa-solid fa-key mr-2" />
                                    <span>Translate Keys Only</span>
                                </button>
                            </div>
                        </div>

                        {/* --- Content based on mode --- */}
                        {mode === 'file' ? (
                            <>
                                {/* ---------- drag & drop zone ---------- */}
                                <div
                                    className="
                relative group flex flex-col items-center justify-center h-64 mb-6
                rounded-xl border-2 border-dashed border-gray-600/70 cursor-pointer
                overflow-hidden
                hover:border-[#8B5CF6] focus:outline-none
                transition-colors duration-200
            "
                                    style={{
                                        borderColor: '#4B5563', // fallback for border-gray-600/70
                                    }}
                                >
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 mb-5 rounded-full bg-secondary/10 flex items-center justify-center">
                                            <i className="fa-solid fa-cloud-arrow-up text-2xl text-secondary" />
                                        </div>

                                        <p className="text-lg font-medium mb-1">
                                            Drag & drop your JSON file here
                                        </p>
                                        <p className="text-gray-400 text-sm mb-6">
                                            Accepts <code>.json</code> or <code>.js</code> files
                                        </p>

                                        <input
                                            type="file"
                                            accept=".json,.js"
                                            className="hidden"
                                            id="file-upload"
                                            onChange={e => {
                                                // TODO: handle file upload logic
                                            }}
                                        />
                                        <label htmlFor="file-upload">
                                            <button
                                                type="button"
                                                className="relative inline-flex items-center justify-center px-8 py-2
                            rounded-lg font-medium text-white
                            border border-[#8B5CF6] hover:border-[#8B5CF6]
                            transition-colors duration-200 group"
                                            >
                                                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-secondary to-accent opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300" />
                                                <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-secondary/30 pointer-events-none" />
                                                <span className="relative z-10">Browse files</span>
                                            </button>
                                        </label>

                                        <p className="text-gray-500 text-xs mt-5 flex items-center">
                                            <i className="fa-solid fa-lock mr-2" />
                                            Your file never leaves this device
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* ------------- keys input table ------------- */}
                                <div className="bg-[#18103a]/80 border border-[#2d2250] rounded-2xl p-6 mb-4 shadow-lg">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-400 border-b border-[#2d2250]">
                                                <th className="text-left pb-3 font-semibold tracking-wide">
                                                    Key
                                                </th>
                                                <th className="text-left pb-3 font-semibold tracking-wide">
                                                    Value for Translation
                                                </th>
                                                <th className="text-left pb-3 font-semibold tracking-wide">
                                                    Context{' '}
                                                    <span className="text-xs text-gray-500">
                                                        (optional)
                                                    </span>
                                                </th>
                                                <th className="pb-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Example row, replace with state-driven rows */}
                                            <tr>
                                                <td className="pr-2 py-2 align-top">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-[#221a3e] border border-[#3a2c67] rounded-lg px-3 py-2 text-gray-100 focus:border-[#8B5CF6] focus:ring-2 focus:ring-secondary/30 focus:outline-none transition placeholder-gray-500 shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="pr-2 py-2 align-top">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-[#221a3e] border border-[#3a2c67] rounded-lg px-3 py-2 text-gray-100 focus:border-[#8B5CF6] focus:ring-2 focus:ring-secondary/30 focus:outline-none transition placeholder-gray-500 shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="pr-2 py-2 align-top">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-[#221a3e] border border-[#3a2c67] rounded-lg px-3 py-2 text-gray-100 focus:border-[#8B5CF6] focus:ring-2 focus:ring-secondary/30 focus:outline-none transition placeholder-gray-500 shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2 align-top">
                                                    {/* Remove row button (hidden for first row) */}
                                                    <button
                                                        type="button"
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Remove"
                                                        disabled
                                                    >
                                                        {/* Icon removed */}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Add more rows here based on state */}
                                        </tbody>
                                    </table>
                                    {/* Add new key button */}
                                    <div className="flex justify-end mt-6">
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary to-accent text-white font-semibold shadow-lg hover:opacity-90 transition"
                                            // onClick={handleAddRow}
                                        >
                                            <i className="fa-solid fa-plus" />
                                            Add new key
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* -------- settings toggles -------- */}
                        <div className="bg-[#030303]/70 backdrop-blur-sm rounded-lg p-4 mt-10 flex flex-col sm:flex-row sm:justify-between gap-4">
                            <Toggle
                                label="Keep keys order"
                                checked={keepOrder}
                                onChange={setKeepOrder}
                            />
                            <Toggle label="Minify output" checked={minify} onChange={setMinify} />
                        </div>

                        {/* --------- Translate & Reset buttons --------- */}
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mt-10">
                            <button
                                className="group relative inline-flex items-center justify-center
                px-10 py-4 rounded-full font-semibold text-white
                transition-transform duration-200
                focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/60
                shadow-lg"
                                style={{
                                    backgroundColor: '#8B5CF6',
                                    boxShadow: '0 2px 16px 0 #8B5CF633',
                                }}
                                onClick={handleTranslate}
                                disabled={isTranslating}
                            >
                                <span
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
                                        opacity: 0.85,
                                        filter: 'blur(8px)',
                                    }}
                                ></span>
                                <span
                                    className="absolute inset-[1px] rounded-full"
                                    style={{
                                        background: '#8B5CF6',
                                    }}
                                ></span>
                                <span
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'rgba(255,255,255,0.07)',
                                        backdropFilter: 'blur(2px)',
                                        mixBlendMode: 'overlay',
                                    }}
                                ></span>
                                <span className="relative z-10 tracking-wide text-base font-semibold flex items-center">
                                    {isTranslating ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin mr-2" />
                                            Translating…
                                        </>
                                    ) : (
                                        'Translate'
                                    )}
                                </span>
                            </button>

                            <button
                                onClick={handleReset}
                                className="px-6 py-3 border border-gray-700 rounded-full text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </section>

                    {/* ------------ language picker ------------ */}
                    <aside className="w-full lg:w-5/12 bg-[#030303]/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800 h-fit sticky top-24">
                        <header className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-medium">Choose target languages</h3>
                            <span className="text-base text-gray-200">
                                Selected{' '}
                                <span
                                    className="font-semibold"
                                    style={{
                                        color: selected.size > 0 ? '#8B5CF6' : undefined,
                                        fontSize: '1.10em',
                                    }}
                                >
                                    {selected.size}
                                </span>{' '}
                                / {LANGUAGE_OPTIONS.length}
                            </span>
                        </header>

                        {/* search (logic TBD) */}
                        <div className="relative mb-6">
                            <input
                                type="text"
                                placeholder="Search languages…"
                                className="w-full bg-[#0F0F0F] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:border-secondary focus:outline-none"
                            />
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400" />
                        </div>

                        {/* language chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 p-2">
                            {LANGUAGE_OPTIONS.map(lang => {
                                const isSel = selected.has(lang.shortcut);
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => toggleLanguage(lang.code)}
                                        className={`language-chip flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all
                                  border-gray-700/50 bg-primary/50
                                  ${
                                      isSel
                                          ? 'ring-2 ring-secondary border-secondary bg-secondary/10'
                                          : ''
                                  }
                                `}
                                        style={{
                                            boxShadow: isSel ? '0 0 0 2px #8B5CF6' : undefined,
                                            fontWeight: isSel ? 700 : 500,
                                        }}
                                    >
                                        <div
                                            className={`font-bold ${
                                                isSel ? 'text-secondary' : 'text-gray-300'
                                            }`}
                                        >
                                            {lang.shortcut}
                                        </div>
                                        <div className="text-xs text-gray-400">{lang.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}

/* ---------------------------------------------------------------- helpers */
interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}
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
            {/* track */}
            <span className="absolute inset-0 rounded-full transition-colors bg-gray-700 peer-checked:bg-[#8B5CF6]" />
            {/* thumb */}
            <span
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow
           transition-all duration-200
           peer-checked:translate-x-6 peer-checked:bg-white"
            />
        </span>
    </label>
);
