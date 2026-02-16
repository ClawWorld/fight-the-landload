import { buildDeck, shuffle, deal } from './cards.js';
import { canBeat } from './compare.js';
import { identifyCombo } from './combo.js';

export function createRound({ rng = Math.random } = {}) {
  const deck = shuffle(buildDeck(), rng);
  const hands = deal(deck);

  return {
    phase: 'BIDDING',
    players: ['p1', 'p2', 'p3'],
    hands: {
      p1: hands.p1,
      p2: hands.p2,
      p3: hands.p3
    },
    kitty: hands.kitty,
    bids: {},
    landlord: null,
    currentPlayer: 'p1',
    lastPlay: null, // { playerId, cards, combo }
    trickLeader: null,
    passStreak: 0,
    winner: null,
    multiplier: 1,
    scoreDelta: null
  };
}

export function setBid(state, playerId, bid) {
  if (state.phase !== 'BIDDING') throw new Error('Not in bidding phase');
  if (![0, 1, 2, 3].includes(bid)) throw new Error('Bid must be 0..3');
  state.bids[playerId] = bid;

  if (Object.keys(state.bids).length === 3) {
    const sorted = Object.entries(state.bids).sort((a, b) => b[1] - a[1]);
    const [winner, best] = sorted[0];
    if (best === 0) throw new Error('No valid landlord yet: redeal rule TBD');
    state.landlord = winner;
    state.hands[winner].push(...state.kitty);
    state.phase = 'PLAYING';
    state.currentPlayer = winner;
  }
}

export function removeCardsFromHand(hand, cards) {
  const ids = new Set(cards.map((c) => c.id));
  const next = hand.filter((c) => !ids.has(c.id));
  if (next.length !== hand.length - cards.length) throw new Error('Cards not found in hand');
  return next;
}

export function nextPlayer(pid) {
  return pid === 'p1' ? 'p2' : pid === 'p2' ? 'p3' : 'p1';
}

export function playCards(state, playerId, cards) {
  if (state.phase !== 'PLAYING') throw new Error('Not in playing phase');
  if (state.currentPlayer !== playerId) throw new Error('Not this player turn');
  if (!cards?.length) throw new Error('Cannot play empty cards');

  const combo = identifyCombo(cards);
  if (!combo) throw new Error('Invalid combo');

  if (state.lastPlay && state.trickLeader !== playerId) {
    if (!canBeat(state.lastPlay.cards, cards)) throw new Error('Play does not beat last play');
  }

  const hand = state.hands[playerId];
  state.hands[playerId] = removeCardsFromHand(hand, cards);

  state.lastPlay = { playerId, cards, combo };
  state.trickLeader = playerId;
  state.passStreak = 0;

  if (combo.type === 'BOMB' || combo.type === 'ROCKET') state.multiplier *= 2;

  if (state.hands[playerId].length === 0) {
    state.winner = playerId;
    state.phase = 'FINISHED';
    state.scoreDelta = settleScore(state);
    return state;
  }

  state.currentPlayer = nextPlayer(playerId);
  return state;
}

export function passTurn(state, playerId) {
  if (state.phase !== 'PLAYING') throw new Error('Not in playing phase');
  if (state.currentPlayer !== playerId) throw new Error('Not this player turn');
  if (!state.lastPlay) throw new Error('Cannot pass on fresh trick');
  if (state.trickLeader === playerId) throw new Error('Trick leader cannot pass');

  state.passStreak += 1;

  if (state.passStreak >= 2) {
    // everyone else passed, trick resets to leader
    state.currentPlayer = state.trickLeader;
    state.lastPlay = null;
    state.passStreak = 0;
    return state;
  }

  state.currentPlayer = nextPlayer(playerId);
  return state;
}

function settleScore(state) {
  const base = Math.max(...Object.values(state.bids));
  const stake = base * state.multiplier;
  const landlord = state.landlord;
  const farmers = state.players.filter((p) => p !== landlord);

  if (state.winner === landlord) {
    return {
      [landlord]: stake * 2,
      [farmers[0]]: -stake,
      [farmers[1]]: -stake
    };
  }

  return {
    [landlord]: -stake * 2,
    [farmers[0]]: stake,
    [farmers[1]]: stake
  };
}
