import { html } from 'https://esm.sh/htm/preact';

export function MnemonicHint({ text }) {
  if (!text) return null;
  return html`
    <blockquote class="mnemonic-hint">
      ${text}
    </blockquote>
  `;
}
