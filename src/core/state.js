import { buildDeck, shuffle, deal } from './cards.js';

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
    lastPlay: null,
    passStreak: 0,
    winner: null
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
