import { html } from 'https://esm.sh/htm/preact';
import { RankBadge, RANKS } from '../components/RankBadge.js';

const RANK_DETAILS = {
  1: '1 day',
  2: '3 days',
  3: '7 days',
  4: '14 days',
  5: 'never — mastered',
};

export function GuideView() {
  return html`
    <div class="guide-view">
      <h2>How it works</h2>
      <p class="guide-intro">Bloopi uses spaced repetition — items come back right before you'd forget them. The better you know something, the longer it waits before returning.</p>

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
                  <${RankBadge} level=${level} size="md" interactive=${true} />
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
    </div>
  `;
}
