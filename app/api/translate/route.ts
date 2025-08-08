import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// FIX: Import admin SDK to handle auth and database operations
import { adminAuth, adminDB } from '../../lib/firebaseAdmin';

// Initialize OpenAI client once
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    // --- 1. Authentication (Re-enabled for Production Security) ---
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
        // --- 2. Input Validation ---
        const body = await req.json();
        const { payload, targetLanguages, sourceLanguage } = body;

        if (!payload || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
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

        // --- 5. User Quota Update (Re-enabled for Production) ---
        const userRef = adminDB.collection('users').doc(decoded.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        // Check if user is on a paid plan by checking their subscription status
        const customerRef = adminDB.collection('customers').doc(decoded.uid);
        const subscriptionsSnapshot = await customerRef.collection('subscriptions').where('status', 'in', ['active', 'trialing']).limit(1).get();
        const isPro = !subscriptionsSnapshot.empty;

        if (!isPro) {
            const keysThisMonth = userData?.keys_month || 0;
            const keyCount = Object.keys(payload).length;
            await userRef.update({
                keys_month: keysThisMonth + keyCount,
            });
        }

        return NextResponse.json(translations);

    } catch (error) {
        console.error("Translate API CATCH_ALL Error:", error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}