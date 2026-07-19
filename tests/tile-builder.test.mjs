// tests/tile-builder.test.mjs
//
// Exercises the REAL js/tile-builder.js (via the shared DOM shim + mountTileSpec() helper in
// helpers.mjs) with genuine click sequences, then feeds the assembled string into the REAL marking
// engine — closing the loop from "tiles clicked" to "graded correct/wrong" exactly as it works on
// the live page. Slots are addressed by POSITION (index into spec.slots), not a fixed kind literal
// — tools/tile-spec.mjs generates a unique kind string per slot, so tests can't hardcode 'coeff' /
// 'sign' etc. the way the original patterns-only pilot could.
//
// No real browser was available to drive this pilot visually — see the final report for that
// limitation. This is the most rigorous verification available without one, and it did catch real
// bugs before ship: a shim gap aside, the swap-in-one-click interaction bug in tile-builder.js
// itself (clicking an already-filled slot while a different tile was selected silently unplaced
// instead of swapping), the parseFloat-truncation marking bug (see marking.test.mjs), and a
// coefficient-tile-pool bug in tile-spec.mjs that left a negative-coefficient slot with no valid
// tile at all (Expressions' "−3x + 12" family) — all fixed as a direct result of writing these tests.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTopicEngine, loadTileBuilder, mountTileSpec } from './helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TileBuilder = loadTileBuilder();
const { isCorrect } = loadTopicEngine();
const html = fs.readFileSync(path.join(ROOT, 'topics', 'patterns.html'), 'utf-8');
const acceptMap = JSON.parse(html.match(/window\.TOPIC_CHECK=Object\.assign\(window\.TOPIC_CHECK\|\|\{\}, (\{.*?\})\);/s)[1]);

function getSpec(key) {
  const re = new RegExp(`data-key="${key.replace(/\|/g, '\\|')}"[\\s\\S]*?data-spec='([^']*)'`);
  return JSON.parse(html.match(re)[1]);
}

test('placing the correct tiles assembles the exact accept string and marks correct (all 10 items)', () => {
  for (let idx = 0; idx < 10; idx++) {
    const key = `patterns|medium|${idx}`;
    const accept = acceptMap[key];
    const spec = getSpec(key);
    // Patterns' coefficients are always 2-7 (never 1), so all 4 slots (coeff, sign, const, term)
    // are always present, in that order — see tools/tile-spec.mjs's linearExprPart.
    const m = accept[0].match(/(-?\d+)n\s*([+−-])\s*(\d+)\s+and\s+(\d+)/);
    const [, coeff, sign, cons, term] = m;
    const ctx = mountTileSpec(TileBuilder, spec);
    ctx.placeAll([coeff, sign === '-' ? '−' : sign, cons, term]);
    assert.equal(ctx.input.value, accept[0], key);
    assert.equal(isCorrect(ctx.input.value, accept), true, key);
  }
});

test('a wrong-sign tile combination assembles a genuinely different string and marks wrong (all 10 items)', () => {
  for (let idx = 0; idx < 10; idx++) {
    const key = `patterns|medium|${idx}`;
    const accept = acceptMap[key];
    const spec = getSpec(key);
    const m = accept[0].match(/(-?\d+)n\s*([+−-])\s*(\d+)\s+and\s+(\d+)/);
    const [, coeff, sign, cons, term] = m;
    const wrongSign = (sign === '+') ? '−' : '+';
    const ctx = mountTileSpec(TileBuilder, spec);
    ctx.placeAll([coeff, wrongSign, cons, term]);
    assert.notEqual(ctx.input.value, accept[0], key);
    assert.equal(isCorrect(ctx.input.value, accept), false, key);
  }
});

test('input stays empty until every slot is filled', () => {
  const spec = getSpec('patterns|medium|0');
  const ctx = mountTileSpec(TileBuilder, spec);
  ctx.placeAt(0, '3'); // coeff only — 3 slots still empty
  assert.equal(ctx.input.value, '');
});

test('tapping a filled slot with nothing selected removes that tile (undo) and returns it to the pool', () => {
  const spec = getSpec('patterns|medium|0');
  const ctx = mountTileSpec(TileBuilder, spec);
  ctx.placeAll(['3', '+', '2', '32']);
  assert.equal(ctx.input.value, '3n + 2 and 32');
  const termSlotId = spec.slots[3].id;
  ctx.slotEls[termSlotId].click(); // tap the filled term slot -> undo
  assert.equal(ctx.input.value, '');
  const termTile = ctx.pool.children.find((t) => t.innerHTML === '32' && t.dataset.kind === spec.slots[3].kind);
  assert.equal(termTile.classList.contains('tb-placed'), false);
});

test('regression: selecting a new tile and clicking an already-filled slot swaps it in one click', () => {
  const spec = getSpec('patterns|medium|0');
  const ctx = mountTileSpec(TileBuilder, spec);
  ctx.placeAll(['3', '+', '2', '32']);
  assert.equal(ctx.input.value, '3n + 2 and 32');
  const coeffKind = spec.slots[0].kind, coeffSlotId = spec.slots[0].id;
  const fourTile = ctx.pool.children.find((t) => t.innerHTML === '4' && t.dataset.kind === coeffKind);
  fourTile.click();                    // select the "4" tile
  ctx.slotEls[coeffSlotId].click();    // click the ALREADY-FILLED coeff slot (currently holds "3")
  assert.equal(ctx.input.value, '4n + 2 and 32', 'one click should swap 3 -> 4, not just unplace 3');
  const threeTile = ctx.pool.children.find((t) => t.innerHTML === '3' && t.dataset.kind === coeffKind);
  assert.equal(threeTile.classList.contains('tb-placed'), false, 'the displaced tile returns to the pool');
});
