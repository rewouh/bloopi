import { html } from 'https://esm.sh/htm/preact';
import { useEffect } from 'https://esm.sh/preact/hooks';
import { stageInfo } from './RankBadge.js';

export function RankUpScreen({ stage, answer, onContinue }) {
  const info = stageInfo(stage);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') onContinue(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!info) return null;

  return html`
    <div class="rankup-screen">
      <div class="rankup-header">
        <span class="rankup-label">Rank Up!</span>
        <span class="rankup-name">${info.fullName}</span>
      </div>
      <img
        src=${info.img}
        alt=${info.fullName}
        class="rankup-img"
        onClick=${onContinue}
      />
      <div class="rankup-actions">
        ${answer && html`<p class="answer-reveal"><strong>Answer</strong> : ${answer}</p>`}
        <button type="button" onClick=${onContinue}>Continue</button>
      </div>
      <p class="hint-enter">or press Enter</p>
    </div>
  `;
}
