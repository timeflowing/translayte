import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminAuth, adminDB } from '../../lib/firebaseAdmin';
import { rateLimit } from '../../utils/rateLimiter';
import { franc } from 'franc-min';
import * as iso from 'iso-639-3';

// Type assertion for the language data from the iso-639-3 package
interface LangData {
    iso6393: string;
    iso6391?: string; // The 2-letter code is optional for some languages
    name: string;
    [key: string]: unknown; // Allow other properties but with a safe type
}

// Create a Map for efficient lookup of language data from the 3-letter code
const langMap = new Map(iso.iso6393.map((lang: LangData) => [lang.iso6393, lang]));

// Initialize OpenAI client once
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (rateLimit(ip, 10, 60000)) { // More restrictive limit for this endpoint
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '');
    let decoded;
    try {
        decoded = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
        console.error("CRITICAL: Token verification failed.", error);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    try {
        // --- 2. Input Validation and Language Detection ---
        const body = await req.json();
        const { payload, targetLanguages, sourceLanguage: initialSourceLanguage } = body;
        let sourceLanguage = initialSourceLanguage;
        let detectedLanguageName: string | null = null;

        if (!payload || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
        }

        if (sourceLanguage === 'auto') {
            const textToDetect = Object.values(payload).join(' ');
            const langCode3 = franc(textToDetect);
            if (langCode3 && langCode3 !== 'und') {
                const langInfo = langMap.get(langCode3);
                if (langInfo && langInfo.iso6391) {
                    sourceLanguage = langInfo.iso6391;
                    detectedLanguageName = langInfo.name;
                } else {
                    sourceLanguage = 'en'; // Fallback if no 2-letter code or lang info found
                }
            } else {
                sourceLanguage = 'en'; // Fallback if detection fails
            }
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error("Server Configuration Error: OPENAI_API_KEY is not set.");
            return NextResponse.json({ error: 'Translation service is temporarily unavailable.' }, { status: 503 });
        }

        // --- 3. Parallel Translation ---
        const translationPromises = targetLanguages.map(async (targetLang: string) => {
            const prompt = `Translate the following JSON object from ${sourceLanguage} to ${targetLang}. Return ONLY a valid JSON object with the same keys but translated values. Do not add any explanations or formatting:\n\n${JSON.stringify(payload, null, 2)}`;

            try {
                const completion = await client.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                });

                const translatedText = completion.choices[0]?.message?.content?.trim();
                if (translatedText) {
                    return { [targetLang]: JSON.parse(translatedText) };
                }
            } catch (error) {
                console.error(`Failed to translate to ${targetLang}:`, error);
                return null; 
            }
            return null;
        });

        const results = await Promise.all(translationPromises);

        // --- 4. Combine Results ---
        const translations = results.reduce((acc, result) => {
            if (result) {
                return { ...acc, ...result };
            }
            return acc;
        }, {});

        // --- 5. User Quota Update ---
        const userRef = adminDB.collection('users').doc(decoded.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        const customerRef = adminDB.collection('customers').doc(decoded.uid);
        const subscriptionsSnapshot = await customerRef.collection('subscriptions').where('status', 'in', ['active', 'trialing']).limit(1).get();
        const isPro = !subscriptionsSnapshot.empty;

        if (!isPro) {
            const keysThisMonth = userData?.keys_month || 0;
            const charsThisMonth = userData?.chars_month || 0;
            const keyCount = Object.keys(payload).length;
            
            const charCount = Object.values(payload).reduce((total: number, value: unknown) => {
                return total + (typeof value === 'string' ? value.length : String(value).length);
            }, 0);
            
            await userRef.update({
                keys_month: keysThisMonth + keyCount,
                chars_month: charsThisMonth + charCount,
            });
        }

        return NextResponse.json({ translations, detectedSourceLanguage: detectedLanguageName });

    } catch (error) {
        console.error("Translate API CATCH_ALL Error:", error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
