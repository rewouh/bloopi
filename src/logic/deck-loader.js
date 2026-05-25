export async function loadAllDecks() {
  const ids = await discoverDeckIds();
  const results = await Promise.allSettled(ids.map(loadDeck));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

async function discoverDeckIds() {
  const r = await fetch('decks/index.json');
  if (!r.ok) throw new Error('Could not load decks/index.json');
  return (await r.text()).split('\n').map(s => s.trim()).filter(Boolean);
}

async function loadDeck(id) {
  const url = `decks/${id}.json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
  return r.json();
}
