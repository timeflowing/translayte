export async function translateBatch(
  entries: Record<string, string>,
  targetLangCode: string,
  sourceLangCode: string,
) {
  const res  = await fetch('/api/translate', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      json: entries,
      from: sourceLangCode,
      to  : targetLangCode,
    }),
  });

  const data = await res.json();
  /* ⬇️  the server returns { translation: { … } } */
  return data.translation as Record<string, string>;
}