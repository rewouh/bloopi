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

// ── Version check ──
(async function checkVersion() {
  try {
    const { v } = await fetch('version.json', { cache: 'no-store' }).then(r => r.json());
    const stored = localStorage.getItem('bloopi_ver');
    if (stored !== null && stored !== String(v)) {
      const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
      const shortcut = isMac ? '⌘ Shift R' : 'Ctrl Shift R';
      const banner = document.createElement('div');
      banner.className = 'update-banner';
      banner.innerHTML = `
        <span>A new version is available — hard refresh to update: <kbd>${shortcut}</kbd></span>
        <button class="update-banner-close" aria-label="Dismiss">✕</button>
      `;
      banner.querySelector('.update-banner-close').addEventListener('click', () => banner.remove());
      document.body.prepend(banner);
    }
    localStorage.setItem('bloopi_ver', String(v));
  } catch {}
})();

// ── Scrollbar rainbow ──
const SCROLL_COLORS = [
  [103, 232, 249], // cyan  (rank 1)
  [ 74, 222, 128], // lime  (rank 2)
  [251, 191,  36], // amber (rank 3)
  [244, 114, 182], // pink  (rank 4)
  [168,  85, 247], // purple(rank 5)
];

function updateScrollbarColor() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? window.scrollY / max : 0;
  const n = SCROLL_COLORS.length - 1;
  const scaled = pct * n;
  const i = Math.min(Math.floor(scaled), n - 1);
  const t = scaled - i;
  const [r1, g1, b1] = SCROLL_COLORS[i];
  const [r2, g2, b2] = SCROLL_COLORS[i + 1];
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  document.documentElement.style.setProperty('--scrollbar-thumb', `rgb(${r},${g},${b})`);
}

window.addEventListener('scroll', updateScrollbarColor, { passive: true });
updateScrollbarColor();
