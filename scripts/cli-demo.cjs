#!/usr/bin/env node

// Simple CLI test for Dou Dizhu game logic

const { buildDeck, shuffle, deal } = require('../src/core/cards.js');
const { identifyCombo, canBeat } = require('../src/core/combo.js');
const { createSeededRng } = require('../src/core/rng.js');

// Helper to format card objects
function formatCard(card) {
    if (card.rank === 'BJ') return '小王';
    if (card.rank === 'RJ') return '大王';
    return card.rank;
}

function formatHand(hand, max = 5) {
    return hand.slice(0, max).map(c => formatCard(c)).join(' ') + (hand.length > max ? '...' : '');
}

function cardIds(cards) {
    return cards.map(c => c.id);
}

// Test 1: Basic deck
console.log('=== Test 1: Deck ===');
const deck = buildDeck();
console.log('Deck size:', deck.length);
console.log('Has jokers:', deck.some(c => c.rank === 'BJ'), deck.some(c => c.rank === 'RJ'));

// Test 2: Shuffle and deal
console.log('\n=== Test 2: Shuffle & Deal ===');
shuffle(deck);
const hands = deal(deck);
console.log('P1 hand:', hands.p1.length, 'cards');
console.log('P2 hand:', hands.p2.length, 'cards');
console.log('P3 hand:', hands.p3.length, 'cards');
console.log('Kitty:', hands.kitty.length, 'cards');

// Test 3: Card combos (using rank strings)
console.log('\n=== Test 3: Combo Identification ===');
const tests = [
    ['Single', ['8']],
    ['Pair', ['8', '8']],
    ['Triple', ['9', '9', '9']],
    ['Bomb', ['A', 'A', 'A', 'A']],
    ['Rocket', ['BJ', 'RJ']],
    ['Straight', ['3', '4', '5', '6', '7']],
    ['Consecutive Pairs', ['3', '3', '4', '4', '5', '5']],
    ['Airplane', ['3', '3', '3', '4', '4', '4']],
    ['Triple+Single', ['9', '9', '9', 'K']],
    ['Triple+Pair', ['9', '9', '9', 'K', 'K']],
];

for (const [name, ranks] of tests) {
    const result = identifyCombo(ranks);
    console.log(`${name}:`, result ? result.type : 'INVALID');
}

// Test 4: Comparison
console.log('\n=== Test 4: Comparison ===');
const pair8 = ['8', '8'];
const pair9 = ['9', '9'];
console.log('Pair9 beats Pair8:', canBeat(pair8, pair9));
console.log('Pair8 beats Pair9:', canBeat(pair9, pair8));

const straight1 = ['3', '4', '5', '6', '7'];
const straight2 = ['4', '5', '6', '7', '8'];
console.log('Straight2 beats Straight1:', canBeat(straight1, straight2));

const bomb = ['A', 'A', 'A', 'A'];
const rocket = ['BJ', 'RJ'];
console.log('Rocket beats Bomb:', canBeat(bomb, rocket));
console.log('Bomb beats Rocket:', canBeat(rocket, bomb));

// Test 5: Full game simulation
console.log('\n=== Test 5: Full Game Simulation ===');

function playGame() {
    let deck2 = buildDeck();
    shuffle(deck2);
    const { p1, p2, p3, kitty } = deal(deck2);
    
    // Simple bidding: Player (p1) calls 3, becomes landlord
    const landlord = 'p1';
    const p1Hand = [...p1, ...kitty];
    
    console.log(`Landlord: ${landlord} (Player)`);
    console.log(`Player hand (${p1Hand.length} cards): ${formatHand(p1Hand)}`);
    
    // Simple play simulation
    let currentPlayer = landlord;
    let lastPlay = null;
    
    const players = ['p1', 'p2', 'p3'];
    const handsMap = {
        'p1': p1Hand,
        'p2': p2,
        'p3': p3
    };
    
    let rounds = 0;
    while (handsMap['p1'].length > 0 && handsMap['p2'].length > 0 && handsMap['p3'].length > 0) {
        rounds++;
        if (rounds > 200) break; // Safety limit
        
        const hand = handsMap[currentPlayer];
        if (hand.length === 0) break;
        
        // Simple AI: play lowest single
        const card = hand.shift();
        const play = [card.rank];
        
        lastPlay = { player: currentPlayer, cards: play };
        
        console.log(`  Round ${rounds}: ${currentPlayer} plays ${formatCard(card)}`);
        
        // Check win
        if (hand.length === 0) {
            console.log(`\n*** ${currentPlayer} wins! ***`);
            break;
        }
        
        // Next player
        currentPlayer = players[(players.indexOf(currentPlayer) + 1) % 3];
    }
    
    console.log(`\nGame finished in ${rounds} rounds`);
    console.log('Final hands:');
    console.log('  Player (p1):', handsMap['p1'].length);
    console.log('  AI Left (p2):', handsMap['p2'].length);
    console.log('  AI Right (p3):', handsMap['p3'].length);
}

playGame();

console.log('\n=== All tests completed! ===');
