export async function loadAllDecks() {
  const ids = await fetch('decks/index.json').then(r => r.json());
  const results = await Promise.allSettled(ids.map(id => loadDeck(id)));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

async function loadDeck(id) {
  const url = `decks/${id}.json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
  return r.json();
}
