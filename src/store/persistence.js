import { migrate, defaultProgress } from './migrations.js';

const STORAGE_KEY = 'bloopi_progress';

function resetDailyFlags(progress) {
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastResetDate === today) return progress;
  const items = {};
  for (const [id, item] of Object.entries(progress.items || {})) {
    items[id] = { ...item, failedToday: false };
  }
  return { ...progress, items, lastResetDate: today };
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const migrated = migrate(JSON.parse(raw));
    return resetDailyFlags(migrated);
  } catch {
    return defaultProgress();
  }
}

export function save(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function exportJSON() {
  const data = localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultProgress());
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloopi-progress-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed.items !== 'object') throw new Error('Invalid format: missing items');
        const migrated = migrate(parsed);
        save(migrated);
        resolve(migrated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
