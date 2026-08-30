// tools/number-lessons.mjs
//
// "Read the chapter" content for the nine Number-strand topics (place value, operations, factors,
// fractions, decimals, percentages, ratios, integers, powers), split out of lesson-content.mjs and
// rewritten to the shape the Geometry chapters were given in geometry-lessons.mjs.
//
// Before this, every Number chapter was a single flat .def-list: no sub-headings, no numbered
// method, and — in the strand where a picture of the quantity is most of the explanation — not one
// diagram. A reader who did not already understand equivalent fractions had nothing to look at.
//
// Every lesson here follows the same shape:
//   1. one plain-language opening sentence,
//   2. short sub-headed groups (.les-h) so the reader can scan rather than wade,
//   3. an inline explainer diagram (.les-fig) wherever the picture carries the idea,
//   4. one-idea-per-bullet .def-list items, each with a worked "For example",
//   5. a numbered method (.les-steps) for the routine the chapter's practice actually asks for,
//   6. the existing .kbox summary and .rw-examples real-world cards (kept from the original).
//
// Consumed by lesson-content.mjs, which spreads NUMBER_LESSONS into LESSON_EXPANSIONS.

import { C, r1, svg, fig, txt, line, rect, arrow, hop, pizzaSVG } from './svg-kit.mjs';

// ---------------------------------------------------------------------------
// Figure builders
// ---------------------------------------------------------------------------

// A row of place-value columns holding one numeral, with each column's worth written underneath and
// a ×10 arrow showing that every step left is a ten-fold jump.
function placeValueChartSVG() {
  const cols = [
    { name: 'Thousands', digit: '4', worth: '4 &times; 1000' },
    { name: 'Hundreds', digit: '0', worth: '0 &times; 100' },
    { name: 'Tens', digit: '7', worth: '7 &times; 10' },
    { name: 'Ones', digit: '3', worth: '3 &times; 1' },
  ];
  const W = 92, X0 = 6, TOP = 62, H = 50;
  let g = '';
  cols.forEach((c, i) => {
    const x = X0 + i * W;
    const zero = c.digit === '0';
    g += rect(x, TOP, W - 8, H, {
      r: 8,
      fill: zero ? C.marigoldTint : C.brandTint,
      stroke: zero ? C.marigold : C.brand,
      sw: zero ? 2 : 1.4,
    });
    g += txt(x + (W - 8) / 2, TOP - 10, c.name, { size: 10.5, fill: C.inkSoft });
    g += txt(x + (W - 8) / 2, TOP + 34, c.digit, { size: 27, mono: true, fill: zero ? C.marigoldInk : C.brandDeep });
    g += txt(x + (W - 8) / 2, TOP + H + 17, c.worth, { size: 10.5, mono: true, fill: C.inkSoft });
  });
  // ×10 arrows sitting above the chart, each pointing from a column to its left-hand neighbour.
  for (let i = 1; i < cols.length; i++) {
    const to = X0 + (i - 1) * W + (W - 8) / 2;
    const fromX = X0 + i * W + (W - 8) / 2;
    g += hop(fromX, to, TOP - 24, 16, C.green);
    g += txt((fromX + to) / 2, TOP - 46, '&times; 10', { size: 10.5, mono: true, fill: C.greenInk });
  }
  return svg(X0 * 2 + cols.length * W - 8, TOP + H + 26, 'The number 4073 in a place value chart, with each column worth ten times the one to its right',
    g, 380);
}

// The rounding decision, drawn on the stretch of number line where it is actually made.
function roundingLineSVG() {
  const X0 = 30, X1 = 350, Y = 62, n = 10;
  const at = (v) => r1(X0 + ((v - 370) / n) * (X1 - X0));
  let g = line(X0, Y, X1, Y, C.inkSoft, 2);
  for (let v = 370; v <= 380; v++) {
    const x = at(v), major = v === 370 || v === 380 || v === 375;
    g += line(x, Y - (major ? 9 : 5), x, Y + (major ? 9 : 5), major ? C.ink : C.inkSoft, major ? 2 : 1.2);
    if (major) g += txt(x, Y + 25, String(v), { size: 11.5, mono: true, fill: v === 375 ? C.amber : C.ink });
  }
  g += rect(at(370), Y - 9, at(375) - at(370), 18, { r: 0, fill: C.brand, stroke: 'none' });
  g += rect(at(375), Y - 9, at(380) - at(375), 18, { r: 0, fill: C.green, stroke: 'none' });
  g += `<rect x="${at(370)}" y="${Y - 9}" width="${at(380) - at(370)}" height="18" rx="3" fill="none" stroke="${C.ink}" stroke-width="1.4" opacity=".25"/>`;
  g += txt(at(372.5), Y - 18, 'rounds DOWN to 370', { size: 10.5, fill: C.brandDeep });
  g += txt(at(377.5), Y - 18, 'rounds UP to 380', { size: 10.5, fill: C.greenInk });
  g += `<circle cx="${at(374)}" cy="${Y}" r="4.5" fill="${C.paper}" stroke="${C.brandDeep}" stroke-width="2.2"/>`;
  g += `<circle cx="${at(376)}" cy="${Y}" r="4.5" fill="${C.paper}" stroke="${C.greenInk}" stroke-width="2.2"/>`;
  g += txt(at(374), Y + 44, '374', { size: 11, mono: true, fill: C.brandDeep });
  g += txt(at(376), Y + 44, '376', { size: 11, mono: true, fill: C.greenInk });
  g += txt(at(375), Y - 30, 'halfway', { size: 10, fill: C.amber });
  return svg(380, 116, 'A number line from 370 to 380 split at 375, showing 374 rounding down and 376 rounding up', g, 380);
}

// BEDMAS as a ladder of ranks, with the two tied pairs shown as one rung each — the tie is the part
// learners miss, and a four-rung ladder makes it visible.
function bedmasLadderSVG() {
  const rungs = [
    ['B', 'Brackets', 'work inside them first', C.brand],
    ['E', 'Exponents', 'powers and roots', C.violet],
    ['DM', 'Division &amp; Multiplication', 'tied &mdash; left to right', C.amber],
    ['AS', 'Addition &amp; Subtraction', 'tied &mdash; left to right', C.green],
  ];
  const W = 340, H = 40, X = 8;
  let g = '';
  rungs.forEach((r, i) => {
    const y = 6 + i * (H + 8);
    g += rect(X, y, W, H, { r: 10, fill: C.paper, stroke: r[3], sw: 1.6 });
    g += rect(X, y, 42, H, { r: 10, fill: r[3], stroke: 'none' });
    g += txt(X + 21, y + 26, r[0], { size: 15, mono: true, fill: C.paper });
    g += txt(X + 54, y + 18, r[1], { size: 12.5, anchor: 'start', fill: C.ink });
    g += txt(X + 54, y + 32, r[2], { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
    if (i < rungs.length - 1) g += arrow(X + W + 10, y + H - 6, X + W + 10, y + H + 12, C.inkSoft, 1.6);
  });
  return svg(W + 26, 6 + rungs.length * (H + 8), 'The BEDMAS ladder: brackets, then exponents, then division and multiplication tied, then addition and subtraction tied', g, 366);
}

// One expression collapsing a step at a time, with the part being worked on boxed. This is the
// layout a teacher writes on the board, and it shows *why* the answer is not 30.
function bedmasStagesSVG() {
  const rows = [
    ['6 + 4 &times; 3', 78, 52, '&times; first &mdash; it outranks +'],
    ['6 + 12', 40, 40, 'now the addition'],
    ['18', 0, 0, ''],
  ];
  const X = 14;
  let g = '';
  rows.forEach((r, i) => {
    const y = 24 + i * 40;
    if (r[2]) g += rect(X + r[1], y - 15, r[2], 22, { r: 5, fill: C.marigoldTint, stroke: C.marigold, sw: 1.4 });
    g += txt(X, y, '= ' + r[0], { size: 16, mono: true, anchor: 'start', fill: C.ink });
    if (r[3]) g += txt(X + 150, y, r[3], { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  });
  g += txt(X, 128, '6 + 4 &times; 3 is NOT (6 + 4) &times; 3 = 30', { size: 11.5, anchor: 'start', fill: C.red });
  return svg(320, 140, 'The expression 6 plus 4 times 3 collapsing in stages to 18, with each step highlighted', g, 320);
}

// Every rectangle you can build from 12 counters. Factor pairs stop being a list to memorise and
// become the shapes that tile exactly.
function factorRectsSVG() {
  const pairs = [[1, 12], [2, 6], [3, 4]];
  const U = 13, GAP = 26;
  let g = '', x = 6;
  pairs.forEach(([rowsN, colsN]) => {
    const w = colsN * U, h = rowsN * U;
    for (let r = 0; r < rowsN; r++) {
      for (let c = 0; c < colsN; c++) {
        g += rect(x + c * U, 26 + r * U, U, U, { r: 2, fill: C.brandTint, stroke: C.brand, sw: 1.1 });
      }
    }
    g += txt(x + w / 2, 18, `${rowsN} &times; ${colsN}`, { size: 12, mono: true, fill: C.brandDeep });
    g += txt(x + w / 2, 26 + h + 15, `${rowsN} row${rowsN === 1 ? '' : 's'} of ${colsN}`, { size: 10, fill: C.inkSoft, weight: 600 });
    x += w + GAP;
  });
  g += txt(6, 108, 'factors of 12: 1, 2, 3, 4, 6, 12', { size: 11.5, mono: true, anchor: 'start', fill: C.ink });
  return svg(x, 122, 'Twelve counters arranged as a 1 by 12, a 2 by 6 and a 3 by 4 rectangle', g, 360);
}

// A factor tree for 60. Circled leaves are the primes that cannot split further, so the tree ends
// itself — which is the point of the fundamental theorem of arithmetic.
function factorTreeSVG() {
  const node = (x, y, label, prime) => (prime
    ? `<circle cx="${x}" cy="${y}" r="14" fill="${C.greenTint}" stroke="${C.green}" stroke-width="2"/>` +
      txt(x, y + 5, label, { size: 13, mono: true, fill: C.greenInk })
    : rect(x - 16, y - 14, 32, 28, { r: 7, fill: C.brandTint, stroke: C.brand, sw: 1.5 }) +
      txt(x, y + 5, label, { size: 13, mono: true, fill: C.brandDeep }));
  const branch = (x1, y1, x2, y2) => line(x1, y1 + 14, x2, y2 - 14, C.inkSoft, 1.5);
  let g = '';
  g += branch(150, 22, 96, 76) + branch(150, 22, 204, 76);
  g += branch(96, 76, 60, 130) + branch(96, 76, 132, 130);
  g += branch(204, 76, 168, 130) + branch(204, 76, 240, 130);
  g += node(150, 22, '60') + node(96, 76, '6') + node(204, 76, '10');
  g += node(60, 130, '2', true) + node(132, 130, '3', true);
  g += node(168, 130, '2', true) + node(240, 130, '5', true);
  g += txt(150, 172, '60 = 2 &times; 2 &times; 3 &times; 5 = 2&sup2; &times; 3 &times; 5', { size: 12.5, mono: true, fill: C.ink });
  return svg(300, 186, 'A factor tree splitting 60 into 6 and 10, then into the primes 2, 3, 2 and 5', g, 300);
}

// Two bars of identical length cut differently. Equivalence is a claim about length, and the only
// convincing way to show it is to draw both bars the same length.
function equivalentBarsSVG() {
  const W = 300, X = 40, H = 30;
  const bar = (y, parts, shaded, label) => {
    let s = '';
    const u = W / parts;
    for (let i = 0; i < parts; i++) {
      s += rect(X + i * u, y, u, H, { r: 0, fill: i < shaded ? C.brand : C.paper, stroke: C.brandDeep, sw: 1.3 });
    }
    s += txt(X - 8, y + 20, label, { size: 13, mono: true, anchor: 'end', fill: C.brandDeep });
    return s;
  };
  let g = bar(14, 2, 1, '1/2') + bar(64, 6, 3, '3/6');
  g += line(X + W / 2, 6, X + W / 2, 102, C.amber, 1.8, '4 4');
  g += txt(X + W / 2 + 6, 112, 'same point, two names', { size: 11, anchor: 'start', fill: C.amber });
  return svg(X + W + 10, 122, 'A bar split into halves with one shaded above a bar split into sixths with three shaded, both shaded to the same length', g, 350);
}

// Why a common denominator is needed at all: the parts do not line up until they are the same size.
function addFractionsSVG() {
  const W = 240, X = 52, H = 26;
  const bar = (y, parts, shaded, label, fill) => {
    let s = '';
    const u = W / parts;
    for (let i = 0; i < parts; i++) {
      s += rect(X + i * u, y, u, H, { r: 0, fill: i < shaded ? fill : C.paper, stroke: C.inkSoft, sw: 1.2 });
    }
    s += txt(X - 8, y + 18, label, { size: 12.5, mono: true, anchor: 'end', fill: C.ink });
    return s;
  };
  let g = txt(X + W / 2, 12, 'different-sized parts &mdash; cannot be added yet', { size: 10.5, fill: C.red });
  g += bar(18, 2, 1, '1/2', C.brand) + bar(50, 3, 1, '1/3', C.green);
  g += txt(X + W / 2, 100, 'recut BOTH into sixths &mdash; now they add', { size: 10.5, fill: C.greenInk });
  g += bar(106, 6, 3, '3/6', C.brand) + bar(138, 6, 2, '2/6', C.green);
  g += txt(X + W + 12, 130, '= 5/6', { size: 14, mono: true, anchor: 'start', fill: C.ink });
  return svg(X + W + 62, 176, 'Halves and thirds recut into sixths so that three sixths plus two sixths makes five sixths', g, 340);
}

// A 10 by 10 grid, used by both decimals and percentages so "hundredths" and "per cent" are visibly
// the same picture. `spans` are {x, y, w, h, fill} blocks of cells to shade.
function grid100SVG(spans, label, width) {
  const U = 17, X = 6, Y = 6;
  let g = '';
  spans.forEach((s) => {
    g += rect(X + s.x * U, Y + s.y * U, s.w * U, s.h * U, { r: 0, fill: s.fill, stroke: 'none' });
  });
  for (let i = 0; i <= 10; i++) {
    const heavy = i % 5 === 0;
    g += line(X + i * U, Y, X + i * U, Y + 10 * U, heavy ? C.inkSoft : C.line, heavy ? 1.5 : 1);
    g += line(X, Y + i * U, X + 10 * U, Y + i * U, heavy ? C.inkSoft : C.line, heavy ? 1.5 : 1);
  }
  return svg(X * 2 + 10 * U, Y * 2 + 10 * U, label, g, width || 182);
}

// Tenths across times tenths down make hundredths — the reason the decimal-place count adds up.
function decimalAreaSVG() {
  const grid = grid100SVG([{ x: 0, y: 0, w: 4, h: 3, fill: C.brand }],
    'A hundred square with a 4 by 3 block shaded, showing 0.4 times 0.3 equals 0.12', 168);
  let g = `<g transform="translate(0,14)">${grid.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  g += txt(90, 12, '0.4 across', { size: 10.5, fill: C.brandDeep });
  g += txt(196, 44, '0.3', { size: 11, anchor: 'start', fill: C.brandDeep });
  g += txt(196, 58, 'down', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(196, 96, '12 small squares', { size: 11, anchor: 'start', fill: C.ink });
  g += txt(196, 110, 'out of 100 = 0.12', { size: 11, anchor: 'start', fill: C.ink });
  g += txt(196, 132, '1 place &times; 1 place', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(196, 145, '= 2 places', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(330, 208, 'A hundred square shaded four columns across and three rows down, giving twelve hundredths', g, 330);
}

// The decimal columns, mirrored around the point, each labelled with the fraction it stands for.
function decimalChartSVG() {
  const cols = [
    { name: 'Ones', digit: '3', worth: '3' },
    { name: 'Tenths', digit: '6', worth: '6/10' },
    { name: 'Hundredths', digit: '5', worth: '5/100' },
  ];
  const W = 96, X0 = 6, TOP = 32, H = 46;
  let g = '';
  cols.forEach((c, i) => {
    const x = X0 + i * W + (i > 0 ? 16 : 0);
    g += rect(x, TOP, W - 8, H, { r: 8, fill: i === 0 ? C.brandTint : C.greenTint, stroke: i === 0 ? C.brand : C.green });
    g += txt(x + (W - 8) / 2, TOP - 9, c.name, { size: 10.5, fill: C.inkSoft });
    g += txt(x + (W - 8) / 2, TOP + 32, c.digit, { size: 25, mono: true, fill: i === 0 ? C.brandDeep : C.greenInk });
    g += txt(x + (W - 8) / 2, TOP + H + 16, c.worth, { size: 11, mono: true, fill: C.inkSoft });
  });
  g += `<circle cx="${X0 + W + 4}" cy="${TOP + H - 6}" r="4.5" fill="${C.amber}"/>`;
  g += txt(X0 + W + 4, TOP - 9, 'point', { size: 10, fill: C.amber });
  g += txt(X0 + 4, TOP + H + 38, '3.65 = 3 + 6/10 + 5/100', { size: 12.5, mono: true, anchor: 'start', fill: C.ink });
  return svg(X0 * 2 + 3 * W + 16, TOP + H + 52, 'The number 3.65 in a place value chart with ones, tenths and hundredths columns', g, 330);
}

// One quantity wearing all four names at once. Conversion stops being four rules and becomes one
// picture read four ways.
function percentGridSVG() {
  const grid = grid100SVG([{ x: 0, y: 0, w: 5, h: 5, fill: C.violet }],
    'A hundred square with twenty-five cells shaded', 170);
  let g = grid.replace(/^<svg[^>]*>/, '<g>').replace(/<\/svg>$/, '</g>');
  const names = [['25%', '25 per hundred'], ['25/100', 'as a fraction'], ['0.25', 'as a decimal'], ['1/4', 'simplified']];
  names.forEach((n, i) => {
    const y = 18 + i * 40;
    g += txt(198, y, n[0], { size: 15, mono: true, anchor: 'start', fill: C.violet });
    g += txt(198, y + 15, n[1], { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  });
  return svg(330, 190, 'Twenty-five squares shaded out of a hundred, labelled as 25 per cent, 25 hundredths, 0.25 and one quarter', g, 330);
}

// Why "$60 after 25% off" is a division, not a subtraction: the $60 is the surviving 75%.
function discountBarSVG() {
  const W = 300, X = 14, Y = 34, H = 34;
  let g = rect(X, Y, W * 0.75, H, { r: 0, fill: C.greenTint, stroke: C.green, sw: 1.5 });
  g += rect(X + W * 0.75, Y, W * 0.25, H, { r: 0, fill: C.redTint, stroke: C.red, sw: 1.5, dash: '4 3' });
  g += txt(X + W * 0.375, Y + 22, '$60 &mdash; what you pay', { size: 12, fill: C.greenInk });
  g += txt(X + W * 0.875, Y + 22, 'saved', { size: 11, fill: C.red });
  g += txt(X + W * 0.375, Y - 10, '75%', { size: 11.5, mono: true, fill: C.greenInk });
  g += txt(X + W * 0.875, Y - 10, '25%', { size: 11.5, mono: true, fill: C.red });
  g += line(X, Y + H + 12, X + W, Y + H + 12, C.inkSoft, 1.4);
  g += line(X, Y + H + 8, X, Y + H + 16, C.inkSoft, 1.4);
  g += line(X + W, Y + H + 8, X + W, Y + H + 16, C.inkSoft, 1.4);
  g += txt(X + W / 2, Y + H + 28, '100% = the original price', { size: 11, fill: C.ink });
  g += txt(X + W / 2, Y + H + 48, '$60 &divide; 0.75 = $80', { size: 13, mono: true, fill: C.brandDeep });
  return svg(W + 28, Y + H + 60, 'A price bar split into 75 per cent paid and 25 per cent saved, with 60 divided by 0.75 giving 80', g, 328);
}

// The unitary method drawn as identical boxes. Once the boxes are equal, "one part" is something you
// can point at rather than a step to memorise.
function ratioBarSVG() {
  const U = 34, X = 26, Y = 34, H = 32;
  let g = '';
  for (let i = 0; i < 8; i++) {
    const first = i < 3;
    g += rect(X + i * U, Y, U, H, { r: 0, fill: first ? C.brandTint : C.greenTint, stroke: first ? C.brand : C.green, sw: 1.4 });
    g += txt(X + i * U + U / 2, Y + 21, '$5', { size: 11.5, mono: true, fill: first ? C.brandDeep : C.greenInk });
  }
  g += txt(X + 1.5 * U, Y - 10, '3 parts', { size: 11, fill: C.brandDeep });
  g += txt(X + 5.5 * U, Y - 10, '5 parts', { size: 11, fill: C.greenInk });
  g += txt(X + 1.5 * U, Y + H + 18, '$15', { size: 13, mono: true, fill: C.brandDeep });
  g += txt(X + 5.5 * U, Y + H + 18, '$25', { size: 13, mono: true, fill: C.greenInk });
  g += txt(X + 4 * U, Y + H + 42, '$40 &divide; 8 parts = $5 for one part', { size: 11.5, fill: C.ink });
  return svg(X * 2 + 8 * U, Y + H + 54, 'Forty dollars drawn as eight equal five-dollar boxes, three shaded for one share and five for the other', g, 328);
}

// Adding on a number line: the sign of the number is the direction of travel.
function integerLineSVG() {
  const X0 = 16, X1 = 344, Y = 74, lo = -8, hi = 8;
  const at = (v) => r1(X0 + ((v - lo) / (hi - lo)) * (X1 - X0));
  let g = line(X0, Y, X1, Y, C.inkSoft, 2);
  for (let v = lo; v <= hi; v++) {
    const x = at(v), zero = v === 0;
    g += line(x, Y - (zero ? 10 : 6), x, Y + (zero ? 10 : 6), zero ? C.ink : C.inkSoft, zero ? 2.2 : 1.2);
    if (v % 2 === 0) g += txt(x, Y + 24, (v < 0 ? '&minus;' : '') + Math.abs(v), { size: 10.5, mono: true, fill: zero ? C.ink : C.inkSoft });
  }
  g += rect(X0, Y - 34, at(0) - X0, 14, { r: 4, fill: C.redTint, stroke: 'none' });
  g += txt((X0 + at(0)) / 2, Y - 24, 'negatives', { size: 9.5, fill: C.red });
  g += rect(at(0), Y - 34, X1 - at(0), 14, { r: 4, fill: C.greenTint, stroke: 'none' });
  g += txt((at(0) + X1) / 2, Y - 24, 'positives', { size: 9.5, fill: C.greenInk });
  g += hop(at(-5), at(3), Y, 30, C.brand);
  g += txt(at(-1), Y - 40, '+ 8 &mdash; eight steps right', { size: 11, fill: C.brandDeep });
  g += `<circle cx="${at(-5)}" cy="${Y}" r="4.5" fill="${C.paper}" stroke="${C.brandDeep}" stroke-width="2.2"/>`;
  g += `<circle cx="${at(3)}" cy="${Y}" r="4.5" fill="${C.brandDeep}"/>`;
  g += txt(at(-5), Y + 40, 'start &minus;5', { size: 10.5, fill: C.brandDeep });
  g += txt(at(3), Y + 40, 'land on 3', { size: 10.5, fill: C.brandDeep });
  return svg(360, 122, 'A number line from minus eight to eight with a jump of eight to the right, starting at minus five and landing on three', g, 360);
}

// The pattern that forces negative times negative to be positive. Nothing is asserted here — the
// column simply continues, and continuing it leaves no other answer available.
function signPatternSVG() {
  const rows = [['3 &times; (&minus;2)', '&minus;6'], ['2 &times; (&minus;2)', '&minus;4'], ['1 &times; (&minus;2)', '&minus;2'],
    ['0 &times; (&minus;2)', '0'], ['(&minus;1) &times; (&minus;2)', '+2'], ['(&minus;2) &times; (&minus;2)', '+4']];
  const X = 10, Y = 16, RH = 25;
  let g = '';
  rows.forEach((r, i) => {
    const y = Y + i * RH, forced = i >= 4;
    g += rect(X, y, 200, RH - 3, { r: 5, fill: forced ? C.greenTint : C.paper, stroke: forced ? C.green : C.line, sw: forced ? 1.5 : 1 });
    g += txt(X + 12, y + 17, r[0], { size: 12.5, mono: true, anchor: 'start', fill: C.ink });
    g += txt(X + 186, y + 17, r[1], { size: 12.5, mono: true, anchor: 'end', fill: forced ? C.greenInk : C.ink });
    if (i < rows.length - 1) g += arrow(X + 216, y + 20, X + 216, y + RH + 12, C.amber, 1.6);
  });
  g += txt(X + 228, Y + 3 * RH + 4, 'each step', { size: 10, anchor: 'start', fill: C.marigoldInk, weight: 700 });
  g += txt(X + 228, Y + 3 * RH + 16, 'goes up by 2', { size: 10, anchor: 'start', fill: C.marigoldInk, weight: 700 });
  return svg(330, Y + rows.length * RH + 10, 'A column of products stepping up by two each row, forcing minus one times minus two to be positive two', g, 320);
}

// Dividing back down the ladder is what defines the zero power — it is not a rule bolted on.
function powerLadderSVG() {
  const rows = [['2&sup3;', '2 &times; 2 &times; 2', '8'], ['2&sup2;', '2 &times; 2', '4'], ['2&sup1;', '2', '2'], ['2&#8304;', '(nothing left)', '1']];
  const X = 10, Y = 14, RH = 34;
  let g = '';
  rows.forEach((r, i) => {
    const y = Y + i * RH, last = i === rows.length - 1;
    g += rect(X, y, 236, RH - 5, { r: 7, fill: last ? C.marigoldTint : C.brandTint, stroke: last ? C.marigold : C.brand, sw: last ? 1.8 : 1.2 });
    g += txt(X + 24, y + 20, r[0], { size: 14, mono: true, fill: last ? C.marigoldInk : C.brandDeep });
    g += txt(X + 48, y + 20, '= ' + r[1], { size: 12, mono: true, anchor: 'start', fill: C.inkSoft });
    g += txt(X + 224, y + 20, '= ' + r[2], { size: 13.5, mono: true, anchor: 'end', fill: last ? C.marigoldInk : C.ink });
    if (i < rows.length - 1) {
      g += arrow(X + 256, y + 22, X + 256, y + RH + 10, C.green, 1.6);
      g += txt(X + 262, y + RH + 2, '&divide; 2', { size: 10.5, mono: true, anchor: 'start', fill: C.greenInk });
    }
  });
  return svg(310, Y + rows.length * RH + 8, 'A ladder of powers of two, each row half the one above, ending at two to the power zero equals one', g, 310);
}

// Scientific notation as a count of hops, so the sign of the exponent stops being guesswork.
function sciNotationSVG() {
  const digits = '0.0045';
  const X = 20, Y = 40;
  let g = txt(X, Y, digits, { size: 22, mono: true, anchor: 'start', fill: C.ink });
  g += txt(X + 96, Y, '&rarr;', { size: 18, anchor: 'start', fill: C.inkSoft });
  g += txt(X + 126, Y, '4.5 &times; 10&#8315;&sup3;', { size: 22, mono: true, anchor: 'start', fill: C.brandDeep });
  g += hop(X + 14, X + 62, Y + 14, 18, C.amber);
  g += txt(X + 38, Y + 46, '3 hops right', { size: 11, fill: C.marigoldInk });
  g += txt(X + 150, Y + 46, 'so the power is &minus;3', { size: 11, fill: C.brandDeep });
  g += txt(X, Y + 74, 'point moves RIGHT to build 4.5 &rarr; negative power (the number was small)', { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(X, Y + 90, 'point moves LEFT to build 1.5 &rarr; positive power (the number was big)', { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(370, 142, 'The decimal point in 0.0045 hopping three places right to make 4.5, giving 4.5 times ten to the minus three', g, 370);
}

// ---------------------------------------------------------------------------
// The lessons
// ---------------------------------------------------------------------------

export const NUMBER_LESSONS = {

  'place-value': `
<p>Our number system is <span class="hl">base ten</span> and <span class="term">positional</span>: the same digit is worth a different amount depending on which column it sits in. That one idea is what makes 4073 readable at a glance.</p>
<p class="les-h">Every column is ten times the one on its right</p>
${fig(placeValueChartSVG(), 'The 4 sits in the thousands column, so it is worth 4000 &mdash; while the 3, one column from the end, is worth just 3. Step left and the value <b>&times; 10</b>; step right and it <b>&divide; 10</b>.')}
<ul class="def-list">
  <li>Each digit's value depends on where it sits. Moving one place left multiplies that digit's value by <span class="hl">10</span>. For example, the 4 in 4073 is worth 4000, but the 4 in 40 is worth only 40.</li>
  <li>A number's total value is the sum of digit &times; place value &mdash; its <span class="term">expanded form</span>. For example, 4073 = 4&times;1000 + 0&times;100 + 7&times;10 + 3.</li>
  <li>Zero is not "nothing" &mdash; it is a <span class="term">placeholder</span> that holds a column open so the other digits keep their correct value. For example, in <span class="hl">405</span> the 0 keeps the 4 in the hundreds column; drop it and 405 collapses to 45.</li>
</ul>
<p class="les-h">Rounding is a question about one digit</p>
${fig(roundingLineSVG(), 'To round 374 and 376 to the nearest ten, only the ones digit matters: 374 sits left of halfway so it falls back to <b>370</b>, while 376 sits right of halfway and climbs to <b>380</b>. The halfway mark 375 is the convention &mdash; it rounds up.')}
<ol class="les-steps">
  <li><b>Underline the place</b> you are rounding to &mdash; tens, hundreds, thousands.</li>
  <li><b>Look at the single digit to its right</b>, and nothing further. 5 or more rounds up; 4 or less stays.</li>
  <li><b>Replace everything after the underlined place with zeros</b> &mdash; the columns must stay open or the number shrinks.</li>
  <li><b>Sanity-check the size:</b> a rounded number should sit near the original, never ten times off.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Definition</span><span class="formula">value = &Sigma; (digit &times; place value)<br>each place is 10&times; the one on its right</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128181; Reading a price tag</span>
    <p>$1,000 and $100 look almost alike on a receipt &mdash; but one extra zero makes the first price <b>ten times</b> as much money.</p>
    <p>A cash register, a bank app and a price tag all depend on place value to keep prices honest.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128663; Car odometer</span>
    <p>A car's odometer reads <b>45,000 km</b>. After a 10 km trip it reads <b>45,010 km</b>.</p>
    <p>Only the tens and ones digits changed &mdash; the ten-thousands, thousands and hundreds digits kept their value untouched.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127758; A city's population</span>
    <p>A town of <b>84,000</b> people grows to <b>840,000</b>. That is not "a couple more digits" &mdash; it is exactly <b>ten times</b> bigger, because every digit shifted one place to the left.</p>
  </div>
</div>`,

  operations: `
<p>Order of operations is a <span class="hl">convention for reading</span>, not a law of nature &mdash; we agree on it so that an expression like 6 + 4 &times; 3 has exactly one meaning for everyone who reads it.</p>
<p class="les-h">The ladder &mdash; and the two rungs that tie</p>
${fig(bedmasLadderSVG(), 'Work down the ladder. The bottom two rungs each hold <b>two operations of equal rank</b>: when &times; meets &divide;, or + meets &minus;, neither one wins &mdash; you simply work <b>left to right</b>.')}
<ul class="def-list">
  <li><span class="term">BEDMAS</span> sets the order: Brackets, Exponents, Division/Multiplication (left to right), Addition/Subtraction (left to right). For example, in 6 + 4 &times; 3 the &times; is done first: 4 &times; 3 = 12, then 6 + 12 = 18.</li>
  <li>&times; and &divide; rank equally, and + and &minus; rank equally. When operations tie, work strictly <span class="hl">left to right</span>. For example, 40 &divide; 5 &times; 2 = 8 &times; 2 = 16, not 40 &divide; 10 = 4.</li>
  <li>Brackets are always done first, whatever is written inside them. For example, 2 &times; (3 + 4) = 2 &times; 7 = <span class="hl">14</span>, whereas 2 &times; 3 + 4 is only 10.</li>
  <li>Spreadsheets, calculators and computer code all follow BEDMAS exactly &mdash; get the order wrong in one formula and every total after it is wrong too. For example, the formula =2+3&times;4 returns <b>14</b>, not 20.</li>
</ul>
<p class="les-h">Working through an expression</p>
${fig(bedmasStagesSVG(), 'Rewrite the <em>whole</em> expression on each line, changing only the part you just worked out. One step per line makes a slip easy to spot &mdash; and stops the reader silently doing 6 + 4 first.')}
<ol class="les-steps">
  <li><b>Scan the whole expression first</b> and find the highest rung present &mdash; brackets, then exponents.</li>
  <li><b>Do one operation</b>, and rewrite the entire expression underneath.</li>
  <li><b>At a tie, go left to right.</b> This is the step that most wrong answers come from.</li>
  <li><b>Stop when one number is left</b>, then estimate to check the size is believable.</li>
</ol>
<div class="kbox"><span class="kbox-tag">The order</span><span class="formula">Brackets &rarr; Exponents &rarr; &times;, &divide; <span class="muted">(left to right)</span> &rarr; +, &minus; <span class="muted">(left to right)</span></span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129380; Splitting a restaurant bill</span>
    <p>3 mains at $12 each, plus a $6 shared dessert: 3 &times; 12 + 6 = 36 + 6 = <b>$42</b>.</p>
    <p>Not 3 &times; (12 + 6) = $54 &mdash; the multiplication happens before the addition unless brackets say otherwise.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128241; Phone data plan</span>
    <p>A plan costs $20 base plus $5 per extra GB. For 3 extra GB: 20 + 5 &times; 3 = 20 + 15 = <b>$35</b>. The 5 &times; 3 is worked out before the $20 is added on.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128290; A spreadsheet formula</span>
    <p>A cell contains <code>=10+2*5</code>. It shows <b>20</b>, not 60 &mdash; computers follow BEDMAS exactly, doing 2&times;5 first, then adding 10.</p>
  </div>
</div>`,

  factors: `
<p>A <span class="term">factor</span> divides a whole number exactly, with no remainder; a <span class="term">multiple</span> is a number you land on when counting up in that number's times table. Factors look inward at a number, multiples look outward from it.</p>
<p class="les-h">Factors are the rectangles that fit exactly</p>
${fig(factorRectsSVG(), 'Twelve counters can be laid out as 1&times;12, 2&times;6 or 3&times;4 with none left over &mdash; and those three <b>factor pairs</b> are the complete list of factors of 12. A 5&times;? rectangle is impossible, which is exactly what "5 is not a factor of 12" means.')}
<ul class="def-list">
  <li>A <span class="term">prime</span> number has exactly two factors: 1 and itself &mdash; so it makes only one rectangle, a single row. 1 is <em>not</em> prime, because it has only one factor. For example, 7 has only 1 and 7 as factors.</li>
  <li>A <span class="term">composite</span> number has more than two factors. Every whole number greater than 1 is either prime or composite. For example, 9 has factors 1, 3 and 9 &mdash; more than two, so it is composite.</li>
  <li>Factors come in pairs, so you only need to test up to the square root. For example, for 36 test 1, 2, 3, 4, 5, 6 &mdash; each one found hands you its partner (6&times;6 is where the list turns around).</li>
</ul>
<p class="les-h">Prime factors: a number's fingerprint</p>
${fig(factorTreeSVG(), 'Split until every branch ends in a prime (circled). Start 60 as 6&times;10 or as 4&times;15 &mdash; the tree looks different, but the <b>bottom row is always the same primes</b>. That uniqueness is what makes prime factors worth finding.')}
<ol class="les-steps">
  <li><b>Split the number</b> into any factor pair you can see.</li>
  <li><b>Keep splitting</b> any branch that is not yet prime.</li>
  <li><b>Circle the primes</b> and collect them, writing repeats as powers &mdash; 60 = 2&sup2; &times; 3 &times; 5.</li>
  <li><b>For HCF, take the primes in both</b>; for LCM, take the highest power of each. Check by multiplying back.</li>
</ol>
<ul class="def-list">
  <li><span class="hl">HCF</span> (Highest Common Factor) is the largest number dividing both exactly &mdash; the HCF of 12 and 18 is 6. It answers "what is the biggest fair group size?"</li>
  <li><span class="hl">LCM</span> (Lowest Common Multiple) is the smallest number both divide into &mdash; the LCM of 4 and 6 is 12. It answers "when do these two line up again?"</li>
</ul>
<div class="kbox"><span class="kbox-tag">From prime factors</span><span class="formula">HCF = primes in BOTH<br>LCM = highest power of EACH<br>HCF &times; LCM = the two numbers multiplied</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128652; Bus timetables</span>
    <p>Bus A leaves every 12 minutes, Bus B every 15 minutes. They next leave together after the <b>LCM of 12 and 15 = 60 minutes</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127852; Packing party bags</span>
    <p>You have 24 lollies and 36 chocolates to pack into identical bags with nothing left over. The most bags you can make is the <b>HCF of 24 and 36 = 12</b> (2 lollies + 3 chocolates each).</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129521; Tiling a floor</span>
    <p>A floor is 24 tiles by 18 tiles. The largest square block pattern that fits evenly uses the <b>HCF of 24 and 18 = 6</b>.</p>
  </div>
</div>`,

  fractions: `
<p>A fraction is a <span class="hl">number</span>, not just a slice of pizza &mdash; it marks an exact point on the number line, and it also means "numerator &divide; denominator". The <span class="term">denominator</span> names the size of each equal part; the <span class="term">numerator</span> counts how many of those parts you have.</p>
<p class="les-h">Equivalent fractions: one point, many names</p>
${fig(equivalentBarsSVG(), 'Both bars are the same length, and both shadings stop at the same place. Cutting each half into three does not change how much is shaded &mdash; it only renames it. That is why <b>multiplying top and bottom by the same number</b> is allowed.')}
<ul class="def-list">
  <li>Multiplying or dividing the top and bottom by the same number gives an <span class="term">equivalent fraction</span> &mdash; the same point on the number line, with a new name. For example, &frac12; = 2&frasl;4 = 3&frasl;6.</li>
  <li>Simplifying is the same move in reverse: divide top and bottom by their HCF. For example, 18&frasl;24 &divide; 6 gives <span class="hl">3&frasl;4</span>.</li>
  <li>To compare two fractions, rename them with the same denominator and just read the numerators. For example, is &frac35; or &frac23; bigger? Over 15: 9&frasl;15 versus 10&frasl;15, so <span class="hl">&frac23;</span> wins.</li>
</ul>
<p class="les-h">Adding needs same-sized parts</p>
${fig(addFractionsSVG(), 'Halves and thirds do not line up, so they cannot be counted together. Recut <em>both</em> into sixths and the pieces match: 3 sixths + 2 sixths = <b>5 sixths</b>. The common denominator is not a rule &mdash; it is the recutting.')}
<ol class="les-steps">
  <li><b>Check the denominators.</b> Same? Add or subtract the numerators and stop.</li>
  <li><b>Different? Find a common denominator</b> &mdash; the LCM of the two is the tidiest, though any shared multiple works.</li>
  <li><b>Rename both fractions</b> by multiplying top and bottom, then combine the numerators only.</li>
  <li><b>Simplify the answer</b>, and check it is believable &mdash; &frac12; + &frac13; must land between &frac12; and 1.</li>
</ol>
<ul class="def-list">
  <li>Multiplying fractions needs no common denominator: multiply across the tops and across the bottoms. For example, &frac12; &times; &frac13; = 1&frasl;6.</li>
  <li>Multiplying does not always make things bigger. &frac12; &times; &frac13; = 1&frasl;6 is smaller than both &mdash; multiplying by a number under 1 shrinks the amount.</li>
  <li>Dividing by a fraction asks "how many of these fit?" &mdash; so 2 &divide; &frac14; asks how many quarters fit into 2. The shortcut is to flip the second fraction (its <span class="term">reciprocal</span>) and multiply: 2 &times; 4 = <span class="hl">8</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">The engine</span><span class="formula">Equivalent: &times;/&divide; top &amp; bottom alike<br>Add: same-size parts first<br>Multiply: across<br>Divide: &times; the reciprocal</span></div>
<div class="rw-examples">
  <div class="rw-card">
    ${pizzaSVG(4, 3)}
    <span class="rw-tag">&#127829; Sharing a pizza</span>
    <p>A pizza is cut into 4 equal slices. Eating 3 of them means you have eaten <b>3&frasl;4</b> of the pizza &mdash; 3 parts out of 4 equal parts.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127856; Halving a recipe</span>
    <p>A cookie recipe needs 3&frasl;4 cup of sugar. Halving the whole recipe means multiplying every fraction by 1&frasl;2: 3&frasl;4 &times; 1&frasl;2 = <b>3&frasl;8 cup</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128336; Telling the time</span>
    <p>"Quarter past" the hour is 1&frasl;4 of 60 minutes = <b>15 minutes</b>. "Half past" is 1&frasl;2 of 60 = <b>30 minutes</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129381; Scooping flour</span>
    <p>A jar holds 2 cups of flour. Using a &frac14;-cup scoop, how many scoops empty it? That is exactly 2 &divide; &frac14; &mdash; "how many quarters fit into 2?"</p>
    <p>Flip and multiply: 2 &times; 4&frasl;1 = <b>8 scoops</b>. Counting scoops and dividing by a fraction are the same question.</p>
  </div>
</div>`,

  decimals: `
<p>Decimals are fractions whose denominators are <span class="hl">powers of ten</span>, so place value simply keeps going rightward: tenths, hundredths, thousandths. Nothing new is happening &mdash; the same columns continue past the point.</p>
<p class="les-h">The columns carry straight on past the point</p>
${fig(decimalChartSVG(), 'The point is not a separator between two numbers &mdash; it marks where the <b>ones</b> column ends. Each step right divides by ten, exactly as each step left multiplies by ten.')}
<ul class="def-list">
  <li>A decimal names a precise point on the number line, just like a fraction &mdash; 0.75 is the same point as 3&frasl;4.</li>
  <li>More digits does not mean a bigger number. Compare column by column: <span class="hl">0.5 is bigger than 0.45</span>, because 5 tenths beats 4 tenths before the hundredths are even read.</li>
  <li>Writing a trailing zero changes nothing: 10.6 = 10.60. That is what makes two decimals comparable &mdash; give them the same number of places, then compare as whole numbers.</li>
</ul>
<p class="les-h">Why multiplying adds up the decimal places</p>
${fig(decimalAreaSVG(), 'Four tenths across by three tenths down covers 12 of the 100 small squares &mdash; and each small square is one <b>hundredth</b>. Tenths &times; tenths must give hundredths, which is why 1 place &times; 1 place = 2 places.')}
<ol class="les-steps">
  <li><b>Adding or subtracting:</b> line up the points, padding with zeros so both numbers have the same places. Then add as usual. For example, 3.4 + 0.25 &rarr; 3.40 + 0.25 = <span class="hl">3.65</span>.</li>
  <li><b>Multiplying:</b> ignore the points, multiply as whole numbers, then count the total decimal places in the question and put that many in the answer. For example, 3.6 &times; 0.4 &rarr; 36 &times; 4 = 144, two places &rarr; <span class="hl">1.44</span>.</li>
  <li><b>Dividing:</b> multiply both numbers by 10 (or 100&hellip;) until the <em>divisor</em> is whole &mdash; the answer is unchanged. For example, 3.5 &divide; 0.5 &rarr; 35 &divide; 5 = <b>7</b>.</li>
  <li><b>Estimate first, always.</b> 3.6 &times; 0.4 is a bit under 4 &times; 0.5 = 2, so 1.44 is believable and 14.4 is not.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Two rules, one reason</span><span class="formula">+ , &minus; : line up the points<br>&times; : count decimal places<br>&divide; : &times;10 both until the divisor is whole</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128181; Supermarket receipt</span>
    <p>Milk $3.99 + Bread $4.50. Line up the points: <b>$3.99 + $4.50 = $8.49</b>.</p>
    <p>Misalign the points by mistake and you could be out by whole dollars, not just cents.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127939; Race times</span>
    <p>Two sprinters finish in <b>10.58 s</b> and <b>10.6 s</b>. Since 10.6 = 10.60, and 60 hundredths is more than 58 hundredths, the second time is actually <em>slower</em> &mdash; despite "10.6" looking like the smaller number.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128207; Measuring a plank</span>
    <p>A plank measures <b>1.75 m</b>. Cutting off <b>0.40 m</b>: line up the points, 1.75 &minus; 0.40 = <b>1.35 m</b> remains.</p>
  </div>
</div>`,

  percentages: `
<p>"Per cent" means <span class="hl">per hundred</span>. A percentage is a fraction locked to a denominator of 100 &mdash; which is exactly why it converts to a fraction or a decimal without any work.</p>
<p class="les-h">One picture, four names</p>
${fig(percentGridSVG(), 'Twenty-five squares out of a hundred. The shading has not changed between the four labels &mdash; only the notation has. Converting between them is renaming, never recalculating.')}
<ul class="def-list">
  <li>To turn a percentage into a decimal, divide by 100 (move the point two places left): 37% = 0.37, 6.5% = 0.065. To go back, multiply by 100: 0.6 = 60%.</li>
  <li>To find a percentage of an amount: <span class="hl">(percent &divide; 100) &times; amount</span>. For example, 20% of 150 = 0.2 &times; 150 = <span class="hl">30</span>.</li>
  <li>A percentage is always taken <em>of</em> a particular amount, called the <span class="term">base</span>. Change the base and the same percentage becomes a different amount &mdash; 10% of $50 is $5, but 10% of $80 is $8.</li>
  <li>Percentage changes do not simply add: a 10% rise then a 10% fall does <em>not</em> return you to the start, because the second 10% is of a bigger number. $100 &rarr; $110 &rarr; <span class="hl">$99</span>.</li>
</ul>
<p class="les-h">Working backwards to the original</p>
${fig(discountBarSVG(), 'After 25% off, the price you pay is not 100% of anything &mdash; it is the surviving <b>75%</b>. So the original is found by <em>dividing</em> by 0.75, never by adding 25% back on (which would give only $75).')}
<ol class="les-steps">
  <li><b>Decide which amount is the whole</b> &mdash; the "100%". In a discount question it is the original price, not the price on the tag.</li>
  <li><b>Write the part as a percentage of that whole</b> &mdash; after 25% off, the tag shows 75%.</li>
  <li><b>Divide by that percentage as a decimal</b> to get back to 100%. For example, $60 &divide; 0.75 = <span class="hl">$80</span>.</li>
  <li><b>Check forwards:</b> take 25% off your answer and confirm you land on the number you started with.</li>
</ol>
<ul class="def-list">
  <li>The <span class="term">1% method</span> handles any "find the whole" question: divide by the percentage to get 1%, then multiply by 100. If 15% of a number is 45, then 1% = 3, so 100% = <span class="hl">300</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Core moves</span><span class="formula">% of amount = (% &divide; 100) &times; amount<br>whole from a part: &divide; by the % to get 1%, &times; 100<br>change is measured against the ORIGINAL</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127991;&#65039; Shop sale</span>
    <p>An $80 jacket is 25% off. 25% of 80 = (25&divide;100)&times;80 = <b>$20 off</b>, so it now costs <b>$60</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127869;&#65039; Restaurant tip</span>
    <p>A $45 bill, 10% tip: 10% of $45 = <b>$4.50</b>. Knowing 10% (just divide by 10) makes any tip or discount easy to estimate in your head.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128200;&#128201; Rise then fall</span>
    <p>A $100 item rises 10% to $110, then falls 10%. 10% of $110 = $11, so it drops to <b>$99</b> &mdash; not back to $100, because the second 10% was taken of a bigger number.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128281; Working out the original price</span>
    <p>A jacket is on sale for <b>$60</b> after <b>25% off</b>. $60 is not the whole jacket &mdash; it's what's left after removing a quarter, so $60 is <b>75%</b> of the original.</p>
    <p>Original = 60 &divide; 0.75 = <b>$80</b>. Taking 25% off $60 (giving $45) would be the wrong direction &mdash; that undoes a discount that was never applied to $60 in the first place.</p>
  </div>
</div>`,

  ratios: `
<p>A <span class="term">ratio</span> compares quantities of the same kind &mdash; blue tins to white tins, one share to another. A <span class="term">rate</span> compares two <em>different</em> kinds of quantity, like dollars per kilogram or kilometres per hour.</p>
<p class="les-h">Sharing in a ratio: count the parts first</p>
${fig(ratioBarSVG(), 'Sharing $40 in the ratio 3 : 5 means cutting it into <b>3 + 5 = 8 equal parts</b>, not into 3 and 5 dollars. Each box is $40 &divide; 8 = $5, so the shares are $15 and $25 &mdash; and they add back to $40, which is the check.')}
<ul class="def-list">
  <li>A ratio of <span class="hl">5 : 6</span> means that for every 5 of the first quantity there are 6 of the second. It says nothing on its own about the totals &mdash; only about the relationship.</li>
  <li>A ratio also names fractions of the whole. In 5 : 6 there are 11 parts, so the first quantity is <span class="hl">5&frasl;11</span> of the total &mdash; not 5&frasl;6. Mixing these two up is the classic ratio mistake.</li>
  <li>Ratios simplify exactly like fractions &mdash; divide every part by the same number. For example, 10 : 12 simplifies to <span class="hl">5 : 6</span>.</li>
</ul>
<ol class="les-steps">
  <li><b>Add the parts</b> to find how many equal shares the whole is cut into.</li>
  <li><b>Divide the total by that number</b> &mdash; this is the <span class="term">unitary method</span>, and the answer is the value of one part.</li>
  <li><b>Multiply for each share</b>, one at a time.</li>
  <li><b>Add the shares back together.</b> If they do not rebuild the original total, a step went wrong.</li>
</ol>
<p class="les-h">Rates: reduce to "per one" before comparing</p>
<ul class="def-list">
  <li>A <span class="term">unit rate</span> divides so the second quantity becomes 1. For example, $4.50 for 500 g is 4.50 &divide; 500 = <span class="hl">$0.009 per gram</span>.</li>
  <li>Best value is decided on unit rates, never on the total price: 500 g for $4.50 is $0.009/g, while 750 g for $6.30 is $0.0084/g &mdash; the bigger bag is better value despite costing more.</li>
  <li><span class="term">Speed</span> is the rate you meet most: speed = distance &divide; time. 300 km in 5 hours is <span class="hl">60 km/h</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Unitary method</span><span class="formula">total &divide; (sum of parts) = one part &rarr; multiply for each share</span></div>
<div class="rw-examples">
  <div class="rw-card">
    ${pizzaSVG(8, 3)}
    <span class="rw-tag">&#127829; Pizza night</span>
    <p>A pizza is cut into 8 equal slices. 3 have pepperoni, 5 are plain. The ratio of pepperoni to plain is <b>3 : 5</b>.</p>
    <p>That does <em>not</em> mean pepperoni is 3&frasl;5 of the pizza &mdash; there are 3 + 5 = 8 slices total, so pepperoni is 3&frasl;8 of the whole pizza. Ratio compares the two toppings to each other; fraction-of-whole compares one topping to the total.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127912; Mixing paint</span>
    <p>A mural needs blue and white paint in the ratio 2 : 3. For every 2 tins of blue, you need 3 tins of white.</p>
    <p>Used 6 tins of blue? That's double 2, so you need double 3 = <b>9 tins of white</b> to keep the same shade.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128176; Splitting chore money</span>
    <p>Two siblings share $40 for chores in the ratio 3 : 5.</p>
    <p>3 + 5 = 8 parts. $40 &divide; 8 = $5 per part. So they get 3 &times; $5 = <b>$15</b> and 5 &times; $5 = <b>$25</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128722; Best value at the shop</span>
    <p>Which is cheaper per gram: 500 g of rice for $4.50, or 750 g for $6.30?</p>
    <p>500 g: $4.50 &divide; 500 = <b>$0.009/g</b>. 750 g: $6.30 &divide; 750 = <b>$0.0084/g</b>. The bigger bag wins &mdash; always compare the <em>unit rate</em>, not the total price.</p>
  </div>
</div>`,

  integers: `
<p>Integers extend the number line to the left of zero: &hellip;&minus;3, &minus;2, &minus;1, 0, 1, 2, 3&hellip; A negative number is not a broken number &mdash; it is a position, below a reference point you chose.</p>
<p class="les-h">Adding and subtracting is movement</p>
${fig(integerLineSVG(), 'The sign tells you the <b>direction</b>, the digit tells you <b>how far</b>. Start at &minus;5, move 8 to the right, and you land on 3 &mdash; you can read it off the line without any rule about signs.')}
<ul class="def-list">
  <li>Every number has an <span class="term">opposite</span> the same distance from zero; its <span class="term">absolute value</span> is that distance, ignoring the sign. For example, +5 and &minus;5 are opposites, so |&minus;5| = 5.</li>
  <li>Add a positive by moving right, add a negative by moving <span class="hl">left</span>. For example, 2 + (&minus;6): start at 2, move 6 left &rarr; &minus;4.</li>
  <li><span class="term">Subtracting</span> a number means adding its opposite &mdash; which is why subtracting a negative makes a number bigger. For example, 4 &minus; (&minus;3) = 4 + 3 = <span class="hl">7</span>.</li>
  <li>Ordering follows the line, so the further left, the smaller: &minus;7 &lt; &minus;2, even though 7 &gt; 2.</li>
</ul>
<p class="les-h">Why two negatives multiply to a positive</p>
${fig(signPatternSVG(), 'Nothing is asserted here &mdash; the left column just steps down by one each row, so the right column steps up by 2. Continuing the pattern past zero <b>forces</b> (&minus;1) &times; (&minus;2) to be +2. Reversing a reversal returns the original direction.')}
<ol class="les-steps">
  <li><b>Rewrite every subtraction as an addition</b> of the opposite, so the whole question becomes one kind of move.</li>
  <li><b>Walk the line</b> &mdash; or, once that is secure, note the signs: same signs add and keep the sign, different signs subtract and take the sign of the bigger distance.</li>
  <li><b>For &times; and &divide;, count the negatives:</b> an even number of them gives a positive, an odd number gives a negative.</li>
  <li><b>Sanity-check against the line.</b> An answer to the right of where you started cannot be smaller than the start.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Sign rules (with reason)</span><span class="formula">subtracting = adding the opposite<br>same signs give a <b>positive</b><br>different signs give a <b>negative</b></span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127777;&#65039; Morning temperature</span>
    <p>The forecast says <b>&minus;5&deg;C</b> this morning, warming to <b>3&deg;C</b> by afternoon. That is a rise of 3 &minus; (&minus;5) = <b>8&deg;C</b>, even though one of the numbers is negative.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127974; Bank balance</span>
    <p>You have $100 in your account and spend $150. Your balance becomes 100 &minus; 150 = <b>&minus;$50</b> &mdash; you are overdrawn, meaning you owe the bank money.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127754; Below sea level</span>
    <p>A submarine dives to 250 m below sea level, written <b>&minus;250 m</b>. It then rises 100 m: &minus;250 + 100 = <b>&minus;150 m</b> &mdash; still below sea level, but closer to the surface.</p>
  </div>
</div>`,

  powers: `
<p>An <span class="term">exponent</span> (or index) counts how many times the <span class="term">base</span> is multiplied by itself: 2&sup3; = 2&times;2&times;2 = 8. It is emphatically <em>not</em> 2&times;3 &mdash; that mix-up is the single most common error in this chapter.</p>
<p class="les-h">The ladder that defines the zero power</p>
${fig(powerLadderSVG(), 'Each step down the ladder removes one factor of 2, so each answer is <b>half</b> the one above. Carrying the same step past 2&sup1; leaves no choice: 2&#8304; must be 2 &divide; 2 = <b>1</b>. Every base behaves the same way.')}
<ul class="def-list">
  <li>Index law: when multiplying powers with the same base, <em>add</em> the exponents &mdash; a&#8319; &times; a&#7480; = a&#8319;&#8314;&#7480;. So 2&sup3; &times; 2&sup2; = 2&#8309; = 32, not 2&#8310; = 64. Write them out once and it is obvious: (2&times;2&times;2) &times; (2&times;2) is five twos.</li>
  <li>Dividing subtracts them: a&#8319; &divide; a&#7480; = a&#8319;&#8315;&#7480;. For example, 3&#8309; &divide; 3&sup2; = 3&sup3; = 27.</li>
  <li>A <span class="hl">square root</span> undoes squaring &mdash; it asks "what number times itself gives this?" For example, &radic;49 = 7, because 7 &times; 7 = 49.</li>
  <li>Powers grow far faster than multiplication. Compare 2&#8321;&#8320; = 1024 with 2 &times; 10 = 20 &mdash; the same two numbers, a wildly different answer.</li>
</ul>
<p class="les-h">Scientific notation: count the hops</p>
${fig(sciNotationSVG(), 'Move the point until exactly one non-zero digit sits in front of it, then count the hops. Moving <b>right</b> (the number was small) gives a <b>negative</b> power; moving <b>left</b> (the number was big) gives a positive one.')}
<ol class="les-steps">
  <li><b>Place the point</b> so the leading value is between 1 and 10 &mdash; 4.5, not 45 or 0.45.</li>
  <li><b>Count how many places the point moved</b>, and in which direction.</li>
  <li><b>Write &times; 10 to that power</b>, negative if you moved right. For example, 0.0045 = <span class="hl">4.5 &times; 10&#8315;&sup3;</span>, and 150,000,000 = <span class="hl">1.5 &times; 10&#8312;</span>.</li>
  <li><b>Check by converting back:</b> a negative power must give a number smaller than 1.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Index laws</span><span class="formula">a&#8319; &times; a&#7480; = a&#8319;&#8314;&#7480;<br>a&#8319; &divide; a&#7480; = a&#8319;&#8315;&#7480;<br>(a&#8319;)&#7480; = a&#8319;&#7480;<br>a&#8304; = 1</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129440; Bacteria doubling</span>
    <p>A bacteria colony doubles every hour, starting from 1 cell. After 10 hours there are 2&#185;&#8304; = <b>1024 cells</b> &mdash; powers describe repeated doubling far faster than adding.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128190; Phone storage</span>
    <p>A phone has 128 GB of storage. 128 = 2&#8311;. Computer storage sizes (kilo, mega, giga) are built from powers of 2 and powers of 1000.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127756; Distance to the Sun</span>
    <p>The Sun is about 150,000,000 km from Earth. In scientific notation that's <b>1.5 &times; 10&#8312; km</b> &mdash; far easier to read and compare than counting zeros.</p>
  </div>
</div>`,

};
