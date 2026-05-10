export async function loadAllDecks() {
  const ids = await discoverDeckIds();
  const results = await Promise.allSettled(ids.map(loadDeck));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

async function discoverDeckIds() {
  // GitHub Contents API — works on GitHub Pages (public repo, no auth needed)
  try {
    const r = await fetch(
      'https://api.github.com/repos/rewouh/bloopi/contents/decks',
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (r.ok) {
      const files = await r.json();
      return files
        .filter(f => f.type === 'file' && f.name.endsWith('.json'))
        .map(f => f.name.replace(/\.json$/, ''));
    }
  } catch {}

  // Directory listing fallback — works with `python -m http.server`
  const r = await fetch('decks/');
  if (!r.ok) throw new Error('Could not discover decks');
  const html = await r.text();
  return [...html.matchAll(/href="([a-z0-9][a-z0-9_-]*\.json)"/gi)]
    .map(m => m[1].replace(/\.json$/, ''));
}

async function loadDeck(id) {
  const url = `decks/${id}.json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
  return r.json();
}
