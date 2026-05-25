import { html } from 'https://esm.sh/htm/preact';
import { useState } from 'https://esm.sh/preact/hooks';

export function NotesBlock({ text, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  function startEdit() {
    setDraft(text || '');
    setEditing(true);
  }

  function save() {
    onSave(draft.trim());
    setEditing(false);
  }

  function cancel() { setEditing(false); }

  if (editing) {
    return html`
      <aside class="notes-block notes-block--editing">
        <span class="notes-icon">💡</span>
        <div class="notes-edit-body">
          <textarea
            class="notes-textarea"
            rows="3"
            value=${draft}
            onInput=${e => setDraft(e.target.value)}
            placeholder="Add a personal note…"
          />
          <div class="notes-edit-actions">
            <button type="button" class="outline secondary notes-action-btn" onClick=${cancel}>Cancel</button>
            <button type="button" class="notes-action-btn" onClick=${save}>Save</button>
          </div>
        </div>
      </aside>
    `;
  }

  if (!text && !onSave) return null;

  return html`
    <aside class="notes-block ${!text ? 'notes-block--empty' : ''}">
      <span class="notes-icon">💡</span>
      <p>${text || html`<span class="notes-placeholder">Add a personal note…</span>`}</p>
      ${onSave && html`
        <button type="button" class="notes-edit-btn" onClick=${startEdit} title="Edit note">✏</button>
      `}
    </aside>
  `;
}
