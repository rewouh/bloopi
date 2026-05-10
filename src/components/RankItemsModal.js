import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact/hooks';
import Fuse from 'https://esm.sh/fuse.js@7';
import { RankBadge, RANKS } from './RankBadge.js';

export function RankItemsModal({ level, entries, onClose }) {
  const [revealed, setRevealed] = useState(new Set());
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fuse = useMemo(
    () => new Fuse(entries, { keys: ['item.title'], threshold: 0.4, ignoreLocation: true }),
    [entries]
  );

  const ITEM_LIMIT = 50;
  const allFiltered = query.trim() ? fuse.search(query.trim()).map(r => r.item) : entries;
  const filtered  = query.trim() ? allFiltered : allFiltered.slice(0, ITEM_LIMIT);
  const hasMore   = !query.trim() && allFiltered.length > ITEM_LIMIT;

  function toggle(id) {
    setRevealed(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allRevealed = filtered.length > 0 && filtered.every(({ item }) => revealed.has(item.id));

  function toggleAll() {
    if (allRevealed) setRevealed(new Set());
    else setRevealed(new Set(filtered.map(({ item }) => item.id)));
  }

  return html`
    <div class="deck-preview-overlay" onClick=${onClose}>
      <div class="deck-preview-modal" onClick=${e => e.stopPropagation()}>
        <header class="deck-preview-header">
          <div class="deck-preview-title-block rank-items-header">
            <${RankBadge} level=${level} size="lg" interactive=${false} />
            <div>
              <h2 class="deck-preview-title">${RANKS[level].name}</h2>
              <p class="deck-preview-desc">${entries.length} item${entries.length !== 1 ? 's' : ''} at this rank</p>
            </div>
          </div>
          <button type="button" class="outline secondary exit-btn" onClick=${onClose}>✕</button>
        </header>

        <div class="modal-search">
          <input
            type="search"
            placeholder="Search items…"
            value=${query}
            onInput=${e => setQuery(e.target.value)}
          />
        </div>

        <div class="deck-preview-toolbar">
          <span class="deck-preview-count">
            ${query.trim()
              ? `${filtered.length} of ${entries.length}`
              : hasMore ? `${ITEM_LIMIT} of ${entries.length}` : `${entries.length}`
            } item${entries.length !== 1 ? 's' : ''}
          </span>
          <button type="button" class="secondary outline" onClick=${toggleAll} disabled=${filtered.length === 0}>
            ${allRevealed ? 'Hide all' : 'Reveal all'}
          </button>
        </div>

        <div class="deck-preview-list">
          ${filtered.length === 0 && html`<p class="muted-note" style="text-align:center;padding:1rem">No items match.</p>`}
          ${filtered.map(({ item, deckName }, i) => html`
            <div key=${item.id} class=${'deck-preview-item' + (revealed.has(item.id) ? ' revealed' : '')} onClick=${() => toggle(item.id)}>
              <span class="deck-preview-num">${i + 1}</span>
              <div class="deck-preview-content">
                ${deckName && html`<span class="deck-tag" style="margin-bottom:.35rem">${deckName}</span>`}
                <p class="deck-preview-q">${item.title}</p>
                ${revealed.has(item.id)
                  ? html`
                    <p class="deck-preview-a">${item.answers[0]}</p>
                    ${item.mnemonic && html`<p class="deck-preview-mnemonic">${item.mnemonic}</p>`}
                    ${item.notes    && html`<p class="deck-preview-notes">💡 ${item.notes}</p>`}
                  `
                  : html`<p class="deck-preview-tap">Tap to reveal</p>`
                }
              </div>
            </div>
          `)}
          ${hasMore && html`<p class="muted-note" style="text-align:center;padding:.75rem 0 0">Search to see remaining ${allFiltered.length - ITEM_LIMIT} items.</p>`}
        </div>
      </div>
    </div>
  `;
}
