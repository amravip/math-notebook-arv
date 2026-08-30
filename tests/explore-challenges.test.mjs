// tests/explore-challenges.test.mjs
//
// The Explore challenges are the only place in the book where a learner is given a goal and told
// whether they hit it, so two things have to hold that no page render would reveal:
//
//   * every challenge must be reachable from the widget it sits on, and
//   * none may already be satisfied by the state the widget opens in — a goal that arrives
//     pre-ticked is worse than no goal. Five were, when they were first written.
//
// Both are checked by brute force over the real widget: every slider position for a slider widget,
// every placement of every card for a sort. The DOM tests below drive the real buildChallenge()
// against a stub ProgressStore, because the award-once rule (a challenge cannot be farmed by
// wiggling a slider) lives in that function.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExplore, makeStoreStub, mountChallenge, mountSort, sliderCombos, sliderDefaults } from './helpers.mjs';

const Explore = loadExplore(null);
const { EXPLORES, CHALLENGES } = Explore;

// Every way the cards of a sort widget can be arranged: each card either stays in the tray or goes
// into one of the buckets. This is the same summary object buildSort() hands the challenge.
function sortStates(spec) {
  const n = spec.cards.length;
  const slots = spec.buckets.length + 1; // +1 for "still in the tray"
  const out = [];
  const walk = (i, placement) => {
    if (i === n) {
      const buckets = spec.buckets.map(() => 0);
      const correctIn = spec.buckets.map(() => 0);
      let placed = 0, correct = 0;
      placement.forEach((bi, cardIdx) => {
        if (bi < 0) return;
        placed++;
        buckets[bi]++;
        if (spec.cards[cardIdx].b === bi) { correct++; correctIn[bi]++; }
      });
      out.push({ total: n, placed, correct, wrong: placed - correct, buckets, correctIn });
      return;
    }
    for (let bi = -1; bi < slots - 1; bi++) walk(i + 1, placement.concat([bi]));
  };
  walk(0, []);
  return out;
}

// The state a sort widget opens in: nothing placed.
function emptyBoard(spec) {
  return {
    total: spec.cards.length, placed: 0, correct: 0, wrong: 0,
    buckets: spec.buckets.map(() => 0), correctIn: spec.buckets.map(() => 0),
  };
}

const statesFor = (spec) => (spec.kind === 'sort' ? sortStates(spec) : sliderCombos(spec));
const openingStateFor = (spec) => (spec.kind === 'sort' ? emptyBoard(spec) : sliderDefaults(spec));

test('every chapter widget carries at least one challenge', () => {
  const missing = Object.keys(EXPLORES).filter((id) => !CHALLENGES[id] || !CHALLENGES[id].length);
  assert.deepEqual(missing, [], 'widgets with nothing to aim at');
});

test('every challenge belongs to a widget that exists', () => {
  for (const id of Object.keys(CHALLENGES)) {
    assert.ok(EXPLORES[id], `${id} has challenges but no widget`);
  }
});

test('every challenge is reachable from the widget it sits on', () => {
  for (const [topic, list] of Object.entries(CHALLENGES)) {
    const states = statesFor(EXPLORES[topic]);
    list.forEach((ch, i) => {
      const hits = states.filter((v) => {
        try { return !!ch.ok(v); } catch { return false; }
      });
      assert.ok(hits.length > 0, `${topic} #${i + 1} cannot be solved from any state of its widget`);
    });
  }
});

test('no challenge is already solved by the state the widget opens in', () => {
  for (const [topic, list] of Object.entries(CHALLENGES)) {
    const opening = openingStateFor(EXPLORES[topic]);
    list.forEach((ch, i) => {
      let solved = false;
      try { solved = !!ch.ok(opening); } catch { solved = false; }
      assert.equal(solved, false, `${topic} #${i + 1} arrives already solved`);
    });
  }
});

test('sort challenges only index buckets their widget actually has', () => {
  for (const [topic, list] of Object.entries(CHALLENGES)) {
    const spec = EXPLORES[topic];
    if (spec.kind !== 'sort') continue;
    // A challenge reading buckets[3] of a three-bucket widget would silently compare undefined and
    // never fire; running it over well-formed states proves the indices line up.
    const states = sortStates(spec);
    list.forEach((ch, i) => {
      assert.doesNotThrow(() => states.forEach((s) => ch.ok(s)), `${topic} #${i + 1} throws on a valid board`);
    });
  }
});

test('challenge prompts are non-empty and reasonably short', () => {
  for (const [topic, list] of Object.entries(CHALLENGES)) {
    list.forEach((ch, i) => {
      const plain = ch.ask.replace(/<[^>]+>/g, '');
      assert.ok(plain.length > 15, `${topic} #${i + 1} has no real prompt`);
      assert.ok(plain.length < 200, `${topic} #${i + 1} prompt is too long to read above the widget`);
      assert.equal(typeof ch.ok, 'function', `${topic} #${i + 1} has no check`);
    });
  }
});

// ---------------------------------------------------------------------------
// The card itself
// ---------------------------------------------------------------------------

// A known-good and known-bad setting for the first circles challenge (area = circumference at r = 2).
const solveCircles = { r: 2 };
const missCircles = { r: 5 };

test('the card starts unsolved and solves when the goal is met', () => {
  const store = makeStoreStub();
  const c = mountChallenge(loadExplore(store), 'circles', store);

  assert.equal(c.solved, false);
  assert.match(c.tag, /Challenge 1 of 2/);

  c.check(missCircles);
  assert.equal(c.solved, false, 'a wrong setting must not mark the card solved');

  c.check(solveCircles);
  assert.equal(c.solved, true);
  assert.match(c.status, /Solved/);
  assert.equal(store.xp, 3, 'solving awards XP once');
  assert.equal(store.getFlag('explore|circles|0'), true, 'solving is remembered');
});

test('a solved challenge cannot be farmed by moving the slider back and forth', () => {
  const store = makeStoreStub();
  const c = mountChallenge(loadExplore(store), 'circles', store);

  c.check(solveCircles);
  assert.equal(store.xp, 3);

  c.check(missCircles);
  c.check(solveCircles);
  c.check(missCircles);
  c.check(solveCircles);
  assert.equal(store.xp, 3, 'XP is awarded for the first solve only');
});

test('Next advances to the following challenge, which starts unsolved', () => {
  const store = makeStoreStub();
  const c = mountChallenge(loadExplore(store), 'circles', store);

  c.check(solveCircles);
  assert.equal(c.nextHidden, false, 'Next appears once there is somewhere to go');

  c.clickNext();
  assert.match(c.tag, /Challenge 2 of 2/);
  assert.equal(c.solved, false, 'the next challenge starts fresh');

  // Circles #2 wants a circumference over 50, which needs r >= 8.
  c.check({ r: 5 });
  assert.equal(c.solved, false);
  c.check({ r: 8 });
  assert.equal(c.solved, true);
  assert.equal(store.xp, 6);
  assert.equal(c.nextHidden, true, 'there is nothing after the last challenge');
});

test('a returning reader resumes at the first unsolved challenge', () => {
  const store = makeStoreStub();
  store.setFlag('explore|circles|0', true);
  const c = mountChallenge(loadExplore(store), 'circles', store);

  assert.match(c.tag, /Challenge 2 of 2/, 'the solved one is skipped');
  assert.equal(c.solved, false);
});

test('an already-solved challenge is shown as solved, not re-awarded', () => {
  const store = makeStoreStub();
  store.setFlag('explore|circles|0', true);
  store.setFlag('explore|circles|1', true);
  const c = mountChallenge(loadExplore(store), 'circles', store);

  assert.equal(c.solved, true);
  assert.match(c.status, /solved/i);

  c.check({ r: 8 });
  assert.equal(store.xp, 0, 'a challenge solved on an earlier visit pays nothing now');
});

test('a card-sort challenge solves on a correct board and not on a wrong one', () => {
  const store = makeStoreStub();
  const spec = EXPLORES.factors;
  const c = mountChallenge(loadExplore(store), 'factors', store);

  // Everything placed, two of them in the wrong group.
  const wrong = { total: 8, placed: 8, correct: 6, wrong: 2, buckets: [4, 4], correctIn: [3, 3] };
  c.check(wrong);
  assert.equal(c.solved, false);
  assert.equal(store.xp, 0);

  // A fully correct board, built the same way buildSort() builds it.
  const right = sortStates(spec).find((s) => s.correct === s.total);
  c.check(right);
  assert.equal(c.solved, true);
  assert.equal(store.xp, 3);

  // The second goal is a partial sort: only the Prime bucket filled, and correctly.
  c.clickNext();
  assert.equal(c.solved, false);
  c.check(right);
  assert.equal(c.solved, false, 'a full board does not satisfy the fill-one-group goal');
  const partial = sortStates(spec).find((s) => s.placed === 4 && s.buckets[0] === 4 && s.correctIn[0] === 4);
  c.check(partial);
  assert.equal(c.solved, true);
  assert.equal(store.xp, 6);
});

// The summary a sort challenge is judged on is assembled inside buildSort's Check handler, from the
// same walk that scores the sort. These drive the real widget — placing real cards, pressing the
// real button — so the two can't drift apart.

test('the real card sort feeds its challenge a correct summary', () => {
  const store = makeStoreStub();
  const Ex = loadExplore(store);
  const spec = Ex.EXPLORES.factors;
  const w = mountSort(Ex, 'factors');

  assert.equal(w.solved, false);
  assert.match(w.tag, /Challenge 1 of 2/);

  // Put every card where it belongs.
  spec.cards.forEach((c) => w.place(c.t, c.b));
  w.check();

  assert.match(w.result, /8 \/ 8 correct/);
  assert.equal(w.solved, true, 'a fully correct board solves the first challenge');
  assert.equal(store.xp, 3);
});

test('a wrong placement is scored wrong and leaves the challenge unsolved', () => {
  const store = makeStoreStub();
  const Ex = loadExplore(store);
  const spec = Ex.EXPLORES.factors;
  const w = mountSort(Ex, 'factors');

  // Everything correct except one prime dropped into Composite.
  const firstPrime = spec.cards.find((c) => c.b === 0);
  spec.cards.forEach((c) => w.place(c.t, c === firstPrime ? 1 : c.b));
  w.check();

  assert.match(w.result, /7 \/ 8 correct/);
  assert.equal(w.solved, false);
  assert.equal(store.xp, 0);
});

test('the fill-one-group challenge reads the per-bucket counts, not just the total', () => {
  const store = makeStoreStub();
  store.setFlag('explore|factors|0', true);          // start on the second goal
  const Ex = loadExplore(store);
  const spec = Ex.EXPLORES.factors;
  const w = mountSort(Ex, 'factors');
  assert.match(w.tag, /Challenge 2 of 2/);

  // A fully correct board is not what this one asks for.
  spec.cards.forEach((c) => w.place(c.t, c.b));
  w.check();
  assert.equal(w.solved, false, 'every card placed does not satisfy "fill only the Prime group"');

  // Send the composites back to the tray, leaving only the four primes placed.
  spec.cards.filter((c) => c.b !== 0).forEach((c) => w.sendBack(c.t));
  w.check();
  assert.equal(w.solved, true);
  assert.equal(store.xp, 3);
});

test('a challenge whose check throws does not break the widget', () => {
  const store = makeStoreStub();
  const Ex = loadExplore(store);
  Ex.CHALLENGES.__broken = [{ ask: 'This one is deliberately broken for the test.', ok: () => { throw new Error('boom'); } }];
  const c = mountChallenge(Ex, '__broken', store);

  assert.doesNotThrow(() => c.check({ r: 2 }));
  assert.equal(c.solved, false);
  assert.equal(store.xp, 0);
});

test('a widget id with no challenges mounts nothing at all', () => {
  const store = makeStoreStub();
  const Ex = loadExplore(store);
  const host = { children: [], appendChild(c) { this.children.push(c); return c; } };
  assert.equal(Ex.buildChallenge(host, 'no-such-topic'), null);
  assert.equal(host.children.length, 0);
});

test('challenges still work when there is no ProgressStore to remember them', () => {
  const Ex = loadExplore(null);
  const host = { children: [], appendChild(c) { this.children.push(c); return c; } };
  const check = Ex.buildChallenge(host, 'circles');
  assert.doesNotThrow(() => check(solveCircles));
  assert.equal(host.children[0].classList.contains('solved'), true);
});
