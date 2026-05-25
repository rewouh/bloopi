import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, setState, subscribe } from '../store/store.js';
import { getSessionItems } from '../logic/scheduler.js';
import { DataPorter } from '../components/DataPorter.js';
import { SyncPanel } from '../components/SyncPanel.js';
import { getSyncConfig, saveSyncConfig, fetchRemote, pushToRemote } from '../logic/sync.js';

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${String(m).padStart(2, '0')}m`;
  }
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function NextReviewTimer({ progress }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const next = Object.values(progress.items || {})
    .filter(it => it.nextReview && it.stage >= 1 && it.stage < 9)
    .map(it => new Date(it.nextReview).getTime())
    .filter(t => t > now)
    .sort((a, b) => a - b)[0];

  if (!next) return null;
  const label = formatCountdown(next - now);
  if (!label) return null;
  return html`<span class="next-review-timer">${label}</span>`;
}

function buildCalendar(progress) {
  const items = Object.values(progress.items || {});
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const label = i === 0 ? 'Today' : dayStart.toLocaleDateString('en', { weekday: 'short' });

    const count = items.filter(it => {
      if (!it.nextReview || it.stage < 1 || it.stage >= 9) return false;
      const nr = new Date(it.nextReview);
      return i === 0 ? nr < dayEnd : nr >= dayStart && nr < dayEnd;
    }).length;

    return { label, count, isToday: i === 0, dayStart, dayEnd };
  });
}

function getDayBreakdown(progress, dayStart, dayEnd, isToday) {
  const now = new Date();
  let overdueCount = 0;
  const byHour = {};

  for (const it of Object.values(progress.items || {})) {
    if (!it.nextReview || it.stage < 1 || it.stage >= 9) continue;
    const nr = new Date(it.nextReview);
    if (nr >= dayEnd) continue;

    if (isToday) {
      if (nr < dayStart) { overdueCount++; continue; }
      if (nr <= now) { overdueCount++; continue; }
      const h = nr.getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    } else {
      if (nr < dayStart) continue;
      const h = nr.getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    }
  }

  const result = overdueCount > 0 ? [{ label: 'Due now', count: overdueCount }] : [];
  return result.concat(
    Object.entries(byHour)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([h, count]) => ({ label: `${String(h).padStart(2, '0')}:00`, count }))
  );
}

function formatDate(iso) {
  if (!iso) return 'unknown date';
  return new Date(iso).toLocaleString();
}

export function HomeView() {
  const [state,        setLocalState]  = useState(getState());
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);
  const [,             setTick]        = useState(0);
  const [syncConfig,   setSyncConfig]  = useState(() => getSyncConfig());
  const [syncing,      setSyncing]     = useState(false);
  const [syncMsg,      setSyncMsg]     = useState(null); // { type: 'ok'|'error', text }
  const [conflict,     setConflict]    = useState(null); // { remote }

  useEffect(() => subscribe(setLocalState), []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

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
    document.activeElement?.blur();
    setState({ activeSession: { type: 'review', items: shuffle(reviews), id: Date.now() } });
  }

  function startLessons() {
    document.activeElement?.blur();
    setState({ activeSession: { type: 'lesson', items: shuffle(lessons).slice(0, LESSON_BATCH), id: Date.now() } });
  }

  function handleCalendarClick(i) {
    setSelectedDayIdx(prev => prev === i ? null : i);
  }

  async function handleSync() {
    if (!syncConfig?.enabled) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const remote = await fetchRemote(syncConfig.keyHash);
      const local  = getState().progress;

      if (!remote) {
        // Nothing in the cloud yet — push local
        await pushToRemote(syncConfig.keyHash, local);
        const updated = { ...syncConfig, lastSynced: new Date().toISOString() };
        saveSyncConfig(updated);
        setSyncConfig(updated);
        setSyncMsg({ type: 'ok', text: 'Saved to cloud.' });
        return;
      }

      const localEmpty  = !local.lastModified && Object.keys(local.items || {}).length === 0;
      const remoteNewer = remote.lastModified && (!local.lastModified || remote.lastModified > local.lastModified);

      if (localEmpty || remoteNewer) {
        // Ask the user what to do — unless local is completely empty (auto-pull)
        if (localEmpty) {
          applyRemote(remote);
        } else {
          setConflict({ remote });
        }
        return;
      }

      // Local is newer — push
      await pushToRemote(syncConfig.keyHash, local);
      const updated = { ...syncConfig, lastSynced: new Date().toISOString() };
      saveSyncConfig(updated);
      setSyncConfig(updated);
      setSyncMsg({ type: 'ok', text: 'Cloud updated.' });
    } catch (err) {
      setSyncMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  }

  async function applyRemote(remote) {
    setSyncing(true);
    try {
      setState({ progress: remote }, { fromSync: true });
      const updated = { ...syncConfig, lastSynced: new Date().toISOString() };
      saveSyncConfig(updated);
      setSyncConfig(updated);
      setSyncMsg({ type: 'ok', text: 'Progress loaded from cloud.' });
    } finally {
      setConflict(null);
      setSyncing(false);
    }
  }

  async function keepLocal() {
    setSyncing(true);
    try {
      const local = getState().progress;
      await pushToRemote(syncConfig.keyHash, local);
      const updated = { ...syncConfig, lastSynced: new Date().toISOString() };
      saveSyncConfig(updated);
      setSyncConfig(updated);
      setSyncMsg({ type: 'ok', text: 'Local data kept and saved to cloud.' });
    } catch (err) {
      setSyncMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setConflict(null);
      setSyncing(false);
    }
  }

  return html`
    <div class="home-view">
      ${conflict && html`
        <div class="sync-conflict-backdrop">
          <div class="sync-conflict-modal">
            <h3>☁ Cloud has newer data</h3>
            <p>Cloud saved: <strong>${formatDate(conflict.remote.lastModified)}</strong></p>
            <p>Local saved: <strong>${formatDate(getState().progress.lastModified)}</strong></p>
            <p class="sync-conflict-hint">Which version do you want to keep?</p>
            <div class="sync-conflict-actions">
              <button type="button" class="outline secondary" onClick=${keepLocal}>Keep local</button>
              <button type="button" onClick=${() => applyRemote(conflict.remote)}>Use cloud</button>
            </div>
          </div>
        </div>
      `}

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

      ${syncConfig?.enabled && html`
        <div class="sync-bar">
          <button
            type="button"
            class="outline secondary sync-btn"
            onClick=${handleSync}
            disabled=${syncing}
          >
            ${syncing ? '⟳ Syncing…' : '☁ Sync'}
          </button>
          ${syncMsg && html`
            <span class="sync-msg sync-msg--${syncMsg.type}">${syncMsg.text}</span>
          `}
        </div>
      `}

      <div class="calendar-section">
        <div class="calendar-header">
          <p class="calendar-title">Upcoming reviews</p>
          <${NextReviewTimer} progress=${state.progress} />
        </div>
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
        <summary>💾 Import / Export / Sync</summary>
        <${DataPorter} />
        <hr class="porter-divider" />
        <${SyncPanel}
          config=${syncConfig}
          onConfigChange=${cfg => { setSyncConfig(cfg); setSyncMsg(null); }}
        />
      </details>
    </div>
  `;
}
