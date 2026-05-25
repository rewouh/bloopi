import os

decks = sorted(
    f[:-5] for f in os.listdir('.') if f.endswith('.json') and f != 'index.json'
)

with open('index.json', 'w') as f:
    f.write('\n'.join(decks) + '\n')

print(f"Wrote {len(decks)} entries to index.json")
