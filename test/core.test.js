import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, shuffle, deal } from '../src/core/cards.js';
import { identifyCombo } from '../src/core/combo.js';
import { canBeat } from '../src/core/compare.js';

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
