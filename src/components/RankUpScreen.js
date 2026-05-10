import { html } from 'https://esm.sh/htm/preact';
import { useEffect } from 'https://esm.sh/preact/hooks';
import { stageInfo } from './RankBadge.js';

export function RankUpScreen({ stage, onContinue }) {
  const info = stageInfo(stage);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') onContinue(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!info) return null;

  return html`
    <div class="rankup-screen">
      <p class="rankup-label">Rank Up!</p>
      <img
        src=${info.img}
        alt=${info.fullName}
        class="rankup-img"
        onClick=${onContinue}
      />
      <h2 class="rankup-name">${info.fullName}</h2>
      <button type="button" onClick=${onContinue}>Continue →</button>
      <p class="hint-enter">or press Enter</p>
    </div>
  `;
}
