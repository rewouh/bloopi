export function migrate(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return defaultProgress();
  }

  let data = { ...rawData };

  if (!data.version) data.version = 1;
  if (!data.items) data.items = {};
  if (data.reviewStreak === undefined) data.reviewStreak = 0;
  if (data.lastReviewDate === undefined) data.lastReviewDate = null;

  // Future: if (data.version === 1) { ...transforms...; data.version = 2; }

  return data;
}

export function defaultProgress() {
  return {
    version: 1,
    items: {},
    reviewStreak: 0,
    lastReviewDate: null,
    lastResetDate: null,
  };
}
