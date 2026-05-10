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
        <h1 class="welcome-title">Hey there, future Bloopi!</h1>
        <p class="welcome-body">Welcome.</p>
        <p class="welcome-body">
          You're starting as a <strong>Drip</strong>. That's fine — everyone does.
          Answer questions, and watch the blob grow.
        </p>
        <button type="button" onClick=${handleContinue}>
          Let's blob
        </button>
      </div>
    </div>
  `;
}
