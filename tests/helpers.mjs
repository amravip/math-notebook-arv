// tests/helpers.mjs
//
// Loads the REAL browser runtime files (js/topic-interactions.js, js/quiz-engine.js) into a
// node:vm sandbox and returns their public API, so tests exercise exactly what ships to the
// browser rather than a re-implementation that could silently drift from the real logic.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// topic-interactions.js's IIFE bails immediately (`if (!topicId) return;`) unless
// window.CURRENT_TOPIC_ID is truthy, and calls document.addEventListener('DOMContentLoaded', ...)
// at the end to register (not run) its click/keydown handlers — a no-op stub is enough since that
// callback never fires in this sandbox. window.ProgressStore is only dereferenced inside that
// unfired callback, so an empty stub is sufficient here too.
export function loadTopicEngine() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'topic-interactions.js'), 'utf-8');
  const sandbox = {
    window: { CURRENT_TOPIC_ID: 'test-topic', ProgressStore: {}, TOPIC_CHECK: {} },
    document: { addEventListener() {}, querySelectorAll: () => [], querySelector: () => null },
    localStorage: { getItem: () => null },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/topic-interactions.js' });
  if (!sandbox.window.TopicEngine) throw new Error('topic-interactions.js did not expose window.TopicEngine — sandbox stub mismatch?');
  return sandbox.window.TopicEngine;
}

// quiz-engine.js's IIFE runs unconditionally and assigns window.QuizEngine (GEN, formatHint, etc.)
// with no early-return guard, so a bare document/window stub is enough.
export function loadQuizEngine() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'quiz-engine.js'), 'utf-8');
  const sandbox = {
    window: {},
    document: { getElementById: () => null, addEventListener() {} },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/quiz-engine.js' });
  if (!sandbox.window.QuizEngine) throw new Error('quiz-engine.js did not expose window.QuizEngine — sandbox stub mismatch?');
  return sandbox.window.QuizEngine;
}

// Mulberry32 PRNG, verbatim copy of quiz-engine.js's own generator (used by tests that need to
// drive GEN.<topic>.<tier>(r) directly with a reproducible seed).
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stripTags(html) { return String(html).replace(/<[^>]+>/g, ''); }

// --- Minimal (but real, not stubbed) DOM shim for driving js/tile-builder.js ---
// Real classList/className sync, real parent-child appendChild/remove, real addEventListener/
// dispatchEvent — enough to simulate genuine click sequences against the actual shipped widget
// code, not a re-implementation of its logic. Shared across every tile-spec-shape test.
function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach((x) => set.add(x)),
    remove: (...c) => c.forEach((x) => set.delete(x)),
    toggle: (c, force) => { if (force === undefined) { set.has(c) ? set.delete(c) : set.add(c); } else if (force) set.add(c); else set.delete(c); },
    contains: (c) => set.has(c),
    get _set() { return set; },
  };
}
function makeNode(tag) {
  const listeners = {};
  const node = {
    tagName: (tag || 'div').toUpperCase(), children: [], parentNode: null, dataset: {}, style: {},
    disabled: false, hidden: false, _text: '', _html: '', type: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); this.children = []; },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = v; },
    classList: null,
    appendChild(child) { if (child.parentNode) child.parentNode.remove.call(child); child.parentNode = this; this.children.push(child); return child; },
    remove() { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); if (i >= 0) this.parentNode.children.splice(i, 1); this.parentNode = null; } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    dispatchEvent(e) { (listeners[e.type] || []).forEach((f) => f(e)); return true; },
    click() { this.dispatchEvent({ type: 'click', target: this }); },
    setAttribute() {},
  };
  node.classList = makeClassList();
  Object.defineProperty(node, 'className', {
    get() { return [...this.classList._set].join(' '); },
    set(v) { this.classList._set.clear(); String(v).split(/\s+/).filter(Boolean).forEach((c) => this.classList._set.add(c)); },
  });
  return node;
}

export function loadTileBuilder() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tile-builder.js'), 'utf-8');
  const sandbox = { window: {}, document: { createElement: (t) => makeNode(t), addEventListener: () => {}, querySelectorAll: () => [] }, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/tile-builder.js' });
  if (!sandbox.window.TileBuilder) throw new Error('tile-builder.js did not expose window.TileBuilder — sandbox stub mismatch?');
  return sandbox.window.TileBuilder;
}

// Mounts a spec and returns a small context with helpers addressing slots by POSITION (index into
// spec.slots) rather than a fixed kind literal — the real kind strings are auto-generated/unique
// per spec (see tools/tile-spec.mjs), so tests can't hardcode them the way the original
// patterns-only pilot did.
export function mountTileSpec(TileBuilder, spec) {
  const host = makeNode('div'), input = makeNode('input');
  TileBuilder.mount(host, input, spec);
  const frame = host.children[0], pool = host.children[1];
  const slotEls = {};
  frame.children.forEach((c) => { if (c.dataset.slot) slotEls[c.dataset.slot] = c; });
  function placeAt(slotIndex, value) {
    const slot = spec.slots[slotIndex];
    const tile = pool.children.find((t) => t.dataset.kind === slot.kind && t.innerHTML === String(value));
    if (!tile) throw new Error(`tile not found: value=${value} kind=${slot.kind} (slot index ${slotIndex}, id ${slot.id})`);
    tile.click(); slotEls[slot.id].click();
  }
  function placeAll(values) { values.forEach((v, i) => placeAt(i, v)); }
  return { host, input, pool, slotEls, placeAt, placeAll };
}

// ---------------------------------------------------------------------------
// explore.js
// ---------------------------------------------------------------------------

// buildChallenge() writes its four elements into card.innerHTML and then queries them back by
// class. Rather than parse HTML, the stub hands out one node per selector and remembers it, so a
// test can read .ex-ch-status without the sandbox needing a DOM implementation.
function makeExploreNode(tag) {
  const node = makeNode(tag);
  const bySelector = {};
  node.offsetWidth = 0;

  // Only class selectors are used in explore.js, so that is all this understands.
  const matches = (n, sel) => sel.startsWith('.') && n.classList.contains(sel.slice(1));
  const walk = (n, sel, hits) => {
    n.children.forEach((c) => { if (matches(c, sel)) hits.push(c); walk(c, sel, hits); });
    return hits;
  };

  node.querySelectorAll = function (sel) { return walk(this, sel, []); };
  node.closest = function (sel) {
    let n = this;
    while (n) { if (matches(n, sel)) return n; n = n.parentNode; }
    return null;
  };
  Object.defineProperty(node, 'parentElement', { get() { return this.parentNode; } });

  // buildSort queries elements it appended, so a real search comes first. buildChallenge queries the
  // four elements it wrote into card.innerHTML, which this stub never parses — those fall back to a
  // remembered node per selector so a test can still read them back.
  node.querySelector = function (sel) {
    const found = walk(this, sel, [])[0];
    if (found) return found;
    if (!bySelector[sel]) bySelector[sel] = makeExploreNode('div');
    return bySelector[sel];
  };
  return node;
}

// explore.js's IIFE ends by registering a DOMContentLoaded handler (never fired here) and assigning
// window.Explore, which exists only for these tests. `store` stands in for window.ProgressStore.
export function loadExplore(store) {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'explore.js'), 'utf-8');
  const sandbox = {
    window: { ProgressStore: store || null },
    document: { createElement: (t) => makeExploreNode(t), addEventListener() {}, getElementById: () => null },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/explore.js' });
  if (!sandbox.window.Explore) throw new Error('explore.js did not expose window.Explore — sandbox stub mismatch?');
  return sandbox.window.Explore;
}

// A ProgressStore stub that records what the challenge card asked it to persist.
export function makeStoreStub() {
  const flags = {};
  return {
    xp: 0, flags,
    getFlag: (k) => !!flags[k],
    setFlag(k, on) { flags[k] = !!on; },
    addXp(n) { this.xp += n; return this.xp; },
  };
}

// Mounts one topic's challenge card and returns handles onto the bits a test needs to read.
export function mountChallenge(Explore, topicId, store) {
  const host = makeExploreNode('div');
  const check = Explore.buildChallenge(host, topicId);
  const card = host.children[0];
  return {
    host, card, check, store,
    get solved() { return card.classList.contains('solved'); },
    get tag() { return card.querySelector('.ex-ch-tag').innerHTML; },
    get ask() { return card.querySelector('.ex-ch-ask').innerHTML; },
    get status() { return card.querySelector('.ex-ch-status').innerHTML; },
    get nextHidden() { return card.querySelector('.ex-ch-next').hidden; },
    clickNext() { card.querySelector('.ex-ch-next').click(); },
  };
}

// Every slider position of every slider, as a flat list of value objects — used to prove a
// challenge is reachable at all, and that it is not already met by the widget's opening position.
export function sliderCombos(spec) {
  const axes = spec.sliders.map((s) => {
    const vals = [];
    for (let x = s.min; x <= s.max; x += s.step) vals.push(x);
    return { id: s.id, vals };
  });
  const out = [];
  const walk = (k, acc) => {
    if (k === axes.length) { out.push(acc); return; }
    for (const val of axes[k].vals) walk(k + 1, { ...acc, [axes[k].id]: val });
  };
  walk(0, {});
  return out;
}

export function sliderDefaults(spec) {
  const v = {};
  spec.sliders.forEach((s) => { v[s.id] = s.val; });
  return v;
}

// Mounts the real card-sort widget and returns handles for driving it: cards are addressed by their
// face text, because the widget shuffles them on every mount.
export function mountSort(Explore, topicId) {
  const spec = Explore.EXPLORES[topicId];
  const host = makeExploreNode('div');
  Explore.buildSort(host, spec, topicId);
  const card = host.children[0];
  const tray = host.children[1];
  const buckets = host.children[2];
  const actions = host.children[3];
  const bucketEls = buckets.children;
  const findCard = (text) => tray.querySelectorAll('.sort-card').concat(
    bucketEls.flatMap((b) => b.querySelectorAll('.sort-card'))
  ).find((c) => c.innerHTML === text);
  return {
    host, card, tray, buckets, actions,
    place(text, bucketIndex) {
      const el = findCard(text);
      if (!el) throw new Error('no card with face ' + text);
      el.click();                       // select
      bucketEls[bucketIndex].dispatchEvent({ type: 'click', target: bucketEls[bucketIndex] });
    },
    check() { actions.children[0].click(); },
    sendBack(text) {
      const el = findCard(text);
      if (!el) throw new Error('no card with face ' + text);
      el.click();
    },
    get result() { return actions.children[1].innerHTML || actions.children[1].textContent; },
    get solved() { return card.classList.contains('solved'); },
    get tag() { return card.querySelector('.ex-ch-tag').innerHTML; },
    clickNext() { card.querySelector('.ex-ch-next').click(); },
  };
}
