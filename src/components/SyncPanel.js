import { html } from 'https://esm.sh/htm/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import { hashPassphrase, saveSyncConfig, clearSyncConfig } from '../logic/sync.js';

export function SyncPanel({ config, onConfigChange }) {
  const [passphrase,  setPassphrase]  = useState('');
  const [confirming,  setConfirming]  = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');

  async function enable() {
    if (!passphrase.trim()) return;
    setBusy(true);
    setError('');
    try {
      const keyHash = await hashPassphrase(passphrase);
      const cfg = { enabled: true, keyHash, lastSynced: null };
      saveSyncConfig(cfg);
      onConfigChange(cfg);
      setPassphrase('');
    } catch {
      setError('Failed to enable sync.');
    } finally {
      setBusy(false);
    }
  }

  function disable() {
    clearSyncConfig();
    onConfigChange(null);
    setConfirming(false);
  }

  if (config?.enabled) {
    const lastSynced = config.lastSynced
      ? new Date(config.lastSynced).toLocaleString()
      : 'never';

    if (confirming) {
      return html`
        <div class="sync-panel">
          <p class="sync-confirm-text">This will only remove the sync link on this device — cloud data is untouched. Continue?</p>
          <div class="sync-row">
            <button type="button" class="outline secondary" onClick=${() => setConfirming(false)}>Cancel</button>
            <button type="button" class="outline secondary" onClick=${disable}>Yes, disable</button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="sync-panel">
        <p class="sync-status">☁ Cloud sync enabled · last synced: <strong>${lastSynced}</strong></p>
        <button type="button" class="outline secondary sync-disable-btn" onClick=${() => setConfirming(true)}>
          Disable sync
        </button>
      </div>
    `;
  }

  return html`
    <div class="sync-panel">
      <p class="sync-description">
        Choose a sync code — any passphrase you'll remember. Enter the same code on another device to sync your progress.
      </p>
      <div class="sync-row">
        <input
          type="password"
          class="sync-input"
          placeholder="Sync code…"
          value=${passphrase}
          onInput=${e => setPassphrase(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && enable()}
        />
        <button type="button" onClick=${enable} disabled=${busy || !passphrase.trim()}>
          ${busy ? 'Enabling…' : 'Enable'}
        </button>
      </div>
      ${error && html`<p class="sync-error">${error}</p>`}
    </div>
  `;
}
