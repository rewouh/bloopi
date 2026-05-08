import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';

export function AnswerInput({ onSubmit }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // Defer focus past the current event cycle — calling focus() synchronously
  // during a keydown handler is silently ignored by browsers.
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);

  function handleSubmit() {
    if (!value.trim()) return;
    onSubmit(value.trim());
  }

  return html`
    <div class="answer-input">
      <input
        ref=${inputRef}
        type="text"
        value=${value}
        onInput=${e => setValue(e.target.value)}
        onKeyDown=${e => e.key === 'Enter' && handleSubmit()}
        placeholder="Type your answer…"
      />
      <button type="button" onClick=${handleSubmit} disabled=${!value.trim()}>
        Check
      </button>
    </div>
  `;
}
