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
