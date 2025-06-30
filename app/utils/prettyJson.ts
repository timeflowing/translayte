/* utils/prettyJson.ts -------------------------------------------------- */
export function prettyJson(data: unknown) {
  return JSON.stringify(data, null, 2);
}
export function highlightJson(str: string) {
  /* ---------- 1 - wrap literals (keys, values, numbers …) ------------- */
  let html = str.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    m => {
      let cls = 'text-green-400';                     // string *value*

      if (/^"/.test(m) && /:$/.test(m)) cls = 'text-orange-400';   // object key
      else if (/true|false/.test(m))     cls = 'text-purple-400';   // boolean
      else if (/null/.test(m))           cls = 'text-pink-400';     // null
      else if (/^-?\d/.test(m))          cls = 'text-blue-400';     // number

      return `<span class="${cls}">${m}</span>`;
    },
  );

  /* ---------- 2 - colour the comma *after* a green string value ------- */
  html = html.replace(
    /(<span class="text-green-400">[^<]*?<\/span>)(\s*,)/g,
    '$1<span class="text-green-400">$2</span>',
  );

  /* ---------- 3 - braces / brackets / remaining commas ---------------- */
  return html
    // split into “already-coloured” spans and the rest
    .split(/(<span[^>]*>.*?<\/span>)/g)
    .map(chunk =>
      chunk.startsWith('<span')
        ? chunk   // coloured part → keep as is
        : chunk.replace(/([{}\[\],])/g,
            '<span class="text-orange-400">$1</span>'),
    )
    .join('');
}