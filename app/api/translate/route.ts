import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // WARNING: Authentication is bypassed for debugging.
    // This makes the endpoint public and is not secure for production.
    // const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    
    // const authHeader = req.headers.get('authorization');
    
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return new Response(
    //     JSON.stringify({ error: 'Authentication required' }), 
    //     { status: 401, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }
    
    // const idToken = authHeader.replace('Bearer ', '');
    
    // let decoded;
    // try {
    //   decoded = await adminAuth.verifyIdToken(idToken);
    // } catch (error) {
    //   // Add detailed server-side logging for debugging in production
    //   console.error("CRITICAL: Token verification failed.", {
    //     // The error code tells you exactly what's wrong.
    //     // Common codes: 'auth/id-token-expired', 'auth/argument-error'
    //     errorCode: typeof error === 'object' && error !== null && 'code' in error ? (error as { code: string }).code : undefined,
    //     errorMessage: (error as Error).message,
    //   });

    //   // Send a generic error to the client
    //   return new Response(
    //     JSON.stringify({ error: 'Invalid authentication token' }), 
    //     { status: 401, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }
    
    const body = await req.json();
    const { payload, targetLanguages, sourceLanguage } = body;
    
    if (!payload || !targetLanguages || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Bypassing user-specific logic for debugging
    // const userDoc = await adminDB.collection('users').doc(decoded.uid).get();
    // const userData = userDoc.data();
    
    // const isPro = userData?.subscription?.status === 'active';
    // const keysThisMonth = userData?.keys_month || 0;
    // const keyCount = Object.keys(payload).length;
    
    // if (!isPro && keysThisMonth + keyCount > 200) {
    //   return new Response(
    //     JSON.stringify({ error: 'Quota exceeded. Please upgrade to continue.' }), 
    //     { status: 429, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Translation service is temporarily unavailable.' }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = (await import('openai')).default;
    const client = new openai({ apiKey: process.env.OPENAI_API_KEY });

    const translations: Record<string, Record<string, string>> = {};
    
    for (const targetLang of targetLanguages) {
      const prompt = `Translate the following JSON object from ${sourceLanguage} to ${targetLang}. Return ONLY a valid JSON object with the same keys but translated values. Do not add any explanations or formatting:\n\n${JSON.stringify(payload, null, 2)}`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const translatedText = completion.choices[0]?.message?.content?.trim();
      if (translatedText) {
        try {
          translations[targetLang] = JSON.parse(translatedText);
        } catch {
          // Ignore if OpenAI returns invalid JSON
        }
      }
    }

    // Bypassing user-specific logic for debugging
    // if (!isPro) {
    //   await adminDB.collection('users').doc(decoded.uid).update({
    //     keys_month: keysThisMonth + keyCount,
    //   });
    // }

    return new Response(JSON.stringify(translations), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Translate API CATCH_ALL Error:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred on the server.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}