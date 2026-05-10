import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef, useMemo } from 'https://esm.sh/preact/hooks';

export function FilterDropdown({ label, options, value, onChange, defaultMax = 0 }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    if (inputRef.current) inputRef.current.focus();
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Random subset computed once per options reference (i.e. on initial deck load)
  const baseList = useMemo(() => {
    if (!defaultMax || options.length <= defaultMax) return options;
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, defaultMax);
  }, [options]);

  const q = search.trim().toLowerCase();
  const displayed = useMemo(() => {
    if (!q) return baseList;
    return options.filter(o =>
      o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
    );
  }, [q, baseList, options]);

  const selected = value ? options.find(o => o.id === value) : null;

  return html`
    <div class="filter-dropdown" ref=${wrapRef}>
      <button
        type="button"
        class=${'filter-pill' + (value ? ' filter-pill--active' : '')}
        onClick=${() => setOpen(o => !o)}
      >
        ${selected
          ? html`${selected.icon && html`<span class="fdd-icon">${selected.icon}</span>`}${selected.label}`
          : label}<span class="fdd-caret">${open ? '▴' : '▾'}</span>
      </button>
      ${open && html`
        <div class="filter-dropdown-panel">
          <input
            ref=${inputRef}
            class="filter-dropdown-search"
            type="text"
            placeholder="Search…"
            value=${search}
            onInput=${e => setSearch(e.target.value)}
          />
          <ul class="fdd-list">
            ${value && html`
              <li class="fdd-option fdd-clear" onClick=${() => { onChange(null); setOpen(false); }}>
                ✕ Clear
              </li>
            `}
            ${displayed.map(o => html`
              <li
                key=${o.id}
                class=${'fdd-option' + (o.id === value ? ' fdd-option--active' : '')}
                onClick=${() => { onChange(o.id === value ? null : o.id); setOpen(false); }}
              >
                ${o.icon && html`<span class="fdd-icon">${o.icon}</span>`}
                ${o.label}
              </li>
            `)}
            ${displayed.length === 0 && html`<li class="fdd-empty">No results</li>`}
            ${!q && defaultMax > 0 && options.length > defaultMax && html`
              <li class="fdd-hint">+${options.length - defaultMax} more — search to find</li>
            `}
          </ul>
        </div>
      `}
    </div>
  `;
}
