import { html } from 'https://esm.sh/htm/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import { ProgressBar } from './ProgressBar.js';

export function DeckCard({ deck, progress, onAdd, onRemove, onPreview }) {
  const [confirming, setConfirming] = useState(false);
  const items         = deck.items || [];
  const progressItems = progress.items || {};

  const masteredCount = items.filter(it => (progressItems[it.id] || {}).level >= 5).length;
  const addedCount    = items.filter(it => progressItems[it.id]).length;
  const newCount      = addedCount > 0 ? items.length - addedCount : 0;
  const allAdded      = items.length > 0 && addedCount === items.length;
  const completion    = items.length > 0 ? masteredCount / items.length : 0;

  return html`
    <article class="deck-card deck-card--clickable" onClick=${onPreview}>
      <header class="deck-header">
        <strong>${deck.name}</strong>
        <div class="deck-header-sub">
          ${newCount > 0 && html`<span class="deck-new-badge">${newCount} new</span>`}
          <small>${items.length} item${items.length !== 1 ? 's' : ''}${deck.author ? ` · by ${deck.author}` : ''}</small>
        </div>
      </header>
      <p>${deck.description}</p>
      <${ProgressBar} value=${completion} label="${masteredCount} mastered / ${items.length} total" />

      <footer onClick=${e => e.stopPropagation()}>
        ${confirming
          ? html`
            <div class="deck-footer-actions">
              <button type="button" class="secondary outline" onClick=${() => setConfirming(false)}>Cancel</button>
              <button type="button" class="deck-remove-yes" onClick=${() => { onRemove(); setConfirming(false); }}>Continue</button>
            </div>
          `
          : html`
            <div class="deck-footer-actions">
              <button
                type="button"
                class=${allAdded ? 'secondary' : ''}
                onClick=${() => onAdd()}
                disabled=${allAdded}
              >
                ${allAdded ? 'Added' : newCount > 0 ? `+ ${newCount} new` : 'Add'}
              </button>
              ${addedCount > 0 && html`
                <button type="button" class="secondary deck-remove-btn" onClick=${() => setConfirming(true)}>
                  Remove
                </button>
              `}
            </div>
          `
        }
      </footer>
    </article>
  `;
}
