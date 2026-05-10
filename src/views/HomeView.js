import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, setState, subscribe } from '../store/store.js';
import { getSessionItems } from '../logic/scheduler.js';
import { DataPorter } from '../components/DataPorter.js';

function upcomingCalendar(progress) {
  const items = Object.values(progress.items || {});
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });
    const count = i === 0
      ? items.filter(it => it.nextReview && it.nextReview <= dateStr && it.level > 0 && it.level < 5).length
      : items.filter(it => it.nextReview === dateStr && it.level > 0 && it.level < 5).length;
    return { label, count, isToday: i === 0 };
  });
}

export function HomeView() {
  const [state, setLocalState] = useState(getState());

  useEffect(() => subscribe(setLocalState), []);

  const allItems = (state.loadedDecks || []).flatMap(d => d.items || []);
  const { lessons, reviews } = getSessionItems(state.progress, allItems);
  const calendar = upcomingCalendar(state.progress);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const LESSON_BATCH = 5;

  function startReviews() {
    setState({ activeSession: { type: 'review', items: shuffle(reviews) } });
  }

  function startLessons() {
    setState({ activeSession: { type: 'lesson', items: shuffle(lessons).slice(0, LESSON_BATCH) } });
  }

  return html`
    <div class="home-view">
      <h1 class="app-title">Bloopi</h1>
      <p class="home-subtitle">Let your memory blob.</p>

      <div class="today-cards">
        <div class="today-card today-card--review">
          <span class="today-num">${reviews.length}</span>
          <small>reviews due</small>
        </div>
        <div class="today-card today-card--lesson">
          <span class="today-num">${lessons.length}</span>
          <small>lessons ready</small>
        </div>
      </div>

      <div class="session-buttons">
        <button type="button" onClick=${startReviews} disabled=${reviews.length === 0}>
          Start reviews
        </button>
        <button type="button" class="secondary" onClick=${startLessons} disabled=${lessons.length === 0}>
          Start lessons
        </button>
      </div>

      <div class="calendar-section">
        <p class="calendar-title">Upcoming reviews</p>
        <div class="calendar-row">
          ${calendar.map(({ label, count, isToday }) => html`
            <div class=${'calendar-day' + (isToday ? ' cal-today' : '') + (count > 0 ? ' cal-has' : '')}>
              <span class="cal-label">${label}</span>
              <span class="cal-count">${count > 0 ? count : '·'}</span>
            </div>
          `)}
        </div>
      </div>

      ${state.deckLoadError && html`
        <p class="error-msg">
          Could not load decks. Serve the app over HTTP
          (e.g. <code>python -m http.server</code>).
        </p>
      `}

      <details class="porter-details">
        <summary>💾 Import / Export data</summary>
        <${DataPorter} />
      </details>
    </div>
  `;
}
