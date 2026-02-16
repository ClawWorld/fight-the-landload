import { identifyCombo } from './combo.js';
import { canBeat } from './compare.js';
import { RANK_VALUE } from './cards.js';

const BLOCKED_SEQ = new Set(['2', 'BJ', 'RJ']);

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

function findStraightPlay(groups, length) {
  const ranks = groups.map(([r]) => r).filter((r) => !BLOCKED_SEQ.has(r));
  for (let i = 0; i <= ranks.length - length; i++) {
    const slice = ranks.slice(i, i + length);
    let ok = true;
    for (let j = 1; j < slice.length; j++) {
      if (RANK_VALUE[slice[j]] !== RANK_VALUE[slice[j - 1]] + 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    return slice.map((rank) => groups.find(([r]) => r === rank)[1][0]);
  }
  return null;
}

function findConsecutivePairsPlay(groups, pairCount) {
  const pairRanks = groups
    .filter(([r, cards]) => cards.length >= 2 && !BLOCKED_SEQ.has(r))
    .map(([r]) => r);

  for (let i = 0; i <= pairRanks.length - pairCount; i++) {
    const slice = pairRanks.slice(i, i + pairCount);
    let ok = true;
    for (let j = 1; j < slice.length; j++) {
      if (RANK_VALUE[slice[j]] !== RANK_VALUE[slice[j - 1]] + 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const play = [];
    for (const rank of slice) {
      const cards = groups.find(([r]) => r === rank)[1];
      play.push(cards[0], cards[1]);
    }
    return play;
  }

  return null;
}

function findAirplaneNoWings(groups, chainLength) {
  const tripleRanks = groups
    .filter(([r, cards]) => cards.length >= 3 && !BLOCKED_SEQ.has(r))
    .map(([r]) => r);

  for (let i = 0; i <= tripleRanks.length - chainLength; i++) {
    const slice = tripleRanks.slice(i, i + chainLength);
    let ok = true;
    for (let j = 1; j < slice.length; j++) {
      if (RANK_VALUE[slice[j]] !== RANK_VALUE[slice[j - 1]] + 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const play = [];
    for (const rank of slice) {
      const cards = groups.find(([r]) => r === rank)[1];
      play.push(cards[0], cards[1], cards[2]);
    }
    return play;
  }

  return null;
}

function buildAirplaneWings(groups, usedTripleRanks, wingType, wingCount) {
  const used = new Set(usedTripleRanks);
  if (wingType === 'single') {
    const singles = [];
    for (const [rank, cards] of groups) {
      if (used.has(rank)) continue;
      for (const c of cards) singles.push(c);
    }
    if (singles.length < wingCount) return null;
    return singles.slice(0, wingCount);
  }

  const pairs = [];
  for (const [rank, cards] of groups) {
    if (used.has(rank)) continue;
    if (cards.length >= 2) pairs.push([cards[0], cards[1]]);
  }
  if (pairs.length < wingCount) return null;
  return pairs.slice(0, wingCount).flat();
}

function findAirplaneWithWings(groups, chainLength, wingType) {
  const tripleRanks = groups
    .filter(([r, cards]) => cards.length >= 3 && !BLOCKED_SEQ.has(r))
    .map(([r]) => r);

  for (let i = 0; i <= tripleRanks.length - chainLength; i++) {
    const chain = tripleRanks.slice(i, i + chainLength);
    let ok = true;
    for (let j = 1; j < chain.length; j++) {
      if (RANK_VALUE[chain[j]] !== RANK_VALUE[chain[j - 1]] + 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const body = [];
    for (const rank of chain) {
      const cards = groups.find(([r]) => r === rank)[1];
      body.push(cards[0], cards[1], cards[2]);
    }

    const wings = buildAirplaneWings(groups, chain, wingType, chainLength);
    if (!wings) continue;

    return [...body, ...wings];
  }

  return null;
}

/**
 * AI v2 (heuristic):
 * - Lead with lowest single.
 * - Respond to simple + some complex combos with smallest valid candidate.
 * - If cannot follow, try bomb/rocket.
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

  if (lastCombo.type === 'STRAIGHT') {
    const play = findStraightPlay(groups, lastCombo.length);
    if (play && canBeat(lastPlayCards, play)) return play;
  }

  if (lastCombo.type === 'CONSECUTIVE_PAIRS') {
    const play = findConsecutivePairsPlay(groups, lastCombo.length / 2);
    if (play && canBeat(lastPlayCards, play)) return play;
  }

  if (lastCombo.type === 'AIRPLANE') {
    const play = findAirplaneNoWings(groups, lastCombo.chainLength || lastCombo.length / 3);
    if (play && canBeat(lastPlayCards, play)) return play;
  }

  if (lastCombo.type === 'AIRPLANE_SINGLE_WINGS') {
    const play = findAirplaneWithWings(groups, lastCombo.chainLength || lastCombo.length / 4, 'single');
    if (play && canBeat(lastPlayCards, play)) return play;
  }

  if (lastCombo.type === 'AIRPLANE_PAIR_WINGS') {
    const play = findAirplaneWithWings(groups, lastCombo.chainLength || lastCombo.length / 5, 'pair');
    if (play && canBeat(lastPlayCards, play)) return play;
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

  for (const play of listBombsAndRocket(hand)) {
    if (canBeat(lastPlayCards, play)) return play;
  }

  return null;
}

export function canRecognize(cards) {
  return !!identifyCombo(cards);
}
