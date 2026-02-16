import { identifyCombo } from './combo.js';
import { canBeat } from './compare.js';

/**
 * Very early AI policy:
 * - If starting turn: play the smallest single.
 * - If responding: find first legal single/pair/triple style response by sorted rank.
 * This is placeholder logic and will be upgraded.
 */
export function choosePlay({ hand, lastPlayCards }) {
  const sorted = [...hand].sort((a, b) => a.rank.localeCompare(b.rank));

  if (!lastPlayCards) return [sorted[0]];

  // naive search all single-card responses first
  for (const c of sorted) {
    if (canBeat(lastPlayCards, [c])) return [c];
  }

  // fallback: pass
  return null;
}

export function canRecognize(cards) {
  return !!identifyCombo(cards);
}
