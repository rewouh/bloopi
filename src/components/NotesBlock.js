import { html } from 'https://esm.sh/htm/preact';

export function NotesBlock({ text }) {
  if (!text) return null;
  return html`
    <aside class="notes-block">
      <span class="notes-icon">💡</span>
      <p>${text}</p>
    </aside>
  `;
}
