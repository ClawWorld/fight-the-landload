import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, shuffle, deal } from '../src/core/cards.js';
import { identifyCombo } from '../src/core/combo.js';
import { canBeat } from '../src/core/compare.js';
import { playCards, passTurn } from '../src/core/state.js';
import { choosePlay } from '../src/core/ai.js';
import { runAutoRound } from '../src/core/sim.js';
import { runAutoGame } from '../src/core/full-game.js';

function cards(...ranks) {
  return ranks.map((rank, i) => ({ rank, suit: 'X', id: `${rank}-${i}` }));
}

test('deck has 54 unique cards', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 54);
  assert.equal(new Set(deck.map((c) => c.id)).size, 54);
});

test('deal splits into 17/17/17 + 3', () => {
  const d = deal(shuffle(buildDeck(), () => 0.5));
  assert.equal(d.p1.length, 17);
  assert.equal(d.p2.length, 17);
  assert.equal(d.p3.length, 17);
  assert.equal(d.kitty.length, 3);
});

test('identify core combos', () => {
  assert.equal(identifyCombo(cards('BJ', 'RJ')).type, 'ROCKET');
  assert.equal(identifyCombo(cards('7', '7', '7', '7')).type, 'BOMB');
  assert.equal(identifyCombo(cards('5')).type, 'SINGLE');
  assert.equal(identifyCombo(cards('8', '8')).type, 'PAIR');
  assert.equal(identifyCombo(cards('9', '9', '9')).type, 'TRIPLE');
  assert.equal(identifyCombo(cards('9', '9', '9', 'K')).type, 'TRIPLE_SINGLE');
  assert.equal(identifyCombo(cards('9', '9', '9', 'K', 'K')).type, 'TRIPLE_PAIR');
  assert.equal(identifyCombo(cards('3', '4', '5', '6', '7')).type, 'STRAIGHT');
  assert.equal(identifyCombo(cards('3', '3', '4', '4', '5', '5')).type, 'CONSECUTIVE_PAIRS');
  assert.equal(identifyCombo(cards('3', '3', '3', '4', '4', '4')).type, 'AIRPLANE');
});

test('compare logic', () => {
  assert.equal(canBeat(cards('6'), cards('7')), true);
  assert.equal(canBeat(cards('Q', 'Q'), cards('J', 'J')), false);
  assert.equal(canBeat(cards('7', '7', '7', '7'), cards('BJ', 'RJ')), true); // rocket always beats
  assert.equal(canBeat(cards('3', '3', '3', '3'), cards('4', '4', '4', '4')), true);
  assert.equal(canBeat(cards('3', '4', '5', '6', '7'), cards('4', '5', '6', '7', '8')), true);
});

test('identify extended combos', () => {
  assert.equal(identifyCombo(cards('3', '3', '3', '4', '4', '4', '7', '8')).type, 'AIRPLANE_SINGLE_WINGS');
  assert.equal(identifyCombo(cards('3', '3', '3', '4', '4', '4', '7', '7', '8', '8')).type, 'AIRPLANE_PAIR_WINGS');
  assert.equal(identifyCombo(cards('A', 'A', 'A', 'A', '5', '7')).type, 'FOUR_TWO_SINGLES');
  assert.equal(identifyCombo(cards('A', 'A', 'A', 'A', '5', '5', '7', '7')).type, 'FOUR_TWO_PAIRS');
});

test('state pass reset flow', () => {
  const state = {
    phase: 'PLAYING',
    players: ['p1', 'p2', 'p3'],
    hands: {
      p1: cards('3', '3'),
      p2: cards('4'),
      p3: cards('5')
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

  playCards(state, 'p1', [state.hands.p1[0]]);
  assert.equal(state.currentPlayer, 'p2');

  passTurn(state, 'p2');
  assert.equal(state.currentPlayer, 'p3');
  assert.equal(state.lastPlay.playerId, 'p1');

  passTurn(state, 'p3');
  assert.equal(state.currentPlayer, 'p1');
  assert.equal(state.lastPlay, null);
  assert.equal(state.passStreak, 0);
});

test('state finishes and settles score', () => {
  const state = {
    phase: 'PLAYING',
    players: ['p1', 'p2', 'p3'],
    hands: {
      p1: cards('6'),
      p2: cards('4', '4'),
      p3: cards('5', '5')
    },
    bids: { p1: 2, p2: 0, p3: 1 },
    landlord: 'p1',
    currentPlayer: 'p1',
    lastPlay: null,
    trickLeader: null,
    passStreak: 0,
    winner: null,
    multiplier: 1,
    scoreDelta: null
  };

  playCards(state, 'p1', [state.hands.p1[0]]);
  assert.equal(state.phase, 'FINISHED');
  assert.equal(state.winner, 'p1');
  assert.deepEqual(state.scoreDelta, { p1: 4, p2: -2, p3: -2 });
});

test('ai responds with minimal winning single', () => {
  const hand = cards('3', '7', 'J');
  const pick = choosePlay({ hand, lastPlayCards: cards('6') });
  assert.equal(pick.length, 1);
  assert.equal(pick[0].rank, '7');
});

test('ai uses bomb when cannot follow simple type', () => {
  const hand = cards('3', '3', '3', '3', '5', '9');
  const pick = choosePlay({ hand, lastPlayCards: cards('A', 'A') });
  assert.equal(identifyCombo(pick).type, 'BOMB');
});

test('ai responds to straight with a higher straight', () => {
  const hand = cards('4', '5', '6', '7', '8', 'Q');
  const pick = choosePlay({ hand, lastPlayCards: cards('3', '4', '5', '6', '7') });
  assert.equal(identifyCombo(pick).type, 'STRAIGHT');
  assert.equal(canBeat(cards('3', '4', '5', '6', '7'), pick), true);
});

test('ai responds to consecutive pairs', () => {
  const hand = cards('4', '4', '5', '5', '6', '6', 'Q');
  const pick = choosePlay({ hand, lastPlayCards: cards('3', '3', '4', '4', '5', '5') });
  assert.equal(identifyCombo(pick).type, 'CONSECUTIVE_PAIRS');
  assert.equal(canBeat(cards('3', '3', '4', '4', '5', '5'), pick), true);
});

test('ai responds to airplane without wings', () => {
  const hand = cards('4', '4', '4', '5', '5', '5', '9');
  const pick = choosePlay({ hand, lastPlayCards: cards('3', '3', '3', '4', '4', '4') });
  assert.equal(identifyCombo(pick).type, 'AIRPLANE');
  assert.equal(canBeat(cards('3', '3', '3', '4', '4', '4'), pick), true);
});

test('ai responds to airplane with single wings', () => {
  const hand = cards('4', '4', '4', '5', '5', '5', '8', '9', 'Q');
  const last = cards('3', '3', '3', '4', '4', '4', '6', '7');
  const pick = choosePlay({ hand, lastPlayCards: last });
  assert.equal(identifyCombo(pick).type, 'AIRPLANE_SINGLE_WINGS');
  assert.equal(canBeat(last, pick), true);
});

test('ai responds to airplane with pair wings', () => {
  const hand = cards('4', '4', '4', '5', '5', '5', '8', '8', '9', '9', 'Q');
  const last = cards('3', '3', '3', '4', '4', '4', '6', '6', '7', '7');
  const pick = choosePlay({ hand, lastPlayCards: last });
  assert.equal(identifyCombo(pick).type, 'AIRPLANE_PAIR_WINGS');
  assert.equal(canBeat(last, pick), true);
});

test('auto simulation can finish a small deterministic round', () => {
  const state = {
    phase: 'PLAYING',
    players: ['p1', 'p2', 'p3'],
    hands: {
      p1: [
        { rank: '3', suit: 'X', id: 'p1-3' },
        { rank: '4', suit: 'X', id: 'p1-4' }
      ],
      p2: [
        { rank: '5', suit: 'X', id: 'p2-5' },
        { rank: '6', suit: 'X', id: 'p2-6' }
      ],
      p3: [
        { rank: '7', suit: 'X', id: 'p3-7' },
        { rank: '8', suit: 'X', id: 'p3-8' }
      ]
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

  const result = runAutoRound(state, { maxTurns: 100 });
  assert.equal(result.finished, true);
  assert.ok(['p1', 'p2', 'p3'].includes(result.winner));
  assert.notEqual(result.state.scoreDelta, null);
});

test('auto full game can finish', () => {
  const result = runAutoGame({ maxTurns: 2000 });
  assert.equal(result.finished, true);
  assert.ok(['p1', 'p2', 'p3'].includes(result.winner));
  assert.ok(['p1', 'p2', 'p3'].includes(result.landlord));
  assert.notEqual(result.scoreDelta, null);
});

test('auto full game score conserves zero-sum', () => {
  const result = runAutoGame({ maxTurns: 2000 });
  const total = Object.values(result.scoreDelta).reduce((s, n) => s + n, 0);
  assert.equal(total, 0);
});
