import { html } from 'https://esm.sh/htm/preact';
import { useState, useRef } from 'https://esm.sh/preact/hooks';

export function NotesBlock({ text, onSave }) {
  const [draft,  setDraft]  = useState(text || '');
  const [saved,  setSaved]  = useState(false);
  const lastSaved = useRef(text || '');

  function save() {
    const val = draft.trim();
    if (val === lastSaved.current) return;
    onSave(val);
    lastSaved.current = val;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
      e.target.blur();
    }
  }

  if (!text && !onSave) return null;

  return html`
    <aside class="notes-block">
      <span class="notes-icon">💡</span>
      ${onSave
        ? html`
            <textarea
              class="notes-inline-editor"
              rows="1"
              value=${draft}
              placeholder="Add a personal note…"
              onInput=${e => setDraft(e.target.value)}
              onBlur=${save}
              onKeyDown=${onKeyDown}
            />`
        : html`<p>${text}</p>`
      }
      ${saved && html`<span class="notes-saved-flash">✓</span>`}
    </aside>
  `;
}
