import { adminAuth, adminDB } from '../../lib/firebaseAdmin';
import OpenAI from 'openai';
import { FieldValue } from 'firebase-admin/firestore';

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

type TranslationJson = { [key: string]: string | TranslationJson };

// JSON validation and formatting helper
function validateAndFormatJson(jsonString: string): { valid: boolean; data?: any; formatted?: string; error?: string } {
  try {
    // Try to parse the JSON
    const parsed = JSON.parse(jsonString);
    
    // If successful, return formatted version
    return {
      valid: true,
      data: parsed,
      formatted: JSON.stringify(parsed, null, 2)
    };
  } catch (error) {
    // Try to fix common JSON issues
    let fixedJson = jsonString
      .replace(/'/g, '"')                    // Replace single quotes with double quotes
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
      .replace(/,(\s*[}\]])/g, '$1')         // Remove trailing commas
      .replace(/\n/g, '')                    // Remove newlines
      .trim();

    try {
      const parsed = JSON.parse(fixedJson);
      return {
        valid: true,
        data: parsed,
        formatted: JSON.stringify(parsed, null, 2)
      };
    } catch (secondError) {
      return {
        valid: false,
        error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export async function POST(req: Request) {
  console.log('🔥 API route called');
  
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');

    if (!idToken) {
      console.log('❌ No auth token');
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        { status: 401 }
      );
    }

    console.log('🔍 Verifying token...');
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
      console.log('✅ Token verified for user:', decoded.uid);
    } catch (err) {
      console.log('❌ Token verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401 }
      );
    }

    console.log('🔍 Fetching user data...');
    const userRef = adminDB.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    console.log('✅ User data fetched');

    const keysMonth = typeof userData?.keys_month === 'number' ? userData?.keys_month : 0;

    const { json, jsonString, texts, from, to } = await req.json();
    console.log('📝 Request data:', { json: !!json, jsonString: !!jsonString, texts: !!texts, from, to });

    // Handle JSON validation and formatting
    if (jsonString && !json) {
      const validation = validateAndFormatJson(jsonString);
      
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON format',
            details: validation.error,
            suggestion: 'Please check your JSON syntax and try again.'
          }),
          { status: 400 }
        );
      }

      // If JSON was invalid but we fixed it, return the formatted version
      if (jsonString !== validation.formatted) {
        return new Response(
          JSON.stringify({ 
            action: 'format',
            formatted: validation.formatted,
            message: 'JSON has been automatically formatted'
          }),
          { status: 200 }
        );
      }

      // Use the parsed data for translation
      const finalJson = validation.data;
    }

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

    const translations: Record<string, TranslationJson | string[]> = {};
    const targets = Array.isArray(to) ? to : [to];

    console.log('🌍 Starting translation for languages:', targets);

    try {
      for (const lang of targets) {
        console.log(`🔄 Translating to ${lang}...`);
        const translatedFlat: Record<string, string> = {};
        const batches = chunk(Object.entries(flat), BATCH_SIZE);

        for (const batch of batches) {
          const prompt = [
            `Translate the following to **${lang}**:`,
            batch.map(([k, v]) => `${k}: ${v}`).join('\n')
          ].join('\n\n');

          console.log(`📤 Sending batch to OpenAI for ${lang}...`);
          const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
          });

          const result = completion.choices[0]?.message?.content || '';
          console.log(`📥 Received response for ${lang}`);

          // Parse the response
          const lines = result.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const match = line.match(/^(.+?):\s*(.+)$/);
            if (match) {
              const [, key, value] = match;
              translatedFlat[key.trim()] = value.trim();
            }
          }
        }

        // Convert back to nested if original was JSON
        translations[lang] = json ? unflattenJson(translatedFlat) : Object.values(translatedFlat);
        console.log(`✅ Completed translation for ${lang}`);
      }

      // Update user's key count
      const newKeysMonth = keysMonth + keys.length;
      await userRef.update({ keys_month: newKeysMonth });
      console.log(`📊 Updated user key count: ${newKeysMonth}`);

      console.log('🎉 Translation completed successfully');
      return new Response(JSON.stringify({ translation: translations }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error('💥 Translation error:', err);
      throw err;
    }

  } catch (error) {
    console.error('💥 API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

// ------------- Helpers -------------

function flattenJson(obj: TranslationJson, prefix = '', res: Record<string, string> = {}) {
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'string') {
      res[newKey] = obj[key] as string;
    } else {
      flattenJson(obj[key] as TranslationJson, newKey, res);
    }
  }
  return res;
}

function unflattenJson(flat: Record<string, string>): TranslationJson {
  const out: TranslationJson = {};
  for (const flatKey in flat) {
    const path = flatKey.split('.');
    let cur = out;
    path.forEach((seg, idx) => {
      if (idx === path.length - 1) {
        cur[seg] = flat[flatKey];
      } else {
        if (!cur[seg]) cur[seg] = {};
        cur = cur[seg] as TranslationJson;
      }
    });
  }
  return out;
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function badRequest(msg: string): Response {
  return new Response(JSON.stringify({ error: msg }), { status: 400 });
}