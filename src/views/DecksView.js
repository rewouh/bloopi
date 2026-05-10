import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import Fuse from 'https://esm.sh/fuse.js@7';
import { getState, setState, subscribe } from '../store/store.js';
import { langFlagUrl } from '../logic/lang.js';
import { DeckCard } from '../components/DeckCard.js';
import { DeckPreviewModal } from '../components/DeckPreviewModal.js';
import { FilterDropdown } from '../components/FilterDropdown.js';

const DECK_LIMIT = 30;

const STATUS_FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'new',      label: '✦ New' },
  { id: 'learning', label: '🫧 Learning' },
  { id: 'done',     label: '⭐ Bloopi' },
];

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
  const [status,      setStatus]      = useState('all');
  const [langFilter,  setLangFilter]  = useState(null);
  const [tagFilter,   setTagFilter]   = useState(null);
  const [previewDeck, setPreviewDeck] = useState(null);

  useEffect(() => subscribe(setLocalState), []);

  const decks         = state.loadedDecks || [];
  const progressItems = state.progress.items || {};

  const fuse = useMemo(
    () => new Fuse(decks, { keys: [{ name: 'name', weight: 2 }, { name: 'description', weight: 1 }], threshold: 0.35, ignoreLocation: true }),
    [decks]
  );

  const langOptions = useMemo(() => {
    const seen = new Set();
    return decks
      .filter(d => d.language && !seen.has(d.language) && seen.add(d.language))
      .map(d => ({ id: d.language, label: d.language.toUpperCase(), icon: html`<img src=${langFlagUrl(d.language)} alt=${d.language.toUpperCase()} class="lang-flag-img" />` }));
  }, [decks]);

  const tagOptions = useMemo(() => {
    const freq = {};
    for (const deck of decks) {
      for (const tag of (deck.tags || [])) {
        freq[tag] = (freq[tag] || 0) + 1;
      }
    }
    return Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))
      .map(tag => ({ id: tag, label: tag.charAt(0).toUpperCase() + tag.slice(1) }));
  }, [decks]);

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
  const filtered = searched
    .filter(d => status === 'all' || deckStatus(d, progressItems) === status)
    .filter(d => !langFilter || d.language === langFilter)
    .filter(d => !tagFilter  || (d.tags || []).includes(tagFilter));

  const visible = filtered.slice(0, DECK_LIMIT);
  const hasMore = filtered.length > DECK_LIMIT;

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

      <div class="filter-pills">
        ${STATUS_FILTERS.map(f => html`
          <button
            key=${f.id}
            type="button"
            class=${'filter-pill' + (status === f.id ? ' filter-pill--active' : '')}
            onClick=${() => setStatus(f.id)}
          >
            ${f.label}
          </button>
        `)}
        ${langOptions.length > 0 && html`
          <${FilterDropdown}
            label="Language"
            options=${langOptions}
            value=${langFilter}
            onChange=${setLangFilter}
          />
        `}
        ${tagOptions.length > 0 && html`
          <${FilterDropdown}
            label="Tags"
            options=${tagOptions}
            value=${tagFilter}
            onChange=${setTagFilter}
            defaultMax=${50}
          />
        `}
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
      ${filtered.length === 0 && decks.length > 0 && html`
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

      ${hasMore && html`
        <p class="decks-overflow-note">
          Showing ${DECK_LIMIT} of ${filtered.length} decks — refine your search or filters to see more.
        </p>
      `}
    </div>
  `;
}
