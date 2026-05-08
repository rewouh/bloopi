const LEVEL_CONFIG = {
  1: { successesNeeded: 2, intervalDays: 1 },
  2: { successesNeeded: 2, intervalDays: 3 },
  3: { successesNeeded: 3, intervalDays: 7 },
  4: { successesNeeded: 3, intervalDays: 14 },
  5: { successesNeeded: Infinity, intervalDays: null },
};

export function getNextReviewDate(level) {
  const config = LEVEL_CONFIG[level];
  if (!config || !config.intervalDays) return null;
  const d = new Date();
  d.setDate(d.getDate() + config.intervalDays);
  return d.toISOString().split('T')[0];
}

export function isDueToday(itemState) {
  if (!itemState || !itemState.nextReview) return false;
  if (itemState.level >= 5) return false;
  const today = new Date().toISOString().split('T')[0];
  return itemState.nextReview <= today;
}

export function processAnswer(itemState, correct) {
  const state = { ...itemState };

  if (correct) {
    if (!state.failedToday) {
      state.streak = (state.streak || 0) + 1;
      const config = LEVEL_CONFIG[state.level];
      if (config && state.streak >= config.successesNeeded && state.level < 5) {
        state.level = state.level + 1;
        state.streak = 0;
      }
    }
    state.nextReview = getNextReviewDate(state.level);
  } else {
    state.streak = 0;
    state.failedToday = true;
    state.nextReview = getNextReviewDate(state.level);
  }

  return state;
}
