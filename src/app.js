import { h, render } from 'https://esm.sh/preact';
import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, setState, subscribe } from './store/store.js';
import { loadAllDecks } from './logic/deck-loader.js';
import { HomeView } from './views/HomeView.js';
import { DecksView } from './views/DecksView.js';
import { StatsView } from './views/StatsView.js';
import { GuideView } from './views/GuideView.js';
import { LessonView } from './views/LessonView.js';
import { ReviewView } from './views/ReviewView.js';

function App() {
  const [state, setLocalState] = useState(getState());

  useEffect(() => subscribe(setLocalState), []);

  useEffect(() => {
    loadAllDecks()
      .then(decks => setState({ loadedDecks: decks }))
      .catch(err => setState({ deckLoadError: err.message }));
  }, []);

  useEffect(() => {
    function onHash() {
      const view = window.location.hash.replace('#', '') || 'home';
      setState({ currentView: view });
    }
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function navigate(view) {
    window.location.hash = view;
  }

  const { currentView, activeSession } = state;

  return html`
    <div class="app-content">
      <main>
        ${currentView === 'home'  && html`<${HomeView} />`}
        ${currentView === 'decks' && html`<${DecksView} />`}
        ${currentView === 'stats' && html`<${StatsView} />`}
        ${currentView === 'guide' && html`<${GuideView} />`}
      </main>
    </div>

    <nav class="tab-bar" aria-label="Main navigation">
      <button class=${'tab-btn' + (currentView === 'home' ? ' active' : '')} onClick=${() => navigate('home')}>
        <img class="tab-icon-img" src="src/images/page_home.png" alt="" />
        <span>Home</span>
      </button>
      <button class=${'tab-btn' + (currentView === 'decks' ? ' active' : '')} onClick=${() => navigate('decks')}>
        <img class="tab-icon-img" src="src/images/page_decks.png" alt="" />
        <span>Decks</span>
      </button>
      <button class=${'tab-btn' + (currentView === 'stats' ? ' active' : '')} onClick=${() => navigate('stats')}>
        <img class="tab-icon-img" src="src/images/page_stats.png" alt="" />
        <span>Stats</span>
      </button>
      <button class=${'tab-btn' + (currentView === 'guide' ? ' active' : '')} onClick=${() => navigate('guide')}>
        <img class="tab-icon-img" src="src/images/page_guide.png" alt="" />
        <span>Guide</span>
      </button>
    </nav>

    ${activeSession && activeSession.type === 'lesson' && html`<${LessonView} session=${activeSession} />`}
    ${activeSession && activeSession.type === 'review' && html`<${ReviewView} session=${activeSession} />`}
  `;
}

render(h(App, null), document.getElementById('app'));
