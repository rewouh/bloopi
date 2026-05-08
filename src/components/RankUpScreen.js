import { html } from 'https://esm.sh/htm/preact';
import { useEffect } from 'https://esm.sh/preact/hooks';
import { RANKS } from './RankBadge.js';

export function RankUpScreen({ level, onContinue }) {
  const rank = RANKS[level];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') onContinue(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return html`
    <div class="rankup-screen">
      <p class="rankup-label">Rank Up!</p>
      <img
        src=${rank.img}
        alt=${rank.name}
        class="rankup-img"
        onClick=${onContinue}
      />
      <h2 class="rankup-name">${rank.name}</h2>
      <button type="button" onClick=${onContinue}>Continue →</button>
      <p class="hint-enter">or press Enter</p>
    </div>
  `;
}
