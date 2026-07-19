// tests/tile-spec-shapes.test.mjs
//
// A generic, shape-agnostic sweep: for EVERY real static accept value across all 24 topics that
// deriveTileSpec() recognises, (1) verify the objectively-correct tile combination assembles the
// exact accept string and marks correct, and (2) verify substituting a single decoy tile in each
// slot produces a DIFFERENT assembled string that marks wrong. This doesn't need shape-specific
// "what counts as wrong" logic — any decoy substitution is wrong by construction (deriveTileSpec
// always puts the real value first in each slot's tile pool; every other tile is a decoy).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTopicEngine, loadTileBuilder, mountTileSpec } from './helpers.mjs';
import { deriveTileSpec } from '../tools/tile-spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TileBuilder = loadTileBuilder();
const { isCorrect } = loadTopicEngine();

// Every {topic, key, accept} across all 24 static topics whose accept[0] gets a tile spec.
function collectTileWorthyItems() {
  const items = [];
  const files = fs.readdirSync(path.join(ROOT, 'topics')).filter((f) => f.endsWith('.html'));
  files.forEach((f) => {
    const h = fs.readFileSync(path.join(ROOT, 'topics', f), 'utf-8');
    const m = h.match(/window\.TOPIC_CHECK=Object\.assign\(window\.TOPIC_CHECK\|\|\{\}, (\{.*?\})\);/s);
    if (!m) return;
    const obj = JSON.parse(m[1]);
    Object.keys(obj).forEach((k) => {
      const accept = obj[k];
      const spec = deriveTileSpec(accept[0]);
      if (spec) items.push({ topic: f.replace('.html', ''), key: k, accept, spec });
    });
  });
  return items;
}

// Brute-force finds which combination of tile VALUES (one per slot, by position) reproduces the
// target string exactly — small search space (a handful of tiles per slot), used to determine
// "the correct placement" independent of tile array order.
function findCorrectPlacement(spec, target) {
  function assembleByIndex(valsByIndex) {
    const vals = {}; spec.slots.forEach((s, i) => { vals[s.id] = valsByIndex[i]; });
    return spec.template.map((p) => (p.text !== undefined ? p.text : vals[p.slot])).join('');
  }
  function backtrack(i, chosen) {
    if (i === spec.slots.length) return assembleByIndex(chosen) === target ? chosen.slice() : null;
    const kind = spec.slots[i].kind;
    for (const o of spec.tiles.filter((t) => t.kind === kind)) {
      chosen[i] = o.value;
      const result = backtrack(i + 1, chosen);
      if (result) return result;
    }
    return null;
  }
  return backtrack(0, []);
}

// deriveTileSpec always assembles a linear expression in canonical "coeff·letter [sign] const"
// order. One single item site-wide is authored the other way round ("8 + 6n" instead of "6n + 8"),
// so no tile combination reproduces it character-for-character — but the marking engine's own
// algebraic-equivalence (see marking.test.mjs) treats "6n + 8" and "8 + 6n" as the same answer, so
// this is a cosmetic canonicalisation, not a grading bug. Verified directly, tracked here so a
// second such item would still be caught as a real failure rather than silently ignored.
const KNOWN_REORDERED_EQUIVALENTS = new Set(['expressions expressions|medium|9']);

test('every tile-worthy static item: the correct placement assembles the accept string and marks correct', () => {
  const items = collectTileWorthyItems();
  assert.ok(items.length > 50, `expected many tile-worthy items, found ${items.length}`);
  items.forEach(({ topic, key, accept, spec }) => {
    const correct = findCorrectPlacement(spec, accept[0]);
    if (!correct && KNOWN_REORDERED_EQUIVALENTS.has(`${topic} ${key}`)) {
      // No literal-match combo exists (the spec always assembles coeff-first canonical order).
      // Re-derive that canonical string directly from the same accept value and confirm THAT
      // combination marks correct via the algebraic-equivalence engine — what actually matters.
      const m = accept[0].match(/(-?\d+)\s*\+\s*(\d+)([a-z])/i); // "8 + 6n" -> const=8, coeff=6, letter=n
      assert.ok(m, `${topic} ${key}: expected a "const + coeff·letter" shape to canonicalise`);
      const canonical = `${m[2]}${m[3]} + ${m[1]}`; // "6n + 8"
      const canonicalCombo = findCorrectPlacement(spec, canonical);
      assert.ok(canonicalCombo, `${topic} ${key}: canonical form ${JSON.stringify(canonical)} should be reproducible`);
      const ctx = mountTileSpec(TileBuilder, spec);
      ctx.placeAll(canonicalCombo);
      assert.equal(ctx.input.value, canonical, `${topic} ${key}`);
      assert.equal(isCorrect(ctx.input.value, accept), true, `${topic} ${key}: reordered-but-equivalent assembly should still mark correct`);
      return;
    }
    assert.ok(correct, `${topic} ${key}: no tile combination reproduces accept ${JSON.stringify(accept[0])}`);
    const ctx = mountTileSpec(TileBuilder, spec);
    ctx.placeAll(correct);
    assert.equal(ctx.input.value, accept[0], `${topic} ${key}`);
    assert.equal(isCorrect(ctx.input.value, accept), true, `${topic} ${key}: correct placement should mark correct`);
  });
});

test('every tile-worthy static item: swapping one slot to a decoy marks wrong', () => {
  const items = collectTileWorthyItems();
  let checked = 0;
  items.forEach(({ topic, key, accept, spec }) => {
    const correct = findCorrectPlacement(spec, accept[0]);
    if (!correct) return; // already asserted above; skip here to avoid double-failure noise
    for (let i = 0; i < spec.slots.length; i++) {
      const kind = spec.slots[i].kind;
      const decoy = spec.tiles.find((t) => t.kind === kind && t.value !== correct[i]);
      if (!decoy) continue; // a slot with only one possible tile has no decoy to test
      const wrong = correct.slice(); wrong[i] = decoy.value;
      const ctx = mountTileSpec(TileBuilder, spec);
      ctx.placeAll(wrong);
      checked++;
      if (ctx.input.value === accept[0]) continue; // a decoy that HAPPENS to reassemble the same string (rare) isn't a real "wrong" case
      assert.equal(isCorrect(ctx.input.value, accept), false, `${topic} ${key} slot ${i}: substituting decoy "${decoy.value}" (got ${JSON.stringify(ctx.input.value)}) should mark wrong`);
    }
  });
  assert.ok(checked > 100, `expected to check well over 100 decoy substitutions, checked ${checked}`);
});
