import { isDue } from './srs.js';

export function getSessionItems(progress, allKnownItems) {
  const lessons = [];
  const reviews = [];

  for (const item of allKnownItems) {
    const state = (progress.items || {})[item.id];
    if (!state) continue;

    if (state.stage === 0 && !state.nextReview) {
      lessons.push(item);
    } else if (state.stage >= 1 && state.stage < 9 && isDue(state)) {
      reviews.push(item);
    }
  }

  return { lessons, reviews };
}
