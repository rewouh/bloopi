// Fill this in after deploying the Cloudflare Worker
const WORKER_URL = 'https://bloopi-sync.pierrebraud254.workers.dev';

const CONFIG_KEY = 'bloopi_sync';

export function getSyncConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; }
}

export function saveSyncConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearSyncConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

export async function hashPassphrase(passphrase) {
  const buf  = new TextEncoder().encode(passphrase.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchRemote(keyHash) {
  const r = await fetch(WORKER_URL, {
    headers: { Authorization: `Bearer ${keyHash}` },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Server error ${r.status}`);
  return r.json();
}

export async function pushToRemote(keyHash, progress) {
  const r = await fetch(WORKER_URL, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${keyHash}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  });
  if (!r.ok) throw new Error(`Server error ${r.status}`);
}
