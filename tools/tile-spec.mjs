// tools/tile-spec.mjs
//
// Generic, reusable tile-spec builders for js/tile-builder.js's TileBuilder.mount(host, input,
// spec). A spec is plain JSON: {slots:[{id,kind}], tiles:[{id,label,value,kind}], template:[{text}
// |{slot}]} — see tile-builder.js's own header comment for why it's plain data, not functions.
//
// Design: a small set of ATOMIC part-builders (one number slot, one linear-expression's worth of
// coeff/sign/const slots) plus a `compose()` assembler that stitches parts together with fixed
// separator text, auto-namespacing every slot/tile id so composed specs never collide. Every real
// answer shape on the site (coordinate, ratio, fraction, equation, "rule and term", "mode N, range
// N", …) is built from these same few atoms — new shapes are new RECIPES, not new widget code.
//
// This file is the Node/build-time copy (18 static topics). js/quiz-engine.js carries an ES5 twin
// for the 6 dynamic topics' runtime-generated specs (coordinates for transformations/graphs,
// choice for shapes/pythagoras) — these don't need to byte-for-byte match this file's output the
// way format-hint.mjs's two copies do, since nothing ever compares a static spec to a dynamic one;
// each just needs to be independently valid.

import { parseLinearExpr } from './format-hint.mjs';

let uid = 0;
const freshId = (prefix) => `${prefix}${uid++}`;

// One free-standing number slot: the real value plus a handful of plausible decoys. `kind` is
// unique per slot by default (via freshId), so a tile from one part's pool can never accidentally
// be dropped into a different part's slot — e.g. a coordinate's x-tile can't be placed in the y-slot.
function numberPart(value, decoys) {
  const id = freshId('n');
  const vals = [...new Set([String(value), ...decoys.map(String)])];
  return {
    slots: [{ id, kind: id }],
    tiles: vals.map((v, i) => ({ id: `${id}_${i}`, label: v, value: v, kind: id })),
    template: [{ slot: id }],
  };
}

// One linear expression's worth of tiles: coeff / sign / constant-magnitude, exactly the mechanism
// originally built for Patterns — factored out here so it composes into a bigger spec (e.g. "rule
// and term") or stands alone (a single "3x + 12"-shaped answer, e.g. Expressions). The coefficient
// carries its OWN sign baked into the tile label (e.g. "−3", not a separate sign slot) — Patterns'
// coefficients are always positive, but Expressions has genuine negative ones ("−3x + 12"), and a
// plain magnitude-only pool would leave that slot with no tile bearing the correct sign at all.
function linearExprPart(coeff, cons, letter) {
  const sid = freshId('sign'), kid = freshId('const');
  const constMag = Math.abs(cons);
  const uniqPos = (nums) => [...new Set(nums.filter((n) => n > 0))];
  const constTiles = uniqPos([constMag, constMag + 1, constMag + 3]).map((v) => ({ id: `${kid}_${v}`, label: String(v), value: String(v), kind: kid }));
  const signTiles = [{ id: `${sid}_p`, label: '+', value: '+', kind: sid }, { id: `${sid}_m`, label: '−', value: '−', kind: sid }];

  // Implicit coefficient of 1 ("x + 8", never "1x + 8" — the site explicitly teaches this as the
  // implicit-coefficient convention): omit the coefficient slot/tile entirely rather than force a
  // "1" tile no Year 7 student would be taught to place. Marking would accept "1x + 8" as equivalent
  // either way (parseLinearExpr treats them identically), but the tile UI should model correct
  // convention, not just anything the marking engine happens to tolerate.
  if (coeff === 1) {
    return {
      slots: [{ id: sid, kind: sid }, { id: kid, kind: kid }],
      tiles: [...signTiles, ...constTiles],
      template: [{ text: `${letter} ` }, { slot: sid }, { text: ' ' }, { slot: kid }],
    };
  }

  const cid = freshId('coeff');
  const coeffLabel = (v) => (v < 0 ? `−${-v}` : String(v));
  const uniq = (nums) => [...new Set(nums)];
  const coeffTiles = uniq([coeff, coeff + 1, coeff - 1, -coeff].filter((v) => v !== 0 && v !== 1)).map((v) => ({ id: `${cid}_${v}`, label: coeffLabel(v), value: coeffLabel(v), kind: cid }));
  return {
    slots: [{ id: cid, kind: cid }, { id: sid, kind: sid }, { id: kid, kind: kid }],
    tiles: [...coeffTiles, ...signTiles, ...constTiles],
    template: [{ slot: cid }, { text: `${letter} ` }, { slot: sid }, { text: ' ' }, { slot: kid }],
  };
}

// A single-slot "pick one" part: the real answer plus wrong-option decoys, all placed into ONE
// slot. Reuses the exact same widget as every multi-slot spec (a spec with one slot is just a
// degenerate case) — this is how a word/classification answer ("equilateral", "yes") gets tile
// support without inventing a second interaction pattern.
function choicePart(correct, decoys) {
  const id = freshId('choice');
  const vals = [...new Set([correct, ...decoys])];
  return {
    slots: [{ id, kind: id }],
    tiles: vals.map((v, i) => ({ id: `${id}_${i}`, label: v, value: v, kind: id })),
    template: [{ slot: id }],
  };
}

// Stitches an ordered list of parts and fixed separator strings into one spec, e.g.
// compose(['(', xPart, ', ', yPart, ')']) for a coordinate. Slot ids are already globally unique
// (freshId), so concatenation needs no further namespacing.
function compose(pieces) {
  const slots = [], tiles = [], template = [];
  pieces.forEach((p) => {
    if (typeof p === 'string') { template.push({ text: p }); return; }
    slots.push(...p.slots); tiles.push(...p.tiles); template.push(...p.template);
  });
  return { slots, tiles, template };
}

export function coordinateTileSpec(x, y) {
  return compose(['(', numberPart(x, [x + 1, x - 1, -x]), ', ', numberPart(y, [y + 1, y - 1, -y]), ')']);
}

export function ratioTileSpec(a, b) {
  return compose([numberPart(a, [a + 1, b, a + 2]), ' : ', numberPart(b, [b + 1, a, b + 2])]);
}

export function fractionTileSpec(n, d) {
  return compose([numberPart(n, [n + 1, d, n + 2]), '/', numberPart(d, [d + 1, n, d + 2])]);
}

export function mixedNumberTileSpec(whole, n, d) {
  return compose([numberPart(whole, [whole + 1, Math.max(0, whole - 1)]), ' ', numberPart(n, [n + 1, d]), '/', numberPart(d, [d + 1, n])]);
}

export function equationTileSpec(letter, value) {
  return compose([`${letter} = `, numberPart(value, [value + 1, value - 1, value + 2])]);
}

export function linearExprTileSpec(coeff, cons, letter) {
  return linearExprPart(coeff, cons, letter);
}

export function ruleAndTermTileSpec(coeff, cons, letter, term) {
  return compose([linearExprPart(coeff, cons, letter), ' and ', numberPart(term, [term + 1, Math.max(1, term - 10)])]);
}

// Generic "label N, label N, …" compound — statistics' "mode 7, range 5" and similar. The label
// text is FIXED (not a tile): the marking engine's own normParts strips bare-word tokens as filler
// (verified: isCorrect("7, 5", ["mode 7, range 5"]) is true), so the true required input is just
// the numbers — showing the label as a tile would wrongly imply it must be typed.
export function labelledCompoundTileSpec(parts) {
  const pieces = [];
  parts.forEach((p, i) => {
    if (i > 0) pieces.push(', ');
    pieces.push(`${p.label} `);
    pieces.push(numberPart(p.value, p.decoys));
  });
  return compose(pieces);
}

export function choiceTileSpec(correct, decoys) {
  return choicePart(correct, decoys);
}

// Classifies a RAW accept string into a tile spec, mirroring format-hint.mjs's own shape
// recognition (same regex order/spirit) so "gets a hint" and "gets a tile builder" stay consistent
// by construction. Returns null for anything not confidently recognized — bare plain numbers and
// bare words are deliberately left as free-text-only (tiles would add friction with no ambiguity
// to resolve, per the "don't force drag-and-drop" principle). "Choice" shapes (classification/yes-
// no answers) are NOT handled here — they need topic-specific decoy knowledge this string-only
// classifier can't derive, so those are wired directly at their call sites via choiceTileSpec().
export function deriveTileSpec(raw) {
  const v = String(raw).trim();
  let m;

  // Coordinate "(-3, 5)" — checked first so its internal comma is never mistaken for a compound
  // separator (mirrors format-hint.mjs's own ordering for the identical reason).
  if ((m = v.match(/^\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/))) {
    return coordinateTileSpec(Number(m[1]), Number(m[2]));
  }

  // "rule and term" (Patterns): a linear expression, then a plain number.
  if ((m = v.match(/^(-?\d*)([a-z])\s*([+\-−])\s*(\d+(?:\.\d+)?)\s+and\s+(-?\d+(?:\.\d+)?)$/i))) {
    const coeff = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
    const sign = (m[3] === '-' || m[3] === '−') ? -1 : 1;
    return ruleAndTermTileSpec(coeff, sign * Number(m[4]), m[2], Number(m[5]));
  }

  // "label N, label N" (Statistics: "mode 7, range 5") — exactly 2 label+number parts.
  if ((m = v.match(/^([a-z]+)\s+(-?\d+(?:\.\d+)?)\s*,\s*([a-z]+)\s+(-?\d+(?:\.\d+)?)$/i))) {
    return labelledCompoundTileSpec([
      { label: m[1], value: Number(m[2]), decoys: [Number(m[2]) + 1, Number(m[2]) + 2] },
      { label: m[3], value: Number(m[4]), decoys: [Number(m[4]) + 1, Number(m[4]) + 2] },
    ]);
  }

  // Equation "letter = N" (incl. short labels like SA, HCF).
  if ((m = v.match(/^([a-z]{1,3})\s*=\s*(-?\d+(?:\.\d+)?)$/i))) {
    return equationTileSpec(m[1], Number(m[2]));
  }

  // Ratio "a : b".
  if ((m = v.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/))) {
    return ratioTileSpec(Number(m[1]), Number(m[2]));
  }

  // Mixed number "w n/d", then plain fraction "n/d".
  if ((m = v.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return mixedNumberTileSpec(Number(m[1]), Number(m[2]), Number(m[3]));
  if ((m = v.match(/^(\d+)\/(\d+)$/))) return fractionTileSpec(Number(m[1]), Number(m[2]));

  // Standalone linear expression (Expressions: "3x + 12") — never a compound (no "and"/","/";"),
  // degree <=1, and needs >=2 terms for the exact same reason format-hint.mjs requires it: a bare
  // "3x"-only or single-letter answer isn't genuinely algebra-shaped.
  if (!/,|;|\band\b/i.test(v)) {
    const lin = parseLinearExpr(v);
    if (lin && lin.letter && lin.termCount >= 2) return linearExprTileSpec(lin.coeff, lin.cons, lin.letter);
  }

  return null;
}
