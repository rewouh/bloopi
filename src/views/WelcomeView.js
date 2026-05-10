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
        <h1 class="welcome-title">Welcome to Bloopi.</h1>
        <p class="welcome-body">
          Your collection is empty for now. Add decks, answer questions, and watch your items climb from <strong>Drip</strong> all the way to <strong>Bloopi</strong>.
        </p>
        <button type="button" onClick=${handleContinue}>
          Let's blob
        </button>
      </div>
    </div>
  `;
}
