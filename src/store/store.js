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

export function setState(partial) {
  Object.assign(state, partial);
  if (partial.progress !== undefined) {
    save(partial.progress);
  }
  const snapshot = { ...state };
  listeners.forEach(fn => fn(snapshot));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
