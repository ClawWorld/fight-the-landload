import { runAutoGame } from '../src/core/full-game.js';

const result = runAutoGame();
console.log('Finished:', result.finished);
console.log('Turns:', result.turns);
console.log('Winner:', result.winner);
console.log('Landlord:', result.landlord);
console.log('Hand sizes:', result.handSizes);
console.log('Score delta:', result.scoreDelta);
