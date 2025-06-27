import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
// route.ts
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';
const MAX_KEYS = 200;          // hard safety cap
const BATCH_SIZE = 20;         // mini-batch chunk size
const SYSTEM_PROMPT = `
You are a **localisation engine**. 
Translate ONLY the natural-language text; never alter keys or placeholders.

 • Lines arrive in the form: <key>: <value>
 • Keep the part before the first colon (the key) unchanged.
 • {{placeholders}} wrapped in double curly braces MUST be copied verbatim.
 • Do NOT add or remove lines.
 • Output MUST use the identical key order as input.
`.trim();
// ---------------- API handler ----------------
export async function POST(req: Request) {
  const body = await req.json();
  const { json, texts, from = 'en_XX', to = 'cs_CZ' } = body;

  // --- 0. Basic validation
  if (!json && !texts)
    return badRequest('Provide either "json" or "texts".');

  const flat: Record<string, string> = json
    ? flattenJson(json)
    : Object.fromEntries((texts as string[]).map((t, i) => [i.toString(), t]));

  const keys = Object.keys(flat);
  if (keys.length > MAX_KEYS)
    return badRequest(`Too many entries (${keys.length}). Limit is ${MAX_KEYS}.`);

  // --- 1. Mini-batch translation
  const batches: [string, string][][] = chunk(Object.entries(flat), BATCH_SIZE);
  const translatedFlat: Record<string, string> = {};

  try {
    for (const batch of batches) {
      const prompt = batch.map(([k, v]) => `${k}: ${v}`).join('\n');

      const completion = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: prompt.split(/\s+/).length * 2, // rough cap
        temperature: 0.2,
        top_p:        0.9, 
        messages: [
          {
            role: 'system',
           content:SYSTEM_PROMPT
  },
          { role: 'user', content: prompt },
        ],
      });

      const translated = completion.choices[0].message.content?.trim() ?? '';
      translated.split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) translatedFlat[k.trim()] = v.join(':').trim();
      });
    }

    // --- 2. Reconstruct
    const result = json ? unflattenJson(translatedFlat) : Object.values(translatedFlat);
    console.log(result)
    return new Response(JSON.stringify({ translation: result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('[OpenAI API error]', err);
    if (err.code === 'insufficient_quota' || err.status === 429)
      return new Response(JSON.stringify({ error: 'Quota exceeded', type: 'quota' }), { status: 429 });

    return new Response(
      JSON.stringify({ error: err?.message || 'Translation failed' }),
      { status: 500 },
    );
  }
}

// ---------------- helpers ----------------
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function flattenJson(obj: any, prefix = '', res: Record<string, string> = {}) {
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') {
      res[newKey] = val;
    } else if (val && typeof val === 'object') {
      flattenJson(val, newKey, res);
    }
  }
  return res;
}

function unflattenJson(flat: Record<string, string>) {
  const out: any = {};
  for (const flatKey in flat) {
    const path = flatKey.split('.');
    let cur = out;
    path.forEach((seg, idx) => {
      if (idx === path.length - 1) cur[seg] = flat[flatKey];
      else cur = cur[seg] ?? (cur[seg] = {});
    });
  }
  return out;
}

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), { status: 400 });
}