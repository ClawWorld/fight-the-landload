import { createRound, setBid, playCards, passTurn } from './state.js';
import { choosePlay } from './ai.js';

function autoBid(hand) {
  // Simple heuristic: more high cards => higher bid
  const scoreMap = { '2': 2, BJ: 3, RJ: 4, A: 1 };
  let score = 0;
  for (const c of hand) score += scoreMap[c.rank] || 0;
  if (score >= 9) return 3;
  if (score >= 6) return 2;
  if (score >= 3) return 1;
  return 0;
}

export function runAutoGame({ rng = Math.random, maxTurns = 2000 } = {}) {
  const state = createRound({ rng });

  const bids = Object.fromEntries(state.players.map((pid) => [pid, autoBid(state.hands[pid])]));
  const best = Math.max(...Object.values(bids));
  if (best === 0) bids.p1 = 1; // fallback to ensure game starts

  for (const pid of state.players) {
    setBid(state, pid, bids[pid]);
  }

  let turns = 0;
  while (state.phase === 'PLAYING' && turns < maxTurns) {
    const pid = state.currentPlayer;
    const hand = state.hands[pid];
    const play = choosePlay({ hand, lastPlayCards: state.lastPlay ? state.lastPlay.cards : null });

    if (play?.length) playCards(state, pid, play);
    else passTurn(state, pid);

    turns += 1;
  }

  return {
    finished: state.phase === 'FINISHED',
    turns,
    winner: state.winner,
    landlord: state.landlord,
    scoreDelta: state.scoreDelta,
    handSizes: Object.fromEntries(Object.entries(state.hands).map(([k, v]) => [k, v.length]))
  };
}
