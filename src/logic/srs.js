// Intervals in milliseconds for each stage (1-9)
const INTERVALS = {
  1: 4   * 60 * 60 * 1000,   // 4 h
  2: 8   * 60 * 60 * 1000,   // 8 h
  3: 24  * 60 * 60 * 1000,   // 1 day
  4: 48  * 60 * 60 * 1000,   // 2 days
  5: 7   * 24 * 60 * 60 * 1000, // 1 week
  6: 14  * 24 * 60 * 60 * 1000, // 2 weeks
  7: 30  * 24 * 60 * 60 * 1000, // ~1 month
  8: 120 * 24 * 60 * 60 * 1000, // ~4 months
  9: null, // mastered — never reviewed again
};

export function getNextReviewDate(stage) {
  const ms = INTERVALS[stage];
  if (!ms) return null;
  const d = new Date(Date.now() + ms);
  d.setMinutes(0, 0, 0); // floor to top of hour so batches cluster
  return d.toISOString();
}

export function isDue(itemState) {
  if (!itemState?.nextReview) return false;
  if (itemState.stage >= 9) return false;
  return new Date(itemState.nextReview) <= new Date();
}

// Called once, when an item is finally answered correctly in a review.
// incorrectCount: total wrong answers for this item in the session.
// WaniKani rule:
//   - 0 incorrect → stage + 1
//   - ≥1 incorrect → stage - ceil(incorrectCount/2) * penaltyFactor (no +1)
//     penaltyFactor = 2 if stage ≥ 5, else 1; minimum stage = 1
export function processAnswer(itemState, incorrectCount = 0) {
  const state = { ...itemState };
  if (incorrectCount === 0) {
    state.stage = Math.min(state.stage + 1, 9);
  } else {
    const penaltyFactor = state.stage >= 5 ? 2 : 1;
    const adjustment    = Math.ceil(incorrectCount / 2) * penaltyFactor;
    state.stage = Math.max(state.stage - adjustment, 1);
  }
  state.nextReview = getNextReviewDate(state.stage);
  return state;
}

// Returns the initial state for an item right after its lesson is passed.
export function initItemState() {
  return { stage: 1, nextReview: getNextReviewDate(1) };
}
