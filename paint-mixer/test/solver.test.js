// Run with: node test/solver.test.js
const solver = require('../solver.js');
const mixbox = require('../vendor/mixbox.js');

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log('  ok  ' + name);
  } else {
    failures++;
    console.error('FAIL  ' + name + (detail ? ' — ' + detail : ''));
  }
}

// --- color conversions ---
check('hexToRgb parses #190059', JSON.stringify(solver.hexToRgb('#190059')) === '[25,0,89]');
check('rgbToHex round-trips', solver.rgbToHex([25, 0, 89]) === '#190059');

const labWhite = solver.labFromRgb([255, 255, 255]);
check('Lab white has L≈100', Math.abs(labWhite[0] - 100) < 0.01, 'L=' + labWhite[0]);
const labBlack = solver.labFromRgb([0, 0, 0]);
check('Lab black has L=0', Math.abs(labBlack[0]) < 0.01, 'L=' + labBlack[0]);

// CIEDE2000 spot checks from Sharma et al. (2005) test data, pairs 1 and 24.
const de1 = solver.deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]);
check('CIEDE2000 test pair 1 ≈ 2.0425', Math.abs(de1 - 2.0425) < 0.001, 'got ' + de1.toFixed(4));
const de24 = solver.deltaE2000([50.0000, 2.5000, 0.0000], [50.0000, 3.2592, 0.3350]);
check('CIEDE2000 test pair 24 ≈ 1.0000', Math.abs(de24 - 1.0000) < 0.001, 'got ' + de24.toFixed(4));
check('CIEDE2000 identical colors = 0', solver.deltaE2000([50, 10, -10], [50, 10, -10]) === 0);

// --- mixbox behaves like paint ---
// Ultramarine + Cadmium Yellow should make a green (paint), not grey (RGB).
const blue = solver.latentOf('#190059');
const yellow = solver.latentOf('#feec00');
const mid = solver.predictRgb([blue, yellow], [0.5, 0.5]);
check('blue + yellow mixes green', mid[1] > mid[0] && mid[1] > mid[2],
  'got rgb(' + mid.join(',') + ')');

// --- solver recovers a known mixture ---
// Construct a target that IS a 60/40 mixbox blend of two shelf paints; the
// solver should find those two paints and land very close.
const shelf = [
  { id: 'w', name: 'Titanium White', hex: '#f5f4ef' },
  { id: 'y', name: 'Cadmium Yellow', hex: '#feec00' },
  { id: 'r', name: 'Cadmium Red', hex: '#ff2702' },
  { id: 'u', name: 'Ultramarine', hex: '#190059' },
  { id: 'g', name: 'Phthalo Green', hex: '#003c32' },
  { id: 'bs', name: 'Burnt Sienna', hex: '#7b4800' }
];
const targetRgb = solver.predictRgb(
  [solver.latentOf('#190059'), solver.latentOf('#feec00')], [0.6, 0.4]);
const targetHex = solver.rgbToHex(targetRgb);
const recipes = solver.solve(targetHex, shelf, { maxResults: 3 });
check('solve returns recipes', recipes.length === 3);
check('best recipe is very close (ΔE < 1.5)', recipes[0].deltaE < 1.5,
  'ΔE=' + recipes[0].deltaE.toFixed(2));
const ids = recipes[0].components.map(c => c.paint.id).sort().join(',');
check('best recipe uses ultramarine + cad yellow', ids === 'u,y', 'used ' + ids);

// Weights within a recipe sum to ~1.
const wsum = recipes[0].components.reduce((s, c) => s + c.weight, 0);
check('weights sum to 1', Math.abs(wsum - 1) < 1e-6, 'sum=' + wsum);

// --- parts conversion ---
check('weightsToParts 0.75/0.25 → 3:1',
  JSON.stringify(solver.weightsToParts([0.75, 0.25])) === '[3,1]');
check('weightsToParts 0.5/0.5 → 1:1',
  JSON.stringify(solver.weightsToParts([0.5, 0.5])) === '[1,1]');

// --- watercolor: water participates but never appears alone ---
const wcShelf = [
  { id: 'u', name: 'Ultramarine', hex: '#190059' },
  { id: 'water', name: 'Water', hex: '#fcfbf6', isWater: true }
];
const wcRecipes = solver.solve('#b9b4e0', wcShelf, { maxResults: 3 });
check('watercolor solve returns recipes', wcRecipes.length > 0);
check('no water-only recipe', wcRecipes.every(r =>
  r.components.some(c => !c.paint.isWater)));
const wcBest = wcRecipes[0];
check('light lavender target uses water', wcBest.components.some(c => c.paint.isWater),
  'components: ' + wcBest.components.map(c => c.paint.id).join(','));

// --- pastel mode: 1-2 sticks only ---
const pastelRecipes = solver.solve('#7a9c6d', shelf, { pastel: true, maxResults: 3 });
check('pastel recipes use at most 2 sticks',
  pastelRecipes.every(r => r.components.length <= 2));

// --- performance sanity: 30-paint shelf solves fast enough ---
const bigShelf = [];
for (let i = 0; i < 30; i++) {
  bigShelf.push({
    id: 'p' + i, name: 'Paint ' + i,
    hex: solver.rgbToHex([(i * 53) % 256, (i * 101) % 256, (i * 197) % 256])
  });
}
const t0 = Date.now();
solver.solve('#4a7c59', bigShelf, { maxResults: 3 });
const elapsed = Date.now() - t0;
check('30-paint solve under 3s', elapsed < 3000, elapsed + 'ms');
console.log('  (30-paint solve took ' + elapsed + 'ms)');

if (failures) {
  console.error('\n' + failures + ' test(s) FAILED');
  process.exit(1);
}
console.log('\nAll tests passed.');
