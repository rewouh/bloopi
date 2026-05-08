import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, subscribe } from '../store/store.js';
import { RankBadge, RANKS } from '../components/RankBadge.js';
import { RankItemsModal } from '../components/RankItemsModal.js';

export function StatsView() {
  const [state, setLocalState] = useState(getState());
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => subscribe(setLocalState), []);

  const progressItems = state.progress.items || {};

  // Only count items that still exist in a loaded deck — orphaned entries (removed items) are excluded
  const knownIds = new Set(
    (state.loadedDecks || []).flatMap(d => (d.items || []).map(it => it.id))
  );
  const trackedEntries = Object.entries(progressItems).filter(([id]) => knownIds.has(id));
  const total = trackedEntries.length;

  const levelCounts = [0, 0, 0, 0, 0, 0];
  for (const [, it] of trackedEntries) {
    levelCounts[Math.min(it.level, 5)]++;
  }

  const mastered = levelCounts[5];
  const streak   = state.progress.reviewStreak || 0;

  // Build a flat map of id → { item, deckName } from loaded decks
  const itemMap = {};
  for (const deck of (state.loadedDecks || [])) {
    for (const item of (deck.items || [])) {
      itemMap[item.id] = { item, deckName: deck.name };
    }
  }

  function entriesForLevel(level) {
    return trackedEntries
      .filter(([, p]) => Math.min(p.level, 5) === level)
      .map(([id]) => itemMap[id])
      .filter(Boolean);
  }

  function openLevel(level) {
    if ((levelCounts[level] || 0) === 0) return;
    setSelectedLevel(level);
  }

  return html`
    <div class="stats-view">
      ${selectedLevel !== null && html`
        <${RankItemsModal}
          level=${selectedLevel}
          entries=${entriesForLevel(selectedLevel)}
          onClose=${() => setSelectedLevel(null)}
        />
      `}

      <h2>Your Progress</h2>

      <div class="stats-grid">
        <article class="stat-card">
          <p class="stat-number">${mastered}</p>
          <p class="stat-label">Bloopi ⭐</p>
        </article>
        <article class="stat-card">
          <p class="stat-number">${total}</p>
          <p class="stat-label">In learning</p>
        </article>
        <article class="stat-card">
          <p class="stat-number">${streak}</p>
          <p class="stat-label">Day streak</p>
        </article>
      </div>

      <h3>Ranks</h3>
      <div class="level-breakdown">
        ${[1, 2, 3, 4, 5].map(level => {
          const count = levelCounts[level] || 0;
          return html`
            <div
              key=${level}
              class=${'level-row' + (count > 0 ? ' level-row--clickable' : '')}
              onClick=${() => openLevel(level)}
            >
              <${RankBadge} level=${level} size="md" interactive=${count > 0} />
              <span class="level-label">${RANKS[level].name}</span>
              <div class="level-bar-wrap">
                <div class="level-bar" style=${{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}></div>
              </div>
              <span class="level-count">${count}</span>
            </div>
          `;
        })}
      </div>

      ${total === 0 && html`
        <p class="muted-note">Add a deck from the Decks tab to start learning!</p>
      `}
    </div>
  `;
}
