import { auth } from "../lib/firebaseClient"

export async function translateBatch(
  entries: Record<string, string>,
  targetLangCode: string,
  sourceLangCode: string,
) {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')

  const idToken = await user.getIdToken()
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      json: entries,
      from: sourceLangCode,
      to: targetLangCode,
    }),
  })

  // if non‐2xx, log and throw the raw text
  if (!res.ok) {
    const text = await res.text()
    console.error('[translateBatch] API error:', res.status, text)
    throw new Error(text || res.statusText)
  }

  const { translation } = await res.json()
  return translation as Record<string, string>
}