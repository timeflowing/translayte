import { auth } from '../lib/firebaseClient';

export async function translateBatch(
  payload: Record<string, string>,
  targetLanguages: string[],
  sourceLanguage: string = 'en_XX'
): Promise<Record<string, Record<string, string>>> {
  try {
    // Get current user and token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get fresh ID token
    const idToken = await user.getIdToken(true); // Force refresh 
    console.log('[translateBatch] Sending request with token:', idToken.substring(0, 20) + '...');

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`, // Ensure Bearer prefix
      },
      body: JSON.stringify({
        payload,
        targetLanguages,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[translateBatch] API error:', response.status, errorText);
      
      if (response.status === 401) {
        // Try to refresh token and retry once
        const freshToken = await user.getIdToken(true);
        const retryResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`,
          },
          body: JSON.stringify({
            payload,
            targetLanguages,
            sourceLanguage,
          }),
        });
        
        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          throw new Error(retryError);
        }
        
        return await retryResponse.json();
      }
      
      throw new Error(errorText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[translateBatch] Error:', error);
    throw error;
  }
}