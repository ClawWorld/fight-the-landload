import { RANK_VALUE } from './cards.js';
import { identifyCombo } from './combo.js';

export function canBeat(lastPlayCards, newPlayCards) {
  const last = identifyCombo(lastPlayCards);
  const next = identifyCombo(newPlayCards);

  if (!next) return false;
  if (!last) return true;

  if (next.type === 'ROCKET') return true;
  if (last.type === 'ROCKET') return false;

  if (next.type === 'BOMB' && last.type !== 'BOMB') return true;
  if (last.type === 'BOMB' && next.type !== 'BOMB') return false;

  if (next.type !== last.type) return false;
  if (next.length !== last.length) return false;

  return RANK_VALUE[next.mainRank] > RANK_VALUE[last.mainRank];
}
