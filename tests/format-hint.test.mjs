// tests/format-hint.test.mjs
//
// Covers tools/format-hint.mjs's formatHint()/parseLinearExpr() — the "Format: e.g. ..." hint
// shown next to an answer input. Every case here was found by generating a hint for EVERY real
// accept[] value across all 24 topic pages and eyeballing the output; several of these tests
// document bugs that were caught and fixed that way (see comments).

import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHint, parseLinearExpr } from '../tools/format-hint.mjs';

test('parseLinearExpr: basic shapes', () => {
  assert.deepEqual(parseLinearExpr('3n + 2'), { coeff: 3, cons: 2, letter: 'n', termCount: 2 });
  assert.deepEqual(parseLinearExpr('x + 8'), { coeff: 1, cons: 8, letter: 'x', termCount: 2 });
  assert.equal(parseLinearExpr('3x² + 2x'), null);   // degree-2: out of scope
  assert.equal(parseLinearExpr('(3, 4)'), null);       // coordinate, not an expression
});

test('never leaks the real answer: hint never equals the accept value', () => {
  const cases = ['3n + 2', 'x = 5', '2 : 3', '2/3', '(3, 4)', '$45', '45 km/h', '−10 m'];
  cases.forEach((c) => {
    const h = formatHint(c);
    if (h) assert.notEqual(h.toLowerCase(), c.toLowerCase(), c);
  });
});

test('single-value shapes', () => {
  assert.equal(formatHint('3n + 2'), '4n + 1');
  assert.equal(formatHint('−3x + 12'), '−4x + 1');
  assert.equal(formatHint('x = 5'), 'x = 7');
  assert.equal(formatHint('2 : 3'), '5 : 2');
  assert.equal(formatHint('2/3'), '3/4');
  assert.equal(formatHint('1 5/12'), '2 1/3');
  assert.equal(formatHint('(3, 4)'), '(1, 2)');
  assert.equal(formatHint('(−3, 5)'), '(1, 2)');
  assert.equal(formatHint('$45'), '$12');
  assert.equal(formatHint('45 km/h'), '12 km/h');
  assert.equal(formatHint('15cm'), '12cm');       // no space in original -> none in hint
  assert.equal(formatHint('16th'), '12th');        // ordinal suffix, no space
  assert.equal(formatHint('SA = 96 cm²'), 'SA = 7'); // short multi-letter label
});

test('bare plain numbers and word answers get no hint (generic placeholder is enough)', () => {
  assert.equal(formatHint('20'), null);
  assert.equal(formatHint('equilateral'), null);
  assert.equal(formatHint('yes'), null);
});

test('regression: single letters and unit-suffixed values are never mistaken for algebra', () => {
  // "B" (a statistics "which is more spread out, A or B" answer) and "−10 m" (a depth in metres)
  // both parsed as a valid 1-term linear expression before termCount>=2 was required, producing a
  // nonsensical "4b + 1" / "−4m + 1" hint for an answer that isn't algebra at all.
  assert.equal(formatHint('B'), null);
  assert.equal(formatHint('−10 m'), '12 m');
});

test('compound answers: "and"/";"/"," all recognised as separators', () => {
  assert.equal(formatHint('3n + 2 and 32'), '4n + 1 and 9');
  assert.equal(formatHint('P = 16 cm, A = 16 cm²'), 'P = 7 and A = 7');
  assert.equal(formatHint('30 km/h; 3 h 20 min'), null); // neither side hints (see below), skipped
});

test('regression: a coordinate pair\'s internal comma must not be split as a compound', () => {
  assert.equal(formatHint('(3, 4)'), '(1, 2)');
  assert.equal(formatHint('(−3, 5)'), '(1, 2)');
});

test('all-bare-number compounds get no hint (no ambiguity beyond the separator)', () => {
  assert.equal(formatHint('18 and 27'), null);
  assert.equal(formatHint('9 and −9'), null);
});

test('regression: "label number" compounds (statistics mode/range, mean/median) now hint correctly', () => {
  // 18 statistics answers ("mode 7, range 5", "mean 6, median 6") previously got no hint at all,
  // even though the marking engine's own normParts strips the word labels as filler -- "7, 5" marks
  // identical to "mode 7, range 5" -- so a learner had no way to know the label was optional.
  assert.equal(formatHint('mode 7, range 5'), 'mode 12 and range 9');
  assert.equal(formatHint('mean 6, median 6'), 'mean 12 and median 9');
  // A bare word with no trailing number (the answer itself, e.g. "mode"/"median" alone) must still
  // get no hint -- there's no numeric ambiguity to clarify.
  assert.equal(formatHint('mode'), null);
  assert.equal(formatHint('median'), null);
});

test('regression: a compound with one hintable and one bare-number part fills the number distinctly', () => {
  // Previously both currency parts rendered the SAME fixed placeholder ("$12 and $12"), visually
  // implying the two real values were equal.
  assert.equal(formatHint('$15 and $25'), '$12 and $9');
});

test('regression: a compound word part is never replaced by a misleading bare number', () => {
  // "10 factors, not prime": the numeric part hints fine ("12 factors"), but "not prime" is a
  // genuine word answer — substituting a number for it would misrepresent the answer's TYPE, not
  // just its magnitude, so the whole hint is suppressed rather than showing "12 factors and 9".
  assert.equal(formatHint('10 factors, not prime'), null);
});

test('degree-2 expressions get no hint (matches marking\'s exact-match-only scope)', () => {
  assert.equal(formatHint('3x² + 2x'), null);
});
