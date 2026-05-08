import { html } from 'https://esm.sh/htm/preact';
import { useState, useRef } from 'https://esm.sh/preact/hooks';
import { exportJSON, importJSON } from '../store/persistence.js';
import { setState } from '../store/store.js';
import { defaultProgress } from '../store/migrations.js';

export function DataPorter() {
  const [message, setMessage]     = useState('');
  const [isError, setIsError]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef(null);

  function flash(msg, error = false) {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 3500);
  }

  function handleExport() {
    exportJSON();
    flash('Progress exported! 🎉');
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const progress = await importJSON(file);
      setState({ progress });
      flash('Progress restored! ✨');
    } catch (err) {
      flash(`Oops — ${err.message}`, true);
    }
    fileRef.current.value = '';
  }

  function doReset() {
    setState({ progress: defaultProgress() });
    setConfirming(false);
    flash('Progress wiped. Fresh start! 🧹');
  }

  return html`
    <div class="data-porter">
      <button type="button" class="secondary outline porter-card porter-card--export" onClick=${handleExport}>
        <span class="porter-icon">📤</span>
        <span class="porter-label">
          <strong>Export progress</strong>
          <small>Download a backup file</small>
        </span>
      </button>
      <button type="button" class="secondary outline porter-card porter-card--import" onClick=${() => fileRef.current.click()}>
        <span class="porter-icon">📥</span>
        <span class="porter-label">
          <strong>Import progress</strong>
          <small>Restore from a backup</small>
        </span>
      </button>
      <input type="file" accept=".json" ref=${fileRef} onChange=${handleImport} style="display:none" />

      ${!confirming && html`
        <button type="button" class="secondary outline porter-card porter-card--reset" onClick=${() => setConfirming(true)}>
          <span class="porter-icon">🧹</span>
          <span class="porter-label">
            <strong>Reset progress</strong>
            <small>Erase all learning data</small>
          </span>
        </button>
      `}

      ${confirming && html`
        <div class="reset-confirm">
          <p>⚠️ This will permanently erase <strong>all</strong> your progress. No undo!</p>
          <div class="reset-confirm-btns">
            <button type="button" class="secondary outline" onClick=${() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" class="reset-confirm-yes" onClick=${doReset}>
              Yes, wipe everything
            </button>
          </div>
        </div>
      `}

      ${message && html`<p class=${isError ? 'error-msg' : 'success-msg'}>${message}</p>`}
    </div>
  `;
}
