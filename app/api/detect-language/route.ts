import { NextRequest, NextResponse } from 'next/server';
import { franc } from 'franc-min';
import * as iso from 'iso-639-3';
import { rateLimit } from '../../utils/rateLimiter';

// Type assertion for the language data from the iso-639-3 package
interface LangData {
    iso6393: string;
    name: string;
    [key: string]: unknown;
}

// Create a Map for efficient lookup of language data from the 3-letter code
const langMap = new Map(iso.iso6393.map((lang: LangData) => [lang.iso6393, lang]));

// Whitelist of common languages to improve accuracy for short/mistyped text
const whitelist = [
    'eng', // English
    'spa', // Spanish
    'fra', // French
    'deu', // German
    'ita', // Italian
    'por', // Portuguese
    'nld', // Dutch
    'rus', // Russian
    'ces', // Czech
    'slk', // Slovak
    'pol', // Polish
    'ukr', // Ukrainian
];

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (rateLimit(ip, 30, 60000)) { // 30 requests per minute
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { text } = body;

        if (!text || typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ language: null, code: 'auto' });
        }

        // Use the `only` option to constrain detection
        const langCode3 = franc(text, { only: whitelist });

        if (langCode3 && langCode3 !== 'und') {
            const langInfo = langMap.get(langCode3);
            if (langInfo) {
                return NextResponse.json({
                    language: langInfo.name,
                    code: langInfo.iso6391 || 'auto',
                });
            }
        }

        return NextResponse.json({ language: null, code: 'auto' });

    } catch (error) {
        console.error('Detect Language API Error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
