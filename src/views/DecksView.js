import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import Fuse from 'https://esm.sh/fuse.js@7';
import { getState, setState, subscribe } from '../store/store.js';
import { DeckCard } from '../components/DeckCard.js';
import { DeckPreviewModal } from '../components/DeckPreviewModal.js';

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'new',      label: '✦ New' },
  { id: 'learning', label: '🫧 Learning' },
  { id: 'done',     label: '⭐ Bloopi' },
];

const STOP = new Set(['a','an','the','of','in','on','at','to','and','or','for','with','by','from','its','are','was','key']);

function extractKeywords(decks) {
  const freq = {};
  for (const deck of decks) {
    // pull unique words from the name only — descriptions are too noisy
    const words = deck.name.split(/\W+/).filter(w => w.length >= 4 && !STOP.has(w.toLowerCase()));
    for (const w of new Set(words.map(w => w.toLowerCase()))) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
}

function deckStatus(deck, progressItems) {
  const items = deck.items || [];
  if (items.length === 0) return 'new';
  const added    = items.filter(it => progressItems[it.id]).length;
  const mastered = items.filter(it => (progressItems[it.id] || {}).level >= 5).length;
  if (added === 0)               return 'new';
  if (mastered === items.length) return 'done';
  return 'learning';
}

export function DecksView() {
  const [state, setLocalState] = useState(getState());
  const [query,       setQuery]       = useState('');
  const [filter,      setFilter]      = useState('all');
  const [previewDeck, setPreviewDeck] = useState(null);

  useEffect(() => subscribe(setLocalState), []);

  const decks         = state.loadedDecks || [];
  const progressItems = state.progress.items || {};

  const keywords = useMemo(() => extractKeywords(decks), [decks]);

  const fuse = useMemo(
    () => new Fuse(decks, { keys: [{ name: 'name', weight: 2 }, { name: 'description', weight: 1 }], threshold: 0.35, ignoreLocation: true }),
    [decks]
  );

  function addDeck(deck) {
    const progress = { ...state.progress, items: { ...progressItems } };
    for (const item of deck.items || []) {
      if (!progress.items[item.id]) {
        progress.items[item.id] = { level: 0, streak: 0, nextReview: null, failedToday: false };
      }
    }
    setState({ progress });
  }

  function removeDeck(deck) {
    const items = { ...progressItems };
    for (const item of deck.items || []) delete items[item.id];
    setState({ progress: { ...state.progress, items } });
  }

  const q = query.trim();
  const searched = q ? fuse.search(q).map(r => r.item) : decks;
  const visible  = searched.filter(d => filter === 'all' || deckStatus(d, progressItems) === filter);

  function toggleKeyword(kw) {
    setQuery(q.toLowerCase() === kw.toLowerCase() ? '' : kw);
  }

  return html`
    <div class="decks-view">
      ${previewDeck && html`<${DeckPreviewModal} deck=${previewDeck} progress=${state.progress} onClose=${() => setPreviewDeck(null)} />`}
      <h2>Available Decks</h2>

      <div class="decks-search">
        <input
          type="search"
          placeholder="Search decks…"
          value=${query}
          onInput=${e => setQuery(e.target.value)}
        />
      </div>

      ${keywords.length > 0 && html`
        <div class="keyword-chips">
          ${keywords.map(kw => html`
            <button
              key=${kw}
              type="button"
              class=${'keyword-chip' + (q.toLowerCase() === kw.toLowerCase() ? ' keyword-chip--active' : '')}
              onClick=${() => toggleKeyword(kw)}
            >${kw}</button>
          `)}
        </div>
      `}

      <div class="filter-pills">
        ${FILTERS.map(f => html`
          <button
            key=${f.id}
            type="button"
            class=${'filter-pill' + (filter === f.id ? ' filter-pill--active' : '')}
            onClick=${() => setFilter(f.id)}
          >
            ${f.label}
          </button>
        `)}
      </div>

      ${state.deckLoadError && html`
        <p class="error-msg">
          Failed to load decks. Serve the app over HTTP
          (e.g. <code>python -m http.server</code>).
        </p>
      `}
      ${!state.deckLoadError && decks.length === 0 && html`
        <p aria-busy="true">Loading decks…</p>
      `}
      ${visible.length === 0 && decks.length > 0 && html`
        <p class="muted-note">No decks match — try a different search or filter.</p>
      `}

      <div class="deck-grid">
        ${visible.map(deck => html`
          <${DeckCard}
            key=${deck.id}
            deck=${deck}
            progress=${state.progress}
            onAdd=${() => addDeck(deck)}
            onRemove=${() => removeDeck(deck)}
            onPreview=${() => setPreviewDeck(deck)}
          />
        `)}
      </div>
    </div>
  `;
}
