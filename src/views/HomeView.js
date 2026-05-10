import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, setState, subscribe } from '../store/store.js';
import { getSessionItems } from '../logic/scheduler.js';
import { DataPorter } from '../components/DataPorter.js';

function buildCalendar(progress) {
  const items = Object.values(progress.items || {});
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const label = i === 0 ? 'Today' : dayStart.toLocaleDateString('en', { weekday: 'short' });

    let count;
    if (i === 0) {
      count = items.filter(it => it.nextReview && new Date(it.nextReview) <= now && it.stage >= 1 && it.stage < 9).length;
    } else {
      count = items.filter(it => {
        if (!it.nextReview || it.stage < 1 || it.stage >= 9) return false;
        const nr = new Date(it.nextReview);
        return nr >= dayStart && nr < dayEnd;
      }).length;
    }

    return { label, count, isToday: i === 0, dayStart, dayEnd };
  });
}

function getDayBreakdown(progress, dayStart, dayEnd, isToday) {
  const now = new Date();
  const byHour = {};

  for (const it of Object.values(progress.items || {})) {
    if (!it.nextReview || it.stage < 1 || it.stage >= 9) continue;
    const nr = new Date(it.nextReview);

    if (isToday) {
      if (nr > now) continue;
      byHour['overdue'] = (byHour['overdue'] || 0) + 1;
    } else {
      if (nr < dayStart || nr >= dayEnd) continue;
      const h = nr.getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    }
  }

  if (isToday) {
    const count = byHour['overdue'] || 0;
    return count > 0 ? [{ label: 'Due now', count }] : [];
  }

  return Object.entries(byHour)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, count]) => ({ label: `${String(h).padStart(2, '0')}:00`, count }));
}

export function HomeView() {
  const [state, setLocalState] = useState(getState());
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  useEffect(() => subscribe(setLocalState), []);

  const allItems = (state.loadedDecks || []).flatMap(d => d.items || []);
  const { lessons, reviews } = getSessionItems(state.progress, allItems);
  const calendar = buildCalendar(state.progress);

  const selectedDay = selectedDayIdx !== null ? calendar[selectedDayIdx] : null;
  const dayBreakdown = selectedDay
    ? getDayBreakdown(state.progress, selectedDay.dayStart, selectedDay.dayEnd, selectedDay.isToday)
    : [];

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

  function handleCalendarClick(i) {
    setSelectedDayIdx(prev => prev === i ? null : i);
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
          ${calendar.map(({ label, count, isToday }, i) => html`
            <div
              class=${'calendar-day' + (isToday ? ' cal-today' : '') + (count > 0 ? ' cal-has' : '') + (selectedDayIdx === i ? ' cal-selected' : '')}
              onClick=${() => handleCalendarClick(i)}
              role="button"
              tabindex="0"
            >
              <span class="cal-label">${label}</span>
              <span class="cal-count">${count > 0 ? count : '·'}</span>
            </div>
          `)}
        </div>

        ${selectedDay && html`
          <div class="cal-breakdown">
            <p class="cal-breakdown-title">${selectedDay.label} · ${selectedDay.count} review${selectedDay.count !== 1 ? 's' : ''}</p>
            ${dayBreakdown.length === 0
              ? html`<p class="cal-breakdown-empty">No reviews due yet.</p>`
              : dayBreakdown.map(({ label, count }) => html`
                <div class="cal-breakdown-row">
                  <span class="cal-breakdown-hour">${label}</span>
                  <span class="cal-breakdown-count">${count} item${count !== 1 ? 's' : ''}</span>
                </div>
              `)
            }
          </div>
        `}
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
