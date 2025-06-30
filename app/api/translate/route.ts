import {  adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

import OpenAI from 'openai';
import { cert as makeCert } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: makeCert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';
const MAX_KEYS = 200;
const BATCH_SIZE = 20;
const SYSTEM_PROMPT = `
You are a localisation engine. Your task is to translate UI strings.

• Input will look like: <key>: <value>
• Keep the key unchanged.
• Translate ONLY the value, NEVER the key.
• Do NOT translate or touch {{placeholders}} inside double curly braces.
• Maintain line order and structure.
• Output format: <key>: <translated value>
`.trim();

export async function POST(req: Request) {
  // … your adminAuth / adminDB imports and token‐verify above …
   const authHeader = req.headers.get('authorization') || '';
  const idToken    = authHeader.replace(/^Bearer\s+/i, '');
  const decoded    = await adminAuth.verifyIdToken(idToken);

const userRef  = adminDB.collection('users').doc(decoded.uid);
const userSnap = await userRef.get();
const user     = userSnap.exists
  ? userSnap.data()
  : { keys_month: 0, subscription: { status: null } };

  // free: 200/mo; pro: 5 000/mo
  if (user?.subscription.status !== 'active' && user?.keys_month + BATCH_SIZE > MAX_KEYS) {
    return new Response(
      JSON.stringify({ error: 'Free quota exceeded', type: 'quota' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (user?.subscription.status === 'active' && user?.keys_month + BATCH_SIZE > 5000) {
    return new Response(
      JSON.stringify({ error: 'Pro quota exceeded', type: 'quota' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // …now your existing body-parsing & flattening logic…
  const body = await req.json();
  const { json, texts, to } = body;
    if (!json && !texts) {
        return badRequest('Provide either "json" or "texts".');
    }

    const flat: Record<string, string> = json
        ? flattenJson(json)
        : Object.fromEntries((texts as string[]).map((t, i) => [i.toString(), t]));

    const keys = Object.keys(flat);
    if (keys.length > MAX_KEYS) {
        return badRequest(`Too many entries (${keys.length}). Limit is ${MAX_KEYS}.`);
    }

    const targets = Array.isArray(to) ? to : [to];
    const translations: Record<string, string> = {};


    try {
        for (const lang of targets) {
            const translatedFlat: Record<string, string> = {};
            const batches = chunk(Object.entries(flat), BATCH_SIZE);

            for (const batch of batches) {
                const prompt = [
                    `Translate the following to **${lang}**:`,
                    batch.map(([k, v]) => `${k}: ${v}`).join('\n')
                ].join('\n\n');

                const completion = await openai.chat.completions.create({
                    model: MODEL,
                    max_tokens: prompt.split(/\s+/).length * 2,
                    temperature: 0.2,
                    top_p: 0.9,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: prompt }
                    ],
                });

                const response = completion.choices[0].message.content?.trim() ?? '';
                response.split('\n').forEach(line => {
                    const sepIndex = line.indexOf(':');
                    if (sepIndex > -1) {
                        const k = line.slice(0, sepIndex).trim();
                        const v = line.slice(sepIndex + 1).trim();
                        if (k && v) translatedFlat[k] = v;
                    }
                });
            }

            translations[lang] = json ? unflattenJson(translatedFlat) : Object.values(translatedFlat);
        }
           await userRef.update({
  keys_month: FieldValue.increment(BATCH_SIZE),
});
        return new Response(JSON.stringify({ translation: translations }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err) {
  if (err instanceof Error) {
    console.log(err.message);
  } else {
    console.log('Unknown error');
  

        return new Response(JSON.stringify({ error: err?.message || 'Translation failed' }), { status: 500 });
    }
}

// ------------- Helpers -------------

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function flattenJson(obj: any, res: Record<string, string> = {}): Record<string, string> {
    for (const key in obj) {
        const val = obj[key];
        const newKey =   key;
        if (typeof val === 'string') {
            res[newKey] = val;
        } else if (val && typeof val === 'object') {
            flattenJson(val, newKey, res);
        }
    }
    return res;
}

function unflattenJson(flat: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const flatKey in flat) {
        const path = flatKey.split('.');
        let cur = out;
        path.forEach((seg, idx) => {
            if (idx === path.length - 1) {
                cur[seg] = flat[flatKey];
            } else {
                cur[seg] = cur[seg] ?? {};
                cur = cur[seg];
            }
        });
    }
    return out;
}

function badRequest(msg: string): Response {
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
}
