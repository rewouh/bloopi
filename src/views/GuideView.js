import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { getState, subscribe } from '../store/store.js';
import { RankBadge, RANKS } from '../components/RankBadge.js';

const RANK_DETAILS = {
  1: '4 h → 8 h',
  2: '1 day → 2 days',
  3: '1 week → 2 weeks',
  4: '~1 month → ~4 months',
  5: 'never — mastered',
};

function buildContributors(loadedDecks) {
  const map = {};
  for (const deck of (loadedDecks || [])) {
    if (!deck.author) continue;
    if (!map[deck.author]) map[deck.author] = { decks: 0, cards: 0 };
    map[deck.author].decks += 1;
    map[deck.author].cards += (deck.items || []).length;
  }
  return Object.entries(map)
    .map(([username, { decks, cards }]) => ({ username, decks, cards }))
    .sort((a, b) => b.cards - a.cards || b.decks - a.decks);
}

export function GuideView() {
  const [state, setLocalState] = useState(getState());
  useEffect(() => subscribe(setLocalState), []);

  const contributors = buildContributors(state.loadedDecks);

  return html`
    <div class="guide-view">
      <h2>How it works</h2>
      <p class="guide-intro">Bloopi uses a proven spaced-repetition algorithm. Items come back right before you'd forget them — the better you know something, the longer it waits before returning.</p>

      <div class="guide-sections">
        <section class="guide-section">
          <div>
            <h3>Lessons</h3>
            <p>New items start here. Study the hint, then get tested. Wrong answers loop back until you nail it.</p>
          </div>
        </section>

        <section class="guide-section">
          <div>
            <h3>Reviews</h3>
            <p>Learned items return at increasing intervals. Miss one and it re-queues at the end of the session.</p>
          </div>
        </section>

        <section class="guide-section guide-section--full">
          <div style="width:100%">
            <h3>Ranks</h3>
            <div class="rank-ladder">
              ${[1, 2, 3, 4, 5].map(level => html`
                <div key=${level} class=${'rank-ladder-row rank-ladder-row--' + level}>
                  <${RankBadge} rankLevel=${level} size="md" interactive=${true} />
                  <div class="rank-ladder-info">
                    <strong>${RANKS[level].name}</strong>
                    <span>Review every ${RANK_DETAILS[level]}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
        </section>

        <section class="guide-section">
          <div>
            <h3>Shortcuts</h3>
            <ul class="guide-shortcuts">
              <li><kbd>Enter</kbd> <span>Start answering / advance past feedback</span></li>
              <li><kbd>Esc</kbd> <span>Close any overlay</span></li>
            </ul>
          </div>
        </section>
      </div>

      <section class="guide-contributing">
        <h3>Add a deck</h3>
        <p>Got a topic you know well? Build a deck — it takes a few minutes with the <a href="https://rewouh.github.io/bloopi-deck-builder" target="_blank" rel="noopener noreferrer">Deck Builder</a> and helps everyone who uses Bloopi. Drop the exported file in the <a href="https://github.com/rewouh/bloopi" target="_blank" rel="noopener noreferrer">repository</a> and open a pull request. Seriously, thank you.</p>
        <p class="guide-contributing-alt">Not on GitHub? No problem — paste your content on <a href="https://pastebin.com" target="_blank" rel="noopener noreferrer">Pastebin</a> and <a href="mailto:pbraudcontact@gmail.com">send the link</a>. Questions with mnemonics, format is flexible, I'll take it from there.</p>
      </section>

      ${contributors.length > 0 && html`
        <section class="guide-contributors">
          <h3>Contributors</h3>
          <ul class="contributors-list">
            ${contributors.map(({ username, decks, cards }) => html`
              <li key=${username} class="contributor-row">
                <a
                  href=${'https://github.com/' + username}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="contributor-name"
                >@${username}</a>
                <span class="contributor-stats">${cards} card${cards !== 1 ? 's' : ''} · ${decks} deck${decks !== 1 ? 's' : ''}</span>
              </li>
            `)}
          </ul>
        </section>
      `}
    </div>
  `;
}
