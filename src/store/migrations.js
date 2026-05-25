export function migrate(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return defaultProgress();
  }

  // v1 used level/streak/failedToday — incompatible with v2 stage system; wipe and start fresh
  if (!rawData.version || rawData.version < 2) {
    const fresh = defaultProgress();
    fresh.welcomed = rawData.welcomed ?? true;
    return fresh;
  }

  const data = { ...rawData };
  if (data.welcomed === undefined) data.welcomed = true;

  return data;
}

export function defaultProgress() {
  return {
    version: 2,
    items: {},
    userNotes: {},
    reviewStreak: 0,
    lastReviewDate: null,
    lastModified: null,
    welcomed: false,
  };
}
