import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔄 Translation API called');
  
  try {
    // Import Firebase Admin here to see initialization logs
    console.log('📥 Importing Firebase Admin...');
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    console.log('✅ Firebase Admin imported successfully');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    console.log('🔑 Auth header check:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or malformed authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const idToken = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', idToken.length);
    
    // Verify the token
    let decoded;
    try {
      console.log('🔍 Verifying token...');
      decoded = await adminAuth.verifyIdToken(idToken);
      console.log('✅ Token verified for user:', decoded.uid);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authorization token',
          details: typeof tokenError === 'object' && tokenError !== null && 'message' in tokenError ? (tokenError as { message: string }).message : String(tokenError)
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { payload, targetLanguages, sourceLanguage } = body;
    
    console.log('📝 Request details:', {
      payloadKeys: Object.keys(payload || {}).length,
      targetLanguages: targetLanguages?.length,
      sourceLanguage
    });
    
    if (!payload || !targetLanguages || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check user subscription and limits
    console.log('👤 Checking user limits...');
    const userDoc = await adminDB.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();
    
    const isPro = userData?.subscription?.status === 'active';
    const keysThisMonth = userData?.keys_month || 0;
    const keyCount = Object.keys(payload).length;
    
    console.log('📊 User status:', {
      isPro,
      keysThisMonth,
      keyCount,
      limit: isPro ? 'unlimited' : 200
    });
    
    if (!isPro && keysThisMonth + keyCount > 200) {
      return new Response(
        JSON.stringify({ error: 'Quota exceeded' }), 
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OpenAI API key');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call OpenAI translation
    console.log('🤖 Starting OpenAI translation...');
    const openai = (await import('openai')).default;
    const client = new openai({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const translations: Record<string, Record<string, string>> = {};
    
    // Translate to each target language
    for (const targetLang of targetLanguages) {
      console.log(`🌐 Translating to ${targetLang}...`);
      
      const prompt = `Translate the following JSON object from ${sourceLanguage} to ${targetLang}. 
      Return ONLY a valid JSON object with the same keys but translated values. 
      Do not add any explanations or formatting:

${JSON.stringify(payload, null, 2)}`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const translatedText = completion.choices[0]?.message?.content?.trim();
      if (!translatedText) {
        console.error(`❌ No translation received for ${targetLang}`);
        continue;
      }

      try {
        const translatedJson = JSON.parse(translatedText);
        translations[targetLang] = translatedJson;
        console.log(`✅ Translation completed for ${targetLang}`);
      } catch (parseError) {
        console.error(`❌ Failed to parse translation for ${targetLang}:`, parseError);
        console.error(`Raw response:`, translatedText);
      }
    }

    // Update user's key usage
    if (!isPro) {
      console.log('📈 Updating user key usage...');
      await adminDB.collection('users').doc(decoded.uid).update({
        keys_month: keysThisMonth + keyCount,
      });
    }

    console.log('🎉 Translation completed successfully');
    return new Response(JSON.stringify(translations), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('💥 Unexpected API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}