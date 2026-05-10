import { html } from 'https://esm.sh/htm/preact';
import { getState, setState } from '../store/store.js';

export function WelcomeView() {
  function handleContinue() {
    const { progress } = getState();
    setState({ progress: { ...progress, welcomed: true } });
    window.location.hash = 'guide';
  }

  return html`
    <div class="welcome-overlay">
      <div class="welcome-card">
        <span class="welcome-blob">🫧</span>
        <h1 class="welcome-title">Hey there, future Bloopi!</h1>
        <p class="welcome-body">
          You're starting as a <strong>Drip</strong>. That's fine — everyone does.
          Answer questions, and watch the blob grow. By the time something reaches
          <strong>Bloopi</strong> rank, you'll never forget it again.
        </p>
        <p class="welcome-contribute">
          Want to add your own decks?
          <a href="https://github.com/rewouh/bloopi#readme" target="_blank" rel="noopener noreferrer">Check the README →</a>
        </p>
        <button type="button" onClick=${handleContinue}>
          Let's blob →
        </button>
      </div>
    </div>
  `;
}
