import { identifyCombo } from './combo.js';
import { canBeat } from './compare.js';
import { RANK_VALUE } from './cards.js';

function byRankAsc(a, b) {
  return RANK_VALUE[a.rank] - RANK_VALUE[b.rank];
}

function groupByRank(hand) {
  const map = new Map();
  for (const c of hand) {
    const arr = map.get(c.rank) || [];
    arr.push(c);
    map.set(c.rank, arr);
  }
  return [...map.entries()].sort((a, b) => RANK_VALUE[a[0]] - RANK_VALUE[b[0]]);
}

function listBombsAndRocket(hand) {
  const groups = groupByRank(hand);
  const bombs = groups.filter(([, cards]) => cards.length >= 4).map(([, cards]) => cards.slice(0, 4));

  const bj = hand.find((c) => c.rank === 'BJ');
  const rj = hand.find((c) => c.rank === 'RJ');
  const rocket = bj && rj ? [[bj, rj]] : [];

  return [...bombs, ...rocket];
}

/**
 * AI v1 (heuristic):
 * - Lead with lowest single.
 * - Respond to SIMPLE combos (single/pair/triple/bomb/rocket) with the smallest winning play.
 * - If cannot follow type, try bomb/rocket.
 */
export function choosePlay({ hand, lastPlayCards }) {
  const sorted = [...hand].sort(byRankAsc);
  if (!sorted.length) return null;

  if (!lastPlayCards) return [sorted[0]];

  const lastCombo = identifyCombo(lastPlayCards);
  if (!lastCombo) return null;

  const groups = groupByRank(sorted);

  if (lastCombo.type === 'SINGLE') {
    for (const c of sorted) if (canBeat(lastPlayCards, [c])) return [c];
  }

  if (lastCombo.type === 'PAIR') {
    for (const [, cards] of groups) {
      if (cards.length >= 2) {
        const play = cards.slice(0, 2);
        if (canBeat(lastPlayCards, play)) return play;
      }
    }
  }

  if (lastCombo.type === 'TRIPLE') {
    for (const [, cards] of groups) {
      if (cards.length >= 3) {
        const play = cards.slice(0, 3);
        if (canBeat(lastPlayCards, play)) return play;
      }
    }
  }

  if (lastCombo.type === 'BOMB') {
    for (const [, cards] of groups) {
      if (cards.length >= 4) {
        const play = cards.slice(0, 4);
        if (canBeat(lastPlayCards, play)) return play;
      }
    }
    const rocket = listBombsAndRocket(hand).find((p) => identifyCombo(p)?.type === 'ROCKET');
    if (rocket && canBeat(lastPlayCards, rocket)) return rocket;
    return null;
  }

  // try power override when normal follow failed
  for (const play of listBombsAndRocket(hand)) {
    if (canBeat(lastPlayCards, play)) return play;
  }

  return null;
}

export function canRecognize(cards) {
  return !!identifyCombo(cards);
}
