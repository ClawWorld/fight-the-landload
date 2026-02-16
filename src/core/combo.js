import { RANK_VALUE, countRanks, sortRanksAsc } from './cards.js';

const BLOCKED_IN_SEQUENCES = new Set(['2', 'BJ', 'RJ']);

function isStraightRanks(ranks) {
  if (ranks.length < 5) return false;
  if (ranks.some((r) => BLOCKED_IN_SEQUENCES.has(r))) return false;
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

function isConsecutive(ranks) {
  if (!ranks.length) return false;
  const sorted = sortRanksAsc(ranks);
  for (let i = 1; i < sorted.length; i++) {
    if (RANK_VALUE[sorted[i]] !== RANK_VALUE[sorted[i - 1]] + 1) return false;
  }
  return true;
}

function matchAirplaneWithWings(counts, chainLen, wingType) {
  // wingType: 'single' | 'pair'
  const tripleRanks = [...counts.entries()]
    .filter(([r, c]) => c === 3 && !BLOCKED_IN_SEQUENCES.has(r))
    .map(([r]) => r)
    .sort((a, b) => RANK_VALUE[a] - RANK_VALUE[b]);

  if (tripleRanks.length < chainLen) return null;

  for (let i = 0; i <= tripleRanks.length - chainLen; i++) {
    const chain = tripleRanks.slice(i, i + chainLen);
    if (!isConsecutive(chain)) continue;

    const remaining = new Map(counts);
    for (const r of chain) remaining.set(r, remaining.get(r) - 3);

    const remains = [...remaining.entries()].filter(([, c]) => c > 0);
    if (wingType === 'single') {
      const total = remains.reduce((s, [, c]) => s + c, 0);
      if (total === chainLen) {
        return { type: 'AIRPLANE_SINGLE_WINGS', mainRank: chain.at(-1), chainLength: chainLen };
      }
    } else {
      if (remains.length === chainLen && remains.every(([, c]) => c === 2)) {
        return { type: 'AIRPLANE_PAIR_WINGS', mainRank: chain.at(-1), chainLength: chainLen };
      }
    }
  }

  return null;
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
    if (!pairs.some((r) => BLOCKED_IN_SEQUENCES.has(r)) && isConsecutive(pairs)) {
      return { type: 'CONSECUTIVE_PAIRS', length: n, mainRank: pairs.at(-1) };
    }
  }

  // Airplane without wings (e.g. 333444)
  if (n >= 6 && n % 3 === 0 && repeatedRanks(counts, 3).length === n / 3) {
    const triples = repeatedRanks(counts, 3);
    if (!triples.some((r) => BLOCKED_IN_SEQUENCES.has(r)) && isConsecutive(triples)) {
      return { type: 'AIRPLANE', length: n, mainRank: triples.at(-1), chainLength: triples.length };
    }
  }

  // Airplane + single wings (e.g. 33344456)
  if (n >= 8 && n % 4 === 0) {
    const chainLen = n / 4;
    const matched = matchAirplaneWithWings(counts, chainLen, 'single');
    if (matched) return { ...matched, length: n };
  }

  // Airplane + pair wings (e.g. 3334445566)
  if (n >= 10 && n % 5 === 0) {
    const chainLen = n / 5;
    const matched = matchAirplaneWithWings(counts, chainLen, 'pair');
    if (matched) return { ...matched, length: n };
  }

  // Four with two singles (e.g. AAAA + 5 + 7)
  if (n === 6 && byCount[0][1] === 4) {
    return { type: 'FOUR_TWO_SINGLES', length: 6, mainRank: byCount[0][0] };
  }

  // Four with two pairs (e.g. AAAA + 55 + 77)
  if (n === 8 && byCount[0][1] === 4) {
    const rest = byCount.slice(1);
    if (rest.length === 2 && rest.every(([, c]) => c === 2)) {
      return { type: 'FOUR_TWO_PAIRS', length: 8, mainRank: byCount[0][0] };
    }
  }

  return null;
}
