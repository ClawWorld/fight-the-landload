import { RANK_VALUE, countRanks, sortRanksAsc } from './cards.js';

function isStraightRanks(ranks) {
  if (ranks.length < 5) return false;
  if (ranks.some((r) => ['2', 'BJ', 'RJ'].includes(r))) return false;
  const sorted = sortRanksAsc(ranks);
  for (let i = 1; i < sorted.length; i++) {
    if (RANK_VALUE[sorted[i]] !== RANK_VALUE[sorted[i - 1]] + 1) return false;
  }
  return true;
}

function repeatedRanks(countMap, targetCount) {
  return [...countMap.entries()]
    .filter(([, c]) => c === targetCount)
    .map(([r]) => r)
    .sort((a, b) => RANK_VALUE[a] - RANK_VALUE[b]);
}

export function identifyCombo(cards) {
  if (!cards?.length) return null;

  const n = cards.length;
  const counts = countRanks(cards);
  const uniqueRanks = [...counts.keys()];
  const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || RANK_VALUE[b[0]] - RANK_VALUE[a[0]]);

  if (n === 2 && counts.has('BJ') && counts.has('RJ')) {
    return { type: 'ROCKET', length: 2, mainRank: 'RJ' };
  }

  if (n === 1) return { type: 'SINGLE', length: 1, mainRank: uniqueRanks[0] };
  if (n === 2 && byCount[0][1] === 2) return { type: 'PAIR', length: 2, mainRank: byCount[0][0] };
  if (n === 3 && byCount[0][1] === 3) return { type: 'TRIPLE', length: 3, mainRank: byCount[0][0] };

  if (n === 4) {
    if (byCount[0][1] === 4) return { type: 'BOMB', length: 4, mainRank: byCount[0][0] };
    if (byCount[0][1] === 3) return { type: 'TRIPLE_SINGLE', length: 4, mainRank: byCount[0][0] };
  }

  if (n === 5) {
    if (byCount[0][1] === 3 && byCount[1][1] === 2) {
      return { type: 'TRIPLE_PAIR', length: 5, mainRank: byCount[0][0] };
    }
    if (uniqueRanks.length === 5 && isStraightRanks(uniqueRanks)) {
      return { type: 'STRAIGHT', length: 5, mainRank: sortRanksAsc(uniqueRanks).at(-1) };
    }
  }

  if (uniqueRanks.length === n && isStraightRanks(uniqueRanks)) {
    return { type: 'STRAIGHT', length: n, mainRank: sortRanksAsc(uniqueRanks).at(-1) };
  }

  // Consecutive pairs (e.g. 334455)
  if (n >= 6 && n % 2 === 0 && repeatedRanks(counts, 2).length === n / 2) {
    const pairs = repeatedRanks(counts, 2);
    if (!pairs.some((r) => ['2', 'BJ', 'RJ'].includes(r))) {
      let ok = true;
      for (let i = 1; i < pairs.length; i++) {
        if (RANK_VALUE[pairs[i]] !== RANK_VALUE[pairs[i - 1]] + 1) {
          ok = false;
          break;
        }
      }
      if (ok) return { type: 'CONSECUTIVE_PAIRS', length: n, mainRank: pairs.at(-1) };
    }
  }

  // Airplane without wings (e.g. 333444)
  if (n >= 6 && n % 3 === 0 && repeatedRanks(counts, 3).length === n / 3) {
    const triples = repeatedRanks(counts, 3);
    if (!triples.some((r) => ['2', 'BJ', 'RJ'].includes(r))) {
      let ok = true;
      for (let i = 1; i < triples.length; i++) {
        if (RANK_VALUE[triples[i]] !== RANK_VALUE[triples[i - 1]] + 1) {
          ok = false;
          break;
        }
      }
      if (ok) return { type: 'AIRPLANE', length: n, mainRank: triples.at(-1), chainLength: triples.length };
    }
  }

  return null;
}
