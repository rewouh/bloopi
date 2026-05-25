import { load, save } from './persistence.js';

const listeners = new Set();

const state = {
  currentView: window.location.hash.replace('#', '') || 'home',
  activeSession: null,
  progress: load(),
  loadedDecks: [],
  deckLoadError: null,
};

export function getState() {
  return { ...state };
}

// fromSync: true skips lastModified update so imported/synced timestamps are preserved
export function setState(partial, { fromSync = false } = {}) {
  Object.assign(state, partial);
  if (partial.progress !== undefined) {
    if (!fromSync) {
      state.progress.lastModified = new Date().toISOString();
    }
    save(state.progress);
  }
  const snapshot = { ...state };
  listeners.forEach(fn => fn(snapshot));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
