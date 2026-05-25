import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { NotesBlock } from './NotesBlock.js';
import { RankBadge } from './RankBadge.js';

export function DeckPreviewModal({ deck, progress, onClose }) {
  const [revealed, setRevealed] = useState(new Set());

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggle(id) {
    setRevealed(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const items = deck.items || [];
  const allRevealed = items.length > 0 && items.every(it => revealed.has(it.id));

  function toggleAll() {
    if (allRevealed) setRevealed(new Set());
    else setRevealed(new Set(items.map(it => it.id)));
  }

  return html`
    <div class="deck-preview-overlay" onClick=${onClose}>
      <div class="deck-preview-modal" onClick=${e => e.stopPropagation()}>
        <header class="deck-preview-header">
          <div class="deck-preview-title-block">
            <h2 class="deck-preview-title">${deck.name}</h2>
            ${deck.description && html`<p class="deck-preview-desc">${deck.description}</p>`}
            ${deck.author && html`<p class="deck-preview-author">✦ <a
              href=${'https://github.com/' + deck.author}
              target="_blank"
              rel="noopener noreferrer"
            >${deck.author}</a></p>`}
          </div>
          <button type="button" class="outline secondary exit-btn" onClick=${onClose}>✕</button>
        </header>

        <div class="deck-preview-toolbar">
          <div class="deck-preview-toolbar-left">
            <span class="deck-preview-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
            ${(() => {
              const mnemonicCount = items.filter(it => it.mnemonic?.trim()).length;
              return mnemonicCount > 0 && html`<span class="deck-preview-mnemonic-count" title="Items with a mnemonic">· 🧠 ${mnemonicCount}/${items.length}</span>`;
            })()}
          </div>
          <button type="button" class="secondary outline" onClick=${toggleAll}>
            ${allRevealed ? 'Hide all answers' : 'Reveal all answers'}
          </button>
        </div>

        <div class="deck-preview-list">
          ${items.map((item, i) => {
            const itemProgress = (progress && progress.items) ? progress.items[item.id] : null;
            const itemStage = itemProgress ? (itemProgress.stage || 0) : 0;
            return html`
            <div key=${item.id} class=${'deck-preview-item' + (revealed.has(item.id) ? ' revealed' : '')} onClick=${() => toggle(item.id)}>
              <span class="deck-preview-num">${i + 1}</span>
              <div class="deck-preview-content">
                <div class="deck-preview-q-row">
                  <p class="deck-preview-q">${item.title}</p>
                  ${itemStage >= 1 && html`<${RankBadge} stage=${itemStage} size="sm" interactive=${false} />`}
                </div>
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
          `;})}
        </div>
      </div>
    </div>
  `;
}
