// tests/quiz-tile-spec.test.mjs
//
// Dynamic-topic counterpart to tests/tile-spec-shapes.test.mjs: the 6 seeded-generator topics
// (graphs, angles, shapes, transformations, pythagoras, circles) build their own tile specs at
// RUNTIME inside js/quiz-engine.js (deriveDynamicTileSpec for coordinates, choiceTileSpec for
// classification/yes-no answers wired via e.tileChoices — see quiz-engine.js's own header comment
// for why these can't share tools/tile-spec.mjs directly). This sweeps many seeds so every branch
// of every GEN[topic][level] generator gets exercised at least once, then — exactly like the static
// sweep — verifies (1) the correct tile combination reproduces the accept string and marks correct,
// and (2) swapping in a decoy marks wrong.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTopicEngine, loadQuizEngine, loadTileBuilder, mountTileSpec, mulberry32 } from './helpers.mjs';

const TileBuilder = loadTileBuilder();
const { isCorrect } = loadTopicEngine();
const QuizEngine = loadQuizEngine();
const { GEN, deriveDynamicTileSpec, choiceTileSpec } = QuizEngine;

const LEVELS = ['easy', 'medium', 'hard'];
const SEEDS = Array.from({ length: 60 }, (_, i) => i * 97 + 1);

// Same brute-force approach as tests/tile-spec-shapes.test.mjs's findCorrectPlacement — small search
// space (a handful of decoy tiles per slot), used to find "the correct combination" independent of
// tile array order.
function findCorrectPlacement(spec, target) {
  function assembleByIndex(valsByIndex) {
    const vals = {};
    spec.slots.forEach((s, i) => { vals[s.id] = valsByIndex[i]; });
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

// Every {topic, level, seedIdx, accept, spec} across many seeds where the runtime rendering logic
// (mirrored here from quiz-engine.js's renderDynamicTopic) would produce a tile spec.
function collectTileWorthyItems() {
  const items = [];
  Object.keys(GEN).forEach((topicId) => {
    LEVELS.forEach((level) => {
      const fn = GEN[topicId][level];
      if (!fn) return;
      SEEDS.forEach((seed) => {
        const rng = mulberry32(seed);
        let e = null, guard = 0;
        while (!e && guard++ < 20) e = fn(rng);
        if (!e || !e.accept) return;
        const spec = e.tileChoices
          ? choiceTileSpec(e.accept[0], e.tileChoices.filter((c) => c !== e.accept[0]))
          : deriveDynamicTileSpec(e.accept[0]);
        if (spec) items.push({ topic: topicId, level, seed, accept: e.accept, spec, isChoice: !!e.tileChoices });
      });
    });
  });
  return items;
}

test('dynamic topics: tile-worthy items exist for both coordinate and choice shapes', () => {
  const items = collectTileWorthyItems();
  assert.ok(items.length > 20, `expected many tile-worthy dynamic items, found ${items.length}`);
  assert.ok(items.some((i) => i.isChoice), 'expected at least one choice-shape item (classification/yes-no)');
  assert.ok(items.some((i) => !i.isChoice), 'expected at least one coordinate-shape item');
  assert.ok(items.some((i) => i.topic === 'shapes' && i.isChoice), 'expected a shapes triangle-classification item');
  assert.ok(items.some((i) => i.topic === 'pythagoras' && i.isChoice), 'expected a pythagoras converse yes/no item');
  assert.ok(items.some((i) => i.topic === 'graphs' && !i.isChoice), 'expected a graphs coordinate item');
  assert.ok(items.some((i) => i.topic === 'transformations' && !i.isChoice), 'expected a transformations coordinate item');
});

test('dynamic topics: the correct tile placement assembles the accept string and marks correct', () => {
  const items = collectTileWorthyItems();
  items.forEach(({ topic, level, seed, accept, spec }) => {
    const correct = findCorrectPlacement(spec, accept[0]);
    assert.ok(correct, `${topic}/${level}/seed${seed}: no tile combination reproduces accept ${JSON.stringify(accept[0])}`);
    const ctx = mountTileSpec(TileBuilder, spec);
    ctx.placeAll(correct);
    assert.equal(ctx.input.value, accept[0], `${topic}/${level}/seed${seed}`);
    assert.equal(isCorrect(ctx.input.value, accept), true, `${topic}/${level}/seed${seed}: correct placement should mark correct`);
  });
});

test('dynamic topics: swapping one slot to a decoy marks wrong', () => {
  const items = collectTileWorthyItems();
  let checked = 0;
  items.forEach(({ topic, level, seed, accept, spec }) => {
    const correct = findCorrectPlacement(spec, accept[0]);
    if (!correct) return; // already asserted above
    for (let i = 0; i < spec.slots.length; i++) {
      const kind = spec.slots[i].kind;
      const decoy = spec.tiles.find((t) => t.kind === kind && t.value !== correct[i]);
      if (!decoy) continue; // a slot with only one possible tile has no decoy to test
      const wrong = correct.slice();
      wrong[i] = decoy.value;
      const ctx = mountTileSpec(TileBuilder, spec);
      ctx.placeAll(wrong);
      checked++;
      if (ctx.input.value === accept[0]) continue; // a decoy that happens to reassemble the same string isn't a real "wrong" case
      assert.equal(isCorrect(ctx.input.value, accept), false, `${topic}/${level}/seed${seed} slot ${i}: substituting decoy "${decoy.value}" (got ${JSON.stringify(ctx.input.value)}) should mark wrong`);
    }
  });
  assert.ok(checked > 20, `expected to check well over 20 decoy substitutions, checked ${checked}`);
});
