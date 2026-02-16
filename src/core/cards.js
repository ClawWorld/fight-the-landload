export const RANKS = [
  '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'BJ', 'RJ'
];

export const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 3]));

const SUITS = ['S', 'H', 'C', 'D'];

export function buildDeck() {
  const deck = [];
  for (const rank of RANKS.slice(0, 13)) {
    for (const suit of SUITS) {
      deck.push({ rank, suit, id: `${rank}-${suit}` });
    }
  }
  deck.push({ rank: 'BJ', suit: 'J', id: 'BJ-J' });
  deck.push({ rank: 'RJ', suit: 'J', id: 'RJ-J' });
  return deck;
}

export function shuffle(deck, rng = Math.random) {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal(shuffledDeck) {
  if (shuffledDeck.length !== 54) throw new Error('Deck must have 54 cards');
  return {
    p1: shuffledDeck.slice(0, 17),
    p2: shuffledDeck.slice(17, 34),
    p3: shuffledDeck.slice(34, 51),
    kitty: shuffledDeck.slice(51, 54)
  };
}

export function countRanks(cards) {
  const map = new Map();
  for (const c of cards) map.set(c.rank, (map.get(c.rank) || 0) + 1);
  return map;
}

export function sortRanksAsc(ranks) {
  return [...ranks].sort((a, b) => RANK_VALUE[a] - RANK_VALUE[b]);
}
