import { html } from 'https://esm.sh/htm/preact';

export const RANKS = {
  1: { name: 'Drip',   img: 'src/images/rank_drip.png'   },
  2: { name: 'Goo',    img: 'src/images/rank_goo.png'    },
  3: { name: 'Blob',   img: 'src/images/rank_blob.png'   },
  4: { name: 'Glob',   img: 'src/images/rank_glob.png'   },
  5: { name: 'Bloopi', img: 'src/images/rank_bloopi.png' },
};

export function RankBadge({ level, size = 'md', interactive = false }) {
  const rank = RANKS[level];
  if (!rank) return null;
  const cls = ['rank-badge', `rank-badge--${size}`, interactive && 'rank-badge--interactive']
    .filter(Boolean).join(' ');
  return html`
    <img src=${rank.img} alt=${rank.name} title=${rank.name} class=${cls} />
  `;
}
