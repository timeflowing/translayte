import { auth } from '../lib/firebaseClient';

export interface TranslationResponse {
  translations: Record<string, Record<string, string>>;
  detectedSourceLanguage: string | null;
}

export async function translateBatch(
  payload: Record<string, string>,
  targetLanguages: string[],
  sourceLanguage: string = 'auto'
): Promise<TranslationResponse> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    // Force a token refresh to ensure it's not expired.
    const idToken = await user.getIdToken(true);

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        payload,
        targetLanguages,
        sourceLanguage,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Throw an error with the message from the server's JSON response
      throw new Error(result.error || 'An unknown API error occurred.');
    }

    return result;
  } catch (error) {
    console.error('[translateBatch] Error:', error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}