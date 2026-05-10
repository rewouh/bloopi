# Bloopi — project context for Claude

## What it is
Spaced-repetition general-knowledge web app. Fully static SPA — no build step, no server, hostable on GitHub Pages. All persistence is localStorage. Open `index.html` over HTTP (fetch() breaks on `file://`).

## Tech stack (all CDN, no bundler)
- **Preact + HTM** — `https://esm.sh/preact`, `https://esm.sh/preact/hooks`, `https://esm.sh/htm/preact`
- **Pico CSS v2** — `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`
- **Fuse.js v7** — `https://esm.sh/fuse.js@7` (fuzzy answer matching)
- **Nunito font** — Google Fonts, loaded in `index.html`
- No TypeScript, no JSX — use HTM tagged template literals (`html\`...\``)

## File structure
```
index.html
decks/
  geography.json      ← 8 world geography items
  history.json        ← 8 world history items
src/
  app.js              ← entry point: mounts App, hash routing, loads decks
  components/
    AnswerInput.js       ← text input + submit; only rendered during typing, hidden during feedback
    CardItem.js          ← question display with reveal state
    DeckCard.js          ← card with gradient header, progress bar, add + browse buttons
    DeckPreviewModal.js  ← overlay to browse all items in a deck; tap-to-reveal per item
    DataPorter.js        ← export/import/reset buttons with inline confirmation for reset
    MnemonicHint.js      ← styled blockquote (purple) for memory tricks
    NotesBlock.js        ← styled aside (amber) for optional fun-fact notes; renders nothing if text is absent
    ProgressBar.js       ← wraps <progress value max="1">
  views/
    HomeView.js       ← "Bloopi" title, today-cards, session buttons, 7-day calendar, porter details
    DecksView.js      ← deck grid with search bar + filter pills (All/New/Learning/Bloopi)
    LessonView.js     ← fullscreen overlay: intro→answer→feedback flow
    ReviewView.js     ← fullscreen overlay: question→feedback flow, re-queues failed items
    StatsView.js      ← mastered/total/streak stats + per-level bar breakdown
  logic/
    srs.js            ← PURE functions only: processAnswer, isDueToday, getNextReviewDate
    scheduler.js      ← getSessionItems(progress, allKnownItems) → {lessons, reviews}
    fuzzy.js          ← checkAnswer(userInput, acceptedAnswers) → {correct} via Fuse.js
    deck-loader.js    ← loadAllDecks() fetches decks/geography.json + decks/history.json
  store/
    store.js          ← lightweight pub/sub; getState/setState/subscribe; auto-saves on progress change
    persistence.js    ← load/save/exportJSON/importJSON; resets failedToday flags daily on load
    migrations.js     ← migrate(rawData), defaultProgress(); version field ready for future changes
  style/
    app.css           ← Pico overrides + all custom styles (~220 lines)
```

## Deck JSON format
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "items": [
    { "id": "geo-01", "title": "question", "answers": ["answer", "variant"], "mnemonic": "memory trick", "notes": "optional fun fact shown during feedback" }
  // top-level deck fields also include: "author": "Name" (optional, shown on card and in preview)
  ]
}
```
To add a deck: create `decks/<id>.json` — discovery is automatic (GitHub API on Pages, directory listing locally).
To remove a deck: delete the file.

## localStorage schema (`bloopi_progress`)
```json
{
  "version": 1,
  "reviewStreak": 3,
  "lastReviewDate": "2026-05-08",
  "lastResetDate": "2026-05-08",
  "items": {
    "<item-id>": { "level": 0, "streak": 0, "nextReview": null, "failedToday": false }
  }
}
```

## SRS algorithm (`logic/srs.js`)
5 levels. Level 0 = lesson queue (never reviewed). Level 5 = mastered, never reviewed again.

| Level | Name   | Successes to level up | Review interval |
|-------|--------|-----------------------|-----------------|
| 1     | Drip   | 2 consecutive        | 1 day           |
| 2     | Goo    | 2 consecutive        | 3 days          |
| 3     | Blob   | 3 consecutive        | 7 days          |
| 4     | Glob   | 3 consecutive        | 14 days         |
| 5     | Bloopi | mastered             | never           |

**Key rules:**
- Failure resets `streak` to 0 but never demotes `level`; sets `failedToday = true`
- If `failedToday`, correct answers don't increment streak (no level-up today)
- `failedToday` resets on first load of a new day (in `persistence.load()`)
- Lesson pass → level 0→1, `nextReview = today` (special-cased in LessonView, not via `processAnswer`)

## Session flows

**LessonView** phases: `intro` → `answer` → `feedback` → (next item or `summary`)
- Intro shows the mnemonic so user can study before being tested
- Wrong answer: shows mnemonic again, loops back to intro (item not advanced)
- Enter key advances from feedback phase (via `useEffect` + `useRef` pattern)
- AnswerInput is only mounted during `answer` phase — removed during feedback

**ReviewView** phases: `question` → `feedback` → (next item or `summary`)
- Failed items are appended to the end of the queue array
- Counter uses `session.items.length` (fixed original total) as denominator with `Math.min` cap — prevents `9/8` overflow when items re-queue
- Enter key advances from feedback phase (same pattern as LessonView)
- Streak updated on session complete (Done button), not on exit

## Store pattern
```js
// All components subscribe like this:
const [state, setLocalState] = useState(getState());
useEffect(() => subscribe(setLocalState), []);
// Then read from `state.xxx`
```
`setState(partial)` merges into global state, notifies all subscribers, and auto-saves to localStorage if `partial.progress` is present.

## Routing
Hash-based. `#home`, `#decks`, `#stats`. Session overlays (lesson/review) are NOT routes — they render as `position:fixed` overlays when `activeSession` is set in the store.

## CSS conventions (`src/style/app.css`)
- Pico's primary color overridden to purple (`#8b5cf6`), border-radius `1.25rem`
- All buttons are pill-shaped (`border-radius: 50em !important`)
- Spring easing: `--spring: cubic-bezier(.34,1.56,.64,1)` used throughout
- Primary buttons get a 3D bottom-shadow (`0 5px 0 #6d28d9`) that collapses on `:active`
- `transition` on the BASE `button` rule (not `:hover`) — required for mouse-out to animate
- Pastel tints use low-opacity RGBA (`rgba(139,92,246,.14)`) so they adapt to dark mode automatically
- `.filter-pill` and `.porter-card` are explicitly excluded from the primary 3D-shadow rule
- Level bar colors by nth-child: cyan(1) → lime(2) → amber(3) → pink(4) → purple(5)

## Key gotchas
- **Fuse.js CDN**: must use `https://esm.sh/fuse.js@7` — the jsDelivr ESM path 404s
- **Porter cards**: need `class="secondary outline porter-card porter-card--X"` — the `secondary outline` Pico base prevents Pico from fighting the custom background
- **Button transitions**: transition must be on base `button` rule, not only on `:hover`, or mouse-out snaps
- **file:// protocol**: `fetch()` for deck JSON fails in Chrome on file://; serve with `python -m http.server`
- **Deck lookup in sessions**: `getState().loadedDecks.find(d => d.items.some(it => it.id === item.id))?.name` — called at render time, fast enough for current scale
