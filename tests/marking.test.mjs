// tests/marking.test.mjs
//
// Exercises the REAL js/topic-interactions.js (loaded via tests/helpers.mjs's vm sandbox), not a
// re-implementation. Two groups:
//   - "regression": existing behaviour across all 24 chapters that must keep working exactly as-is.
//   - "algebraic equivalence": the new behaviour this change adds (term order/sign-placement
//     insensitivity for simple linear expressions), plus the compound "rule and term" answers.
//
// Run with: node --test tests/   (or `npm test`)

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTopicEngine } from './helpers.mjs';

const { isCorrect, fractionHtml } = loadTopicEngine();

test('regression: numeric tolerance and unit stripping', () => {
  assert.equal(isCorrect('15', ['15']), true);
  assert.equal(isCorrect('15cm', ['15']), true);
  assert.equal(isCorrect('$45', ['45']), true);
  assert.equal(isCorrect('45 degrees', ['45°']), true);
  assert.equal(isCorrect('4.38', ['4.375']), true); // within ±0.06 tolerance
  assert.equal(isCorrect('4.2', ['4.375']), false); // outside tolerance
  assert.equal(isCorrect('16', ['15']), false);
});

test('regression: equations "x = N"', () => {
  assert.equal(isCorrect('x = 5', ['x = 5']), true);
  assert.equal(isCorrect('x=5', ['x = 5']), true);
  assert.equal(isCorrect('5', ['x = 5']), true); // bare number already accepted via gradient=/^[a-z]=/ strip
  assert.equal(isCorrect('x = 6', ['x = 5']), false);
});

test('regression: coordinates', () => {
  assert.equal(isCorrect('(3, 4)', ['(3,4)', '3,4']), true);
  assert.equal(isCorrect('3,4', ['(3,4)', '3,4']), true);
  assert.equal(isCorrect('(4, 3)', ['(3,4)', '3,4']), false); // swapped coords must NOT match
});

test('regression: ratios (colon form)', () => {
  assert.equal(isCorrect('2 : 3', ['2 : 3']), true);
  assert.equal(isCorrect('2:3', ['2 : 3']), true);
  assert.equal(isCorrect('3 : 2', ['2 : 3']), false); // order matters for a ratio
});

test('regression: fractions', () => {
  assert.equal(isCorrect('2/3', ['2/3']), true);
  assert.equal(isCorrect('1 5/12', ['1 5/12']), true);
  assert.equal(isCorrect('15/12', ['1 5/12']), true);
});

test('regression: compound "A and B" answers, including negatives', () => {
  assert.equal(isCorrect('18 and 27', ['$18 and $27']), true);
  assert.equal(isCorrect('18, 27', ['$18 and $27']), true);
  assert.equal(isCorrect('27 and 18', ['$18 and $27']), false); // order enforced
  assert.equal(isCorrect('9 and -9', ['9 and −9']), true);
  assert.equal(isCorrect('9,-9', ['9 and −9']), true);
});

test('regression: degree-2 expressions are exact-match only (no false-positive reordering)', () => {
  assert.equal(isCorrect('3x² + 2x', ['3x² + 2x']), true);
  assert.equal(isCorrect('2x + 3x²', ['3x² + 2x']), false); // reordered degree-2: intentionally out of scope
});

test('algebraic equivalence: term order and sign placement (expressions.html cases)', () => {
  assert.equal(isCorrect('3x+12', ['3x + 12']), true);
  assert.equal(isCorrect('12+3x', ['3x + 12']), true);
  assert.equal(isCorrect('12 + 3x', ['3x + 12']), true);
  assert.equal(isCorrect('4x+12', ['3x + 12']), false); // wrong coefficient
  assert.equal(isCorrect('3x+13', ['3x + 12']), false); // wrong constant

  assert.equal(isCorrect('-3x+12', ['−3x + 12']), true);
  assert.equal(isCorrect('12-3x', ['−3x + 12']), true);
  assert.equal(isCorrect('12 - 3x', ['−3x + 12']), true);

  assert.equal(isCorrect('8+6n', ['8 + 6n']), true);
  assert.equal(isCorrect('6n+8', ['8 + 6n']), true);

  assert.equal(isCorrect('x+8', ['x + 8']), true);
  assert.equal(isCorrect('8+x', ['x + 8']), true); // implicit coefficient of 1

  // different letter must not match even if numerically equivalent in form
  assert.equal(isCorrect('3y+12', ['3x + 12']), false);
});

test('algebraic equivalence must not falsely engage on non-expression accepts', () => {
  assert.equal(isCorrect('(3, 4)', ['(3,4)']), true);   // unaffected — parens block the parser
  assert.equal(isCorrect('4, 3', ['(3,4)']), false);      // still correctly rejected, not reinterpreted as algebra
  assert.equal(isCorrect('3 : 2', ['2 : 3']), false);     // ratio, unaffected
  assert.equal(isCorrect('x = 6', ['x = 5']), false);     // equation, still exact (no letter survives normAns strip)
});

test('compound rule-and-term answers (patterns.html redesign)', () => {
  const accept = ['3n + 2 and 32'];
  assert.equal(isCorrect('3n+2, 32', accept), true);
  assert.equal(isCorrect('3n + 2 and 32', accept), true);
  assert.equal(isCorrect('2+3n, 32', accept), true); // reordered rule AND compound split, composed
  assert.equal(isCorrect('3n+2', accept), false);      // incomplete — only one of two parts
  assert.equal(isCorrect('32, 3n+2', accept), false);  // wrong order
  assert.equal(isCorrect('3n+2 and 33', accept), false); // wrong term value
});

test('regression: partsMatch does not let parseFloat truncation fake-match a wrong sign', () => {
  // "3n − 2" and "3n + 2" both start with the digit "3", and bare parseFloat("3n-2") silently
  // truncates at the letter "n" and returns 3 — so without a strict-numeric guard, comparing these
  // two algebra-shaped compound parts by "numeric equality" would wrongly treat them as equal,
  // defeating the sign check entirely (found while verifying the tile-builder rejects a
  // wrong-sign tile combination).
  const accept = ['3n + 2 and 32'];
  assert.equal(isCorrect('3n − 2 and 32', accept), false);
  assert.equal(isCorrect('3n - 2 and 32', accept), false);
});

test('normParts filter broadening: HCF/LCM "=" tokens no longer block compound matching', () => {
  assert.equal(isCorrect('6 and 72', ['HCF = 6, LCM = 72']), true);
  assert.equal(isCorrect('5 and 72', ['HCF = 6, LCM = 72']), false); // wrong HCF must still fail
});

test('normParts filter broadening: unit words containing "/" no longer block compound matching', () => {
  const accept = ['30 km/h; 3 h 20 min'];
  assert.equal(isCorrect('30 km/h and 3 h 20 min', accept), true);
  assert.equal(isCorrect('30 and 3 h 20 min', accept), true);
});

test('fractionHtml: renders clean fractions/mixed numbers, leaves everything else alone', () => {
  assert.equal(fractionHtml('2/3'), '<span class="m"><span class="frac"><span class="n">2</span><span class="d">3</span></span></span>');
  assert.equal(fractionHtml('1 5/12'), '<span class="m">1 <span class="frac"><span class="n">5</span><span class="d">12</span></span></span>');
  assert.equal(fractionHtml('20'), null);
  assert.equal(fractionHtml('x = 5'), null);
});

test('regression: fractionHtml can never inject HTML, no matter what was typed', () => {
  // Gated on the WHOLE trimmed string matching a digits/space/slash-only pattern, so there is no
  // character set the regex can match that could ever carry a tag or attribute.
  const attempts = ['<script>alert(1)</script>', '2/3<img src=x onerror=alert(1)>', '1</span>5/12', '2/3" onmouseover="alert(1)'];
  attempts.forEach((a) => assert.equal(fractionHtml(a), null, a));
});

test('scientific notation: keyboard-typeable alternatives to ×/superscript are accepted', () => {
  // A real keyboard can't type × or ⁴ directly -- "x"/"*" for × and "^4" for ⁴ must mark correct
  // against the real accept value ("7.8 × 10⁴"), with or without spaces.
  assert.equal(isCorrect('7.8 x 10^4', ['7.8 × 10⁴']), true);
  assert.equal(isCorrect('7.8*10^4', ['7.8 × 10⁴']), true);
  assert.equal(isCorrect('7.8x10^4', ['7.8 × 10⁴']), true);
  assert.equal(isCorrect('7.8 × 10^4', ['7.8 × 10⁴']), true);
  assert.equal(isCorrect('6 x 10^5', ['6 × 10⁵']), true); // whole-number coefficient, no decimal point
});

test('regression: scientific notation exponent 2/3 must not be silently stripped by the generic °²³ unit-decoration strip', () => {
  // 10² and 10³ share their exponent characters with "cm²"/"cm³" area/volume units, which normAns
  // strips as decorative. Without canonSciNotation running first, "5.1 × 10" (exponent left off
  // entirely) would compare equal to the real "5.1 × 10²" -- a false positive that lets a genuinely
  // incomplete answer mark as correct. Checked via BOTH the exact-match path (isCorrect's own
  // normAns comparison) and the compound-parts fallback (normParts/partsMatch), since each had its
  // own independent copy of the same °²³ strip and both needed the fix.
  assert.equal(isCorrect('5.1 × 10', ['5.1 × 10²']), false);
  assert.equal(isCorrect('6.2 × 10', ['6.2 × 10³']), false);
  assert.equal(isCorrect('5.1 x 10^2', ['5.1 × 10²']), true);   // the correct exponent still marks right
  assert.equal(isCorrect('5 x 10^2', ['5.1 × 10²']), false);    // a genuinely wrong coefficient stays wrong
});
