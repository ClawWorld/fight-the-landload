import { choosePlay } from './ai.js';
import { playCards, passTurn } from './state.js';

export function runAutoRound(state, { maxTurns = 500 } = {}) {
  let turns = 0;

  while (state.phase === 'PLAYING' && turns < maxTurns) {
    const pid = state.currentPlayer;
    const hand = state.hands[pid];

    const play = choosePlay({
      hand,
      lastPlayCards: state.lastPlay ? state.lastPlay.cards : null
    });

    if (play && play.length) {
      playCards(state, pid, play);
    } else {
      passTurn(state, pid);
    }

    turns += 1;
  }

  return {
    finished: state.phase === 'FINISHED',
    turns,
    winner: state.winner,
    state
  };
}
