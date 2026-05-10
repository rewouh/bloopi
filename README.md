# Bloopi

A spaced-repetition app for general knowledge. Items come back right before you'd forget them — the better you know something, the longer it waits before returning.

No build step, no server, no accounts. Just a static page and localStorage.

**Live:** [rewouh.github.io/bloopi](https://rewouh.github.io/bloopi)

---

## Contributing

The best way to contribute is to **add a deck** — and if you do, genuinely: thank you. Every deck makes Bloopi more useful for everyone.

The codebase itself is simple and I manage it directly. If you have a feature idea or a suggestion, reach out and we'll talk — [pbraudcontact@gmail.com](mailto:pbraudcontact@gmail.com).

### How to add a deck

1. Use the **[Deck Builder](https://rewouh.github.io/bloopi-deck-builder)** to build your deck visually and export it as JSON
2. Fork the repository
3. Drop the file in `decks/<your-deck-id>.json`
4. Open a pull request

That's it — no build step, no dependencies to install. Really.

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
| `id` | ✓ | Snake_case, unique across all decks · include a numeric suffix (e.g. `world_geography_01`) |
| `name` | ✓ | Short, title-cased · always end with a two-digit index (e.g. `World Geography 01`) so related decks can be added later |
| `description` | ✓ | One sentence |
| `author` | ✓ | Your GitHub username |
| `language` | ✓ | 2-letter country code: `us`, `fr`, `de`, `jp`… |
| `tags` | ✓ | Lowercase array, pick from existing tags or add new ones |
| `items[].id` | ✓ | Prefix with deck id to avoid collisions (e.g. `geography_01_nile`) |
| `items[].answers` | ✓ | First entry is the displayed answer; add variants for fuzzy matching |
| `items[].mnemonic` | ✓ | Required — this is the core of the learning experience |
| `items[].notes` | — | Optional fun fact, shown after the answer |

### Content rules

- **Keep prompts direct** — "longest river in the world", not "What is the longest river in the world?". No capital at the start, cut the filler.
- **One unambiguous answer** — if multiple answers could work, reframe until only one does.
- **The mnemonic is the whole point** — don't skip it and don't phone it in. A lazy mnemonic is worse than none.

### Size

- **20–50 items is the sweet spot.** Below 20 feels thin. Above 50 becomes a grind for whoever's reviewing.

---

## A note on AI-generated content

AI can be a useful starting point for brainstorming a deck, but don't trust it directly. Common failure modes:

- **Questions are too vague** — multiple valid answers, or the prompt is ambiguous
- **Mnemonics don't hold up** — plausible-sounding but they don't actually help recall
- **Facts are wrong or outdated** — especially for records, statistics, and niche topics

Treat everything AI produces as a rough draft. Triple-check facts, rewrite mnemonics from scratch, make sure each question has exactly one right answer.

---

## Credits

Bloopi was inspired by [WaniKani](https://www.wanikani.com), a Japanese learning app built around mnemonics. Learning kanji with WaniKani made the whole process genuinely fun — the mnemonic-first approach turned what is usually painful memorization into something that actually sticks. I wanted to bring that same experience to general knowledge topics beyond Japanese.

The spaced-repetition algorithm follows [WaniKani's SRS stage system](https://knowledge.wanikani.com/wanikani/srs-stages/) — same interval and demotion rules, adapted to general knowledge with different rank names.

This app does not intend to compete with WaniKani or anyone else. No proprietary content will ever be hosted here.

---

## License

This project is licensed under **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)** (Attribution-NonCommercial).

You can freely share, adapt, and build on anything here — code, decks, or content — as long as you credit the source and don't use it commercially.

By submitting a contribution (deck, fix, or anything else), you agree that your work is released under the same license.

---

## FAQ

**Can I sync my progress across devices?**

Not yet. All data is stored in your browser's localStorage, so it stays on the device you're using. For now, the only way to transfer progress is to export your data from one device and import it on the other — the option is available in the Import / Export section on the home screen. I'm considering options for automatic sync — if I find a convenient, open-source, and free API storage provider, a simple key → data system could work. This may come later on.
