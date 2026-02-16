import { runAutoGame } from '../src/core/full-game.js';
import { createSeededRng } from '../src/core/rng.js';

const games = Number(process.argv[2] || 100);
const baseSeed = Number(process.argv[3] || 20260216);

let finished = 0;
let totalTurns = 0;
const wins = { p1: 0, p2: 0, p3: 0 };
const landlordWins = { yes: 0, no: 0 };

for (let i = 0; i < games; i++) {
  const rng = createSeededRng(baseSeed + i);
  const r = runAutoGame({ rng, maxTurns: 3000 });
  if (!r.finished) continue;

  finished += 1;
  totalTurns += r.turns;
  wins[r.winner] += 1;
  if (r.winner === r.landlord) landlordWins.yes += 1;
  else landlordWins.no += 1;
}

console.log('Games:', games);
console.log('Finished:', finished);
console.log('FinishRate:', `${((finished / games) * 100).toFixed(2)}%`);
console.log('AvgTurns:', finished ? (totalTurns / finished).toFixed(2) : 'N/A');
console.log('WinnerDist:', wins);
console.log('LandlordWin:', landlordWins);
