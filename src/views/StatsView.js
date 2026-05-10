import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, subscribe } from '../store/store.js';
import { RankBadge, RANKS } from '../components/RankBadge.js';
import { RankItemsModal } from '../components/RankItemsModal.js';

// rankLevel 1-5 → which stages belong to it
function stagesToRankLevel(stage) {
  if (stage <= 0) return 0;
  if (stage >= 9) return 5;
  return Math.ceil(stage / 2);
}

export function StatsView() {
  const [state, setLocalState] = useState(getState());
  const [selectedRank, setSelectedRank] = useState(null);

  useEffect(() => subscribe(setLocalState), []);

  const progressItems = state.progress.items || {};

  const knownIds = new Set(
    (state.loadedDecks || []).flatMap(d => (d.items || []).map(it => it.id))
  );
  const trackedEntries = Object.entries(progressItems).filter(([id]) => knownIds.has(id));
  const total = trackedEntries.length;

  // Count items per rank level (1-5); stage 0 items are unlearned (not shown in rank ladder)
  const rankCounts = [0, 0, 0, 0, 0, 0]; // index 0 unused, 1-5 are ranks
  for (const [, it] of trackedEntries) {
    const r = stagesToRankLevel(it.stage || 0);
    if (r >= 1) rankCounts[r]++;
  }

  const mastered = rankCounts[5];
  const streak   = state.progress.reviewStreak || 0;

  const itemMap = {};
  for (const deck of (state.loadedDecks || [])) {
    for (const item of (deck.items || [])) {
      itemMap[item.id] = { item, deckName: deck.name };
    }
  }

  function entriesForRank(rankLevel) {
    return trackedEntries
      .filter(([, p]) => stagesToRankLevel(p.stage || 0) === rankLevel)
      .map(([id]) => itemMap[id])
      .filter(Boolean);
  }

  function openRank(rankLevel) {
    if ((rankCounts[rankLevel] || 0) === 0) return;
    setSelectedRank(rankLevel);
  }

  // Items in ranks (stages 1-9) for bar percentage denominator
  const inRanks = rankCounts.reduce((s, c) => s + c, 0);

  return html`
    <div class="stats-view">
      ${selectedRank !== null && html`
        <${RankItemsModal}
          level=${selectedRank}
          entries=${entriesForRank(selectedRank)}
          onClose=${() => setSelectedRank(null)}
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
        ${[1, 2, 3, 4, 5].map(rankLevel => {
          const count = rankCounts[rankLevel] || 0;
          return html`
            <div
              key=${rankLevel}
              class=${'level-row' + (count > 0 ? ' level-row--clickable' : '')}
              onClick=${() => openRank(rankLevel)}
            >
              <${RankBadge} rankLevel=${rankLevel} size="md" interactive=${count > 0} />
              <span class="level-label">${RANKS[rankLevel].name}</span>
              <div class="level-bar-wrap">
                <div class="level-bar" style=${{ width: inRanks > 0 ? `${(count / inRanks) * 100}%` : '0%' }}></div>
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
