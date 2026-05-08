import { html } from 'https://esm.sh/htm/preact';

export function ProgressBar({ value, label }) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  return html`
    <div class="progress-bar-wrap">
      ${label && html`<small class="progress-label">${label}</small>`}
      <progress value=${clamped} max="1"></progress>
    </div>
  `;
}
