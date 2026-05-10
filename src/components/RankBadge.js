import { html } from 'https://esm.sh/htm/preact';

export const RANKS = {
  1: { name: 'Drip',   img: 'src/images/rank_drip.png'   },
  2: { name: 'Goo',    img: 'src/images/rank_goo.png'    },
  3: { name: 'Blob',   img: 'src/images/rank_blob.png'   },
  4: { name: 'Glob',   img: 'src/images/rank_glob.png'   },
  5: { name: 'Bloopi', img: 'src/images/rank_bloopi.png' },
};

const STAGE_MAP = [
  null,
  { rankLevel: 1, sub: 1 },
  { rankLevel: 1, sub: 2 },
  { rankLevel: 2, sub: 1 },
  { rankLevel: 2, sub: 2 },
  { rankLevel: 3, sub: 1 },
  { rankLevel: 3, sub: 2 },
  { rankLevel: 4, sub: 1 },
  { rankLevel: 4, sub: 2 },
  { rankLevel: 5, sub: null },
];

export function stageInfo(stage) {
  const s = STAGE_MAP[stage];
  if (!s) return null;
  const rank = RANKS[s.rankLevel];
  return { ...s, name: rank.name, img: rank.img, fullName: s.sub ? `${rank.name} ${s.sub}` : rank.name };
}

// Accepts either `stage` (1-9) or `rankLevel` (1-5) for contexts that don't need sub-numbers.
export function RankBadge({ stage, rankLevel, size = 'md', interactive = false }) {
  let info;
  if (stage !== undefined) {
    info = stageInfo(stage);
  } else if (rankLevel !== undefined) {
    const rank = RANKS[rankLevel];
    info = rank ? { name: rank.name, img: rank.img, sub: null, fullName: rank.name } : null;
  }
  if (!info) return null;

  const cls = ['rank-badge', `rank-badge--${size}`, interactive && 'rank-badge--interactive']
    .filter(Boolean).join(' ');

  return html`
    <span class="rank-badge-wrap">
      <img src=${info.img} alt=${info.fullName} title=${info.fullName} class=${cls} />
      ${info.sub && html`<span class="rank-sub-badge">${info.sub}</span>`}
    </span>
  `;
}
