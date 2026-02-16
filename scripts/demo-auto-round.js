import { runAutoRound } from '../src/core/sim.js';

function c(rank, id) {
  return { rank, suit: 'X', id };
}

// Deterministic tiny test round to verify end-to-end flow quickly.
const state = {
  phase: 'PLAYING',
  players: ['p1', 'p2', 'p3'],
  hands: {
    p1: [c('3', 'p1-3'), c('4', 'p1-4')],
    p2: [c('5', 'p2-5'), c('6', 'p2-6')],
    p3: [c('7', 'p3-7'), c('8', 'p3-8')]
  },
  bids: { p1: 1, p2: 0, p3: 2 },
  landlord: 'p3',
  currentPlayer: 'p1',
  lastPlay: null,
  trickLeader: null,
  passStreak: 0,
  winner: null,
  multiplier: 1,
  scoreDelta: null
};

const result = runAutoRound(state, { maxTurns: 200 });
console.log('Finished:', result.finished);
console.log('Turns:', result.turns);
console.log('Winner:', result.winner);
console.log('Final hand sizes:', Object.fromEntries(Object.entries(result.state.hands).map(([k, v]) => [k, v.length])));
console.log('Score delta:', result.state.scoreDelta);
