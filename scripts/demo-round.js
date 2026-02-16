import { createRound, setBid } from '../src/core/state.js';

const round = createRound();
console.log('Phase:', round.phase);
console.log('Hand sizes:', Object.fromEntries(Object.entries(round.hands).map(([k, v]) => [k, v.length])));
console.log('Kitty:', round.kitty.length);

setBid(round, 'p1', 1);
setBid(round, 'p2', 0);
setBid(round, 'p3', 2);

console.log('Landlord:', round.landlord);
console.log('Phase:', round.phase);
console.log('Landlord hand size:', round.hands[round.landlord].length);
