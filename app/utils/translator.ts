import { auth } from "../lib/firebaseClient";

export async function translateBatch(
  entries: Record<string, string>,
  targetLangCodes: string[], // Changed to accept an array of codes
  sourceLangCode: string,
) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const idToken = await user.getIdToken();

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      json: entries,
      from: sourceLangCode,
      to: targetLangCodes, // Pass all target codes to the API
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[translateBatch] API error:', res.status, text);
    // Check for quota error specifically to show a paywall
    if (res.status === 429) {
        const errorData = JSON.parse(text);
        if (errorData.type === 'quota') {
            throw new Error('Quota exceeded');
        }
    }
    throw new Error(text || res.statusText);
  }

  // The API returns { translation: { lang1: {...}, lang2: {...} } }
  const { translation } = await res.json();
  return translation as Record<string, Record<string, string>>;
}