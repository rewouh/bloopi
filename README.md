# Bloopi

A spaced-repetition app for general knowledge. Items come back right before you'd forget them — the better you know something, the longer it waits before returning.

No build step, no server, no accounts. Just a static page and localStorage.

**Live:** [rewouh.github.io/bloopi](https://rewouh.github.io/bloopi)

---

## Contributing

The best way to contribute is to **add a deck**. The codebase itself is simple and I manage it directly — if you have a feature idea or a suggestion, reach out and we'll talk about it together rather than opening a PR for it. For anything code-related, contact me at [pbraudcontact@gmail.com](mailto:pbraudcontact@gmail.com).

### How to add a deck

1. Fork the repository
2. Create `decks/<your-deck-id>.json` following the format below
3. Open a pull request

That's it — no build step, no dependencies to install.

---

## Deck format

```json
{
  "id": "your_deck_id",
  "name": "Deck Name",
  "description": "One sentence about what this deck covers.",
  "author": "your-github-username",
  "language": "us",
  "tags": ["tag1", "tag2"],
  "items": [
    {
      "id": "your_deck_id_short_slug",
      "title": "the question or prompt",
      "answers": ["main answer", "accepted variant"],
      "mnemonic": "A memory trick that makes the answer stick.",
      "notes": "Optional fun fact shown after answering."
    }
  ]
}
```

### Field notes

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | Snake_case, unique across all decks |
| `name` | ✓ | Short, title-cased |
| `description` | ✓ | One sentence |
| `author` | ✓ | Your GitHub username |
| `language` | ✓ | 2-letter country code: `us`, `fr`, `de`, `jp`… |
| `tags` | ✓ | Lowercase array, pick from existing tags or add new ones |
| `items[].id` | ✓ | Prefix with deck id to avoid collisions (e.g. `geography_01_nile`) |
| `items[].answers` | ✓ | First entry is the displayed answer; add variants for fuzzy matching |
| `items[].mnemonic` | ✓ | Required — this is the core of the learning experience |
| `items[].notes` | — | Optional fun fact, shown after the answer |

### Size

- **Minimum 20 items**, maximum ~40–50.
- Below 20 the deck feels thin. Above 50 it becomes a grind.

---

## A note on AI-generated content

AI tools can help brainstorm a deck structure, but they are not reliable enough to use directly. Common problems:

- **Questions are too vague** — multiple valid answers exist, or the prompt is ambiguous
- **Mnemonics don't hold up** — they sound plausible but don't actually help recall
- **Facts are wrong or outdated** — especially for records, statistics, and niche topics

If you use AI as a starting point, treat everything it produces as a first draft. Triple-check facts against primary sources, rewrite every mnemonic from scratch if needed, and make sure each question has one clear correct answer. A deck that ships with bad mnemonics or wrong answers is worse than no deck at all.

---

## License

This project is licensed under **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)** (Attribution-NonCommercial).

You can freely share, adapt, and build on anything here — code, decks, or content — as long as you credit the source and don't use it commercially.

By submitting a contribution (deck, fix, or anything else), you agree that your work is released under the same license.

---

## Local setup

Serve the project over HTTP — `fetch()` for deck JSON breaks on `file://`.

```bash
python -m http.server
# then open http://localhost:8000
```
