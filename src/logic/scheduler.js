import { isDueToday } from './srs.js';

export function getSessionItems(progress, allKnownItems) {
  const lessons = [];
  const reviews = [];

  for (const item of allKnownItems) {
    const state = (progress.items || {})[item.id];
    if (!state) continue;

    if (state.level === 0 && !state.nextReview) {
      lessons.push(item);
    } else if (state.level >= 1 && state.level < 5 && isDueToday(state)) {
      reviews.push(item);
    }
  }

  return { lessons, reviews };
}
