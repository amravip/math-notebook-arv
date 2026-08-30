// tools/algebra-lessons.mjs
//
// "Read the chapter" content for the five Algebra-strand topics (patterns, expressions, equations,
// inequalities, graphs), rewritten to the shape used by geometry-lessons.mjs and number-lessons.mjs:
// sub-headed groups, an inline explainer diagram wherever the picture carries the idea, and a
// numbered method for the routine the chapter's practice actually asks for.
//
// Algebra is where a reader most often knows the steps and not the reason, so each figure here is
// chosen to show the *why*: the balance that makes "do the same to both sides" legal, the area
// rectangle behind the distributive law, and the mirror that makes a negative divisor flip an
// inequality.
//
// Consumed by lesson-content.mjs, which spreads ALGEBRA_LESSONS into LESSON_EXPANSIONS.

import { C, r1, svg, fig, txt, line, rect, arrow, hop } from './svg-kit.mjs';

// ---------------------------------------------------------------------------
// Figure builders
// ---------------------------------------------------------------------------

// A linear sequence with its constant difference marked, then the same sequence beside the times
// table it is built from — which is where the "+2" in 3n + 2 actually comes from.
function sequenceRuleSVG() {
  const terms = [5, 8, 11, 14];
  const U = 74, X = 44, Y = 44, BW = 46, BH = 32;
  let g = txt(X - 10, Y + 21, 'terms', { size: 10.5, anchor: 'end', fill: C.inkSoft });
  terms.forEach((t, i) => {
    const x = X + i * U;
    g += rect(x, Y, BW, BH, { r: 7, fill: C.brandTint, stroke: C.brand, sw: 1.4 });
    g += txt(x + BW / 2, Y + 22, String(t), { size: 16, mono: true, fill: C.brandDeep });
    g += txt(x + BW / 2, Y - 10, 'n = ' + (i + 1), { size: 10, fill: C.inkSoft, weight: 600 });
    if (i < terms.length - 1) {
      g += hop(x + BW + 3, x + U - 3, Y + BH + 8, 14, C.amber);
      g += txt(x + BW + (U - BW) / 2, Y + BH + 30, '+3', { size: 11, mono: true, fill: C.amber });
    }
  });
  const Y2 = Y + 68;
  g += txt(X - 10, Y2 + 21, '3 &times; n', { size: 10.5, anchor: 'end', fill: C.inkSoft });
  terms.forEach((t, i) => {
    const x = X + i * U;
    g += rect(x, Y2, BW, BH, { r: 7, fill: C.paper, stroke: C.inkSoft, sw: 1.2, dash: '4 3' });
    g += txt(x + BW / 2, Y2 + 22, String(3 * (i + 1)), { size: 15, mono: true, fill: C.inkSoft });
    g += arrow(x + BW / 2, Y2 - 4, x + BW / 2, Y + BH + 4, C.green, 1.5);
    g += txt(x + BW / 2 + 16, Y2 - 12, '+2', { size: 10, mono: true, fill: C.greenInk });
  });
  g += txt(X + 2 * U - 8, Y2 + 58, 'rule: 3n + 2', { size: 14, mono: true, fill: C.greenInk });
  return svg(X + 4 * U - 20, Y2 + 72, 'The sequence 5, 8, 11, 14 above the three times table, each term two more than three n', g, 350);
}

// Second differences: the gaps between the gaps. Laying all three rows under each other is the whole
// technique — nothing else is needed to see that the pattern is quadratic.
function secondDiffSVG() {
  const terms = [2, 6, 12, 20, 30];
  const U = 62, X = 62, Y = 26;
  let g = txt(X - 12, Y + 5, 'terms', { size: 10.5, anchor: 'end', fill: C.inkSoft });
  terms.forEach((t, i) => g += txt(X + i * U, Y + 5, String(t), { size: 15, mono: true, fill: C.ink }));
  const d1 = [4, 6, 8, 10];
  g += txt(X - 12, Y + 41, '1st gaps', { size: 10.5, anchor: 'end', fill: C.brandDeep });
  d1.forEach((d, i) => {
    const x = X + i * U + U / 2;
    g += line(X + i * U + 14, Y + 12, x - 6, Y + 28, C.line, 1.2);
    g += line(X + (i + 1) * U - 14, Y + 12, x + 6, Y + 28, C.line, 1.2);
    g += rect(x - 15, Y + 28, 30, 20, { r: 6, fill: C.brandTint, stroke: C.brand, sw: 1.2 });
    g += txt(x, Y + 42, '+' + d, { size: 12, mono: true, fill: C.brandDeep });
  });
  const d2 = [2, 2, 2];
  g += txt(X - 12, Y + 79, '2nd gaps', { size: 10.5, anchor: 'end', fill: C.greenInk });
  d2.forEach((d, i) => {
    const x = X + (i + 1) * U;
    g += rect(x - 15, Y + 66, 30, 20, { r: 6, fill: C.greenTint, stroke: C.green, sw: 1.2 });
    g += txt(x, Y + 80, '+' + d, { size: 12, mono: true, fill: C.greenInk });
  });
  g += txt(X + 2 * U, Y + 106, 'constant 2nd gaps &rarr; the next gap is +12, so the next term is 42',
    { size: 10.5, fill: C.inkSoft, weight: 600 });
  return svg(X + 5 * U - 30, Y + 122, 'The sequence 2, 6, 12, 20, 30 with first gaps of 4, 6, 8, 10 and constant second gaps of 2', g, 350);
}

// Like terms as sortable tiles. "You cannot add x and y" is obvious once they are different shapes.
function likeTermsSVG() {
  const tile = (x, y, label, fill, stroke, w) =>
    rect(x, y, w || 34, 30, { r: 7, fill, stroke, sw: 1.4 }) +
    txt(x + (w || 34) / 2, y + 20, label, { size: 13, mono: true, fill: stroke });
  let g = txt(10, 16, '3x + 2y + 5x', { size: 14, mono: true, anchor: 'start', fill: C.ink });
  const src = [['x', 1], ['x', 1], ['x', 1], ['y', 0], ['y', 0], ['x', 1], ['x', 1], ['x', 1], ['x', 1], ['x', 1]];
  src.forEach((t, i) => {
    g += tile(10 + i * 30, 26, t[0], t[1] ? C.brandTint : C.marigoldTint, t[1] ? C.brand : C.marigoldInk, 26);
  });
  g += arrow(150, 66, 150, 84, C.inkSoft, 1.6);
  g += txt(176, 80, 'sort into piles', { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  for (let i = 0; i < 8; i++) g += tile(10 + i * 30, 92, 'x', C.brandTint, C.brand, 26);
  for (let i = 0; i < 2; i++) g += tile(10 + i * 30, 128, 'y', C.marigoldTint, C.marigoldInk, 26);
  g += txt(258, 112, '= 8x + 2y', { size: 15, mono: true, anchor: 'start', fill: C.ink });
  g += txt(80, 172, 'x-tiles and y-tiles never merge &mdash; that is all "like terms" means',
    { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(370, 186, 'Ten algebra tiles sorted into a pile of eight x tiles and a pile of two y tiles', g, 350);
}

// The distributive law is a rectangle. Splitting the width splits the area, and the two pieces are
// exactly the two products you write down.
function expandAreaSVG() {
  const X = 46, Y = 30, H = 62, W1 = 128, W2 = 74;
  let g = rect(X, Y, W1, H, { r: 0, fill: C.brandTint, stroke: C.brand, sw: 1.5 });
  g += rect(X + W1, Y, W2, H, { r: 0, fill: C.greenTint, stroke: C.green, sw: 1.5 });
  g += txt(X + W1 / 2, Y + 38, '2 &times; x', { size: 16, mono: true, fill: C.brandDeep });
  g += txt(X + W1 + W2 / 2, Y + 38, '2 &times; 3', { size: 16, mono: true, fill: C.greenInk });
  g += txt(X + W1 / 2, Y - 10, 'x', { size: 13, mono: true, fill: C.brandDeep });
  g += txt(X + W1 + W2 / 2, Y - 10, '3', { size: 13, mono: true, fill: C.greenInk });
  g += txt(X - 14, Y + 38, '2', { size: 13, mono: true, fill: C.ink });
  g += line(X, Y - 22, X + W1 + W2, Y - 22, C.inkSoft, 1.4);
  g += line(X, Y - 26, X, Y - 18, C.inkSoft, 1.4);
  g += line(X + W1 + W2, Y - 26, X + W1 + W2, Y - 18, C.inkSoft, 1.4);
  g += txt(X + (W1 + W2) / 2, Y - 30, 'width = x + 3', { size: 11, fill: C.ink });
  g += txt(X, Y + H + 26, '2(x + 3) = 2x + 6', { size: 15, mono: true, anchor: 'start', fill: C.ink });
  g += txt(X, Y + H + 44, 'one rectangle, counted two ways', { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(X + W1 + W2 + 16, Y + H + 56, 'A rectangle of height 2 split into a part x wide and a part 3 wide, showing 2 times x plus 2 times 3', g, 330);
}

// Substitute, plot, join — with the table and the grid side by side, so the three (x, y) pairs are
// visibly the same three points. The third point is drawn last because it is the check, not decoration.
function plotFromTableSVG() {
  const rows = [[0, -1], [1, 1], [2, 3]];
  const TX = 10, TY = 30, RW = 96, RH = 28;
  let g = txt(TX + RW / 2, TY - 10, 'y = 2x &minus; 1', { size: 12.5, mono: true, fill: C.brandDeep });
  g += rect(TX, TY, RW, RH, { r: 0, fill: C.brandTint, stroke: C.brand, sw: 1.2 });
  g += txt(TX + RW / 4, TY + 19, 'x', { size: 12, mono: true, fill: C.brandDeep });
  g += txt(TX + (3 * RW) / 4, TY + 19, 'y', { size: 12, mono: true, fill: C.brandDeep });
  g += line(TX + RW / 2, TY, TX + RW / 2, TY + RH * (rows.length + 1), C.brand, 1.2);
  rows.forEach((r, i) => {
    const y = TY + RH * (i + 1);
    g += rect(TX, y, RW, RH, { r: 0, fill: C.paper, stroke: C.brand, sw: 1.2 });
    g += txt(TX + RW / 4, y + 19, String(r[0]), { size: 13, mono: true, fill: C.ink });
    g += txt(TX + (3 * RW) / 4, y + 19, r[1] < 0 ? '&minus;' + Math.abs(r[1]) : String(r[1]), { size: 13, mono: true, fill: C.ink });
  });
  g += txt(TX + RW / 2, TY + RH * 4 + 20, 'substitute, then plot', { size: 10, fill: C.inkSoft, weight: 600 });

  const U = 26, xMin = -1, yMin = -2;
  const px = (x) => r1(170 + (x - xMin) * U);
  const py = (y) => r1(176 - (y - yMin) * U);
  for (let x = xMin; x <= 3; x++) g += line(px(x), py(4), px(x), py(yMin), C.line, 1);
  for (let y = yMin; y <= 4; y++) g += line(px(xMin), py(y), px(3), py(y), C.line, 1);
  g += line(px(xMin), py(0), px(3), py(0), C.inkSoft, 1.6);
  g += line(px(0), py(4), px(0), py(yMin), C.inkSoft, 1.6);
  g += line(px(-0.5), py(-2), px(2.5), py(4), C.brand, 2.4);
  rows.forEach((r) => {
    g += `<circle cx="${px(r[0])}" cy="${py(r[1])}" r="4.5" fill="${C.marigold}" stroke="${C.ink}" stroke-width="1.6"/>`;
  });
  g += txt(px(1), py(4) - 8, '(0,&minus;1) (1,1) (2,3)', { size: 10, mono: true, fill: C.inkSoft, weight: 600 });
  return svg(300, 200, 'A table of three x and y values beside a grid with those three points plotted and joined by a straight line', g, 300);
}

// The balance that makes every legal move legal. Both pans are drawn level, and the step removes the
// same weight from each — which is the entire justification for "do the same to both sides".
function balanceSVG() {
  const panel = (ox, left, right, caption, note) => {
    const CXL = ox + 54, CXR = ox + 148, TOP = 26, PY = 62;
    let s = line(ox + 20, TOP, ox + 182, TOP, C.ink, 2.4);
    s += line(ox + 101, TOP, ox + 101, TOP + 42, C.inkSoft, 2);
    s += `<polygon points="${ox + 101},${TOP + 42} ${ox + 88},${TOP + 62} ${ox + 114},${TOP + 62}" fill="${C.inkSoft}"/>`;
    [[CXL, left, C.brand, C.brandTint], [CXR, right, C.green, C.greenTint]].forEach(([cx, label, stroke, fill]) => {
      s += line(cx, TOP, cx, PY - 12, C.inkSoft, 1.4);
      s += rect(cx - 36, PY - 12, 72, 30, { r: 8, fill, stroke, sw: 1.6 });
      s += txt(cx, PY + 8, label, { size: 15, mono: true, fill: stroke === C.brand ? C.brandDeep : C.greenInk });
    });
    s += txt(ox + 101, PY + 40, caption, { size: 11.5, fill: C.ink });
    if (note) s += txt(ox + 101, PY + 56, note, { size: 10, fill: C.inkSoft, weight: 600 });
    return s;
  };
  let g = panel(0, '2x + 1', '9', '2x + 1 = 9', 'the pans balance');
  g += arrow(214, 84, 244, 84, C.amber, 2);
  g += txt(229, 66, 'take 1', { size: 10, fill: C.marigoldInk });
  g += txt(229, 104, 'off BOTH', { size: 10, fill: C.marigoldInk });
  g += panel(258, '2x', '8', '2x = 8', 'still balanced &rarr; x = 4');
  return svg(462, 168, 'A balance scale holding 2x plus 1 against 9, then the same scale after one is removed from both pans', g, 380);
}

// Solving as undoing a machine. Reading the top row left-to-right builds the expression; reading the
// bottom row right-to-left is the solution, which is why the order reverses.
function inverseMachineSVG() {
  const X = 20, Y = 34, BW = 56, GAP = 34;
  const cell = (i, label, fill, stroke) => {
    const x = X + i * (BW + GAP);
    return rect(x, Y, BW, 32, { r: 8, fill, stroke, sw: 1.5 }) +
      txt(x + BW / 2, Y + 22, label, { size: 14, mono: true, fill: stroke });
  };
  let g = cell(0, 'x', C.brandTint, C.brand) + cell(1, '2x', C.brandTint, C.brand) + cell(2, '2x + 1', C.brandTint, C.brand);
  for (let i = 0; i < 2; i++) {
    const x = X + i * (BW + GAP) + BW;
    g += arrow(x + 4, Y + 16, x + GAP - 4, Y + 16, C.brand, 1.8);
    g += txt(x + GAP / 2, Y - 6, i === 0 ? '&times; 2' : '+ 1', { size: 11, mono: true, fill: C.brandDeep });
  }
  const Y2 = Y + 68;
  const cell2 = (i, label) => {
    const x = X + i * (BW + GAP);
    return rect(x, Y2, BW, 32, { r: 8, fill: C.greenTint, stroke: C.green, sw: 1.5 }) +
      txt(x + BW / 2, Y2 + 22, label, { size: 14, mono: true, fill: C.greenInk });
  };
  g += cell2(0, '4') + cell2(1, '8') + cell2(2, '9');
  for (let i = 2; i > 0; i--) {
    const x = X + (i - 1) * (BW + GAP) + BW;
    g += arrow(x + GAP - 4, Y2 + 16, x + 4, Y2 + 16, C.green, 1.8);
    g += txt(x + GAP / 2, Y2 + 46, i === 2 ? '&minus; 1' : '&divide; 2', { size: 11, mono: true, fill: C.greenInk });
  }
  g += txt(X, Y - 22, 'built this way &rarr;', { size: 10.5, anchor: 'start', fill: C.brandDeep });
  g += txt(X + 2 * (BW + GAP) + BW, Y2 - 8, '&larr; undone this way', { size: 10.5, anchor: 'end', fill: C.greenInk });
  return svg(X * 2 + 3 * BW + 2 * GAP, Y2 + 62, 'x becoming 2x then 2x plus 1, with the reverse chain 9 minus 1 gives 8, divided by 2 gives 4', g, 330);
}

// Open versus closed circles, drawn on one line so the difference is a comparison rather than two
// separate facts.
function inequalityLineSVG() {
  const X0 = 30, X1 = 330, lo = -2, hi = 8;
  const at = (v) => r1(X0 + ((v - lo) / (hi - lo)) * (X1 - X0));
  const strip = (y, from, to, open, label, color, tint) => {
    let s = line(X0, y, X1, y, C.inkSoft, 1.8);
    for (let v = lo; v <= hi; v++) {
      s += line(at(v), y - 5, at(v), y + 5, C.inkSoft, 1.1);
      s += txt(at(v), y + 20, (v < 0 ? '&minus;' : '') + Math.abs(v), { size: 9.5, mono: true, fill: C.inkSoft });
    }
    s += line(at(from), y, at(to), y, color, 4.5);
    s += `<polygon points="${at(to)},${y} ${at(to) - (to > from ? 9 : -9)},${y - 5} ${at(to) - (to > from ? 9 : -9)},${y + 5}" fill="${color}"/>`;
    s += `<circle cx="${at(from)}" cy="${y}" r="6" fill="${open ? tint : color}" stroke="${color}" stroke-width="2.4"/>`;
    s += txt(X0, y - 16, label, { size: 12.5, mono: true, anchor: 'start', fill: color });
    s += txt(at(from), y - 16, open ? 'open &mdash; 5 is NOT included' : 'filled &mdash; 3 IS included',
      { size: 10, fill: color, weight: 600 });
    return s;
  };
  let g = strip(40, 5, lo, true, 'x &lt; 5', C.brand, C.paper);
  g += strip(114, 3, hi, false, 'x &ge; 3', C.green, C.paper);
  return svg(360, 146, 'Two number lines: x less than five with an open circle at five, and x greater than or equal to three with a filled circle at three', g, 350);
}

// Why a negative divisor flips the sign: multiplying by a negative reflects the line through zero,
// and reflection swaps left and right.
function flipSignSVG() {
  const X0 = 24, X1 = 336, lo = -8, hi = 8, Y = 60;
  const at = (v) => r1(X0 + ((v - lo) / (hi - lo)) * (X1 - X0));
  let g = line(X0, Y, X1, Y, C.inkSoft, 2);
  for (let v = lo; v <= hi; v += 2) {
    g += line(at(v), Y - 5, at(v), Y + 5, C.inkSoft, 1.2);
    g += txt(at(v), Y + 20, (v < 0 ? '&minus;' : '') + Math.abs(v), { size: 9.5, mono: true, fill: C.inkSoft });
  }
  g += line(at(0), Y - 34, at(0), Y + 28, C.amber, 1.6, '4 3');
  g += txt(at(0), Y - 40, 'mirror at 0', { size: 10, fill: C.marigoldInk });
  [[2, C.brand], [4, C.brand]].forEach(([v, col]) => {
    g += `<circle cx="${at(v)}" cy="${Y}" r="5" fill="${col}"/>`;
    g += txt(at(v), Y - 12, String(v), { size: 11, mono: true, fill: col });
  });
  [[-2, C.green], [-4, C.green]].forEach(([v, col]) => {
    g += `<circle cx="${at(v)}" cy="${Y}" r="5" fill="${col}"/>`;
    g += txt(at(v), Y - 12, '&minus;' + Math.abs(v), { size: 11, mono: true, fill: col });
  });
  g += hop(at(2), at(-2), Y - 6, 22, C.amber);
  g += hop(at(4), at(-4), Y - 6, 34, C.amber);
  g += txt(90, 116, '2 &lt; 4', { size: 14, mono: true, anchor: 'start', fill: C.brandDeep });
  g += txt(150, 116, 'but', { size: 11, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(190, 116, '&minus;2 &gt; &minus;4', { size: 14, mono: true, anchor: 'start', fill: C.greenInk });
  g += txt(180, 136, 'the order reverses &mdash; so the sign must too', { size: 10.5, fill: C.inkSoft, weight: 600 });
  return svg(360, 150, 'A number line showing 2 and 4 reflected to minus 2 and minus 4, reversing which is larger', g, 350);
}

// One line with its gradient triangle and intercept marked, because m and c are things you can point
// at on the picture rather than letters in a formula.
function linearGraphSVG() {
  const X0 = 40, Y0 = 186, U = 28, xMin = -1, xMax = 4, yMin = -1, yMax = 5;
  const px = (x) => r1(X0 + (x - xMin) * U);
  const py = (y) => r1(Y0 - (y - yMin) * U);
  let g = '';
  for (let x = xMin; x <= xMax; x++) g += line(px(x), py(yMin), px(x), py(yMax), C.line, 1);
  for (let y = yMin; y <= yMax; y++) g += line(px(xMin), py(y), px(xMax), py(y), C.line, 1);
  g += line(px(xMin), py(0), px(xMax), py(0), C.inkSoft, 1.8);
  g += line(px(0), py(yMin), px(0), py(yMax), C.inkSoft, 1.8);
  g += txt(px(xMax) + 10, py(0) + 4, 'x', { size: 11, fill: C.inkSoft });
  g += txt(px(0) - 4, py(yMax) - 8, 'y', { size: 11, fill: C.inkSoft });
  for (let x = 1; x <= xMax; x++) g += txt(px(x), py(0) + 15, String(x), { size: 9.5, mono: true, fill: C.inkSoft });
  for (let y = 1; y <= yMax; y++) g += txt(px(0) - 12, py(y) + 4, String(y), { size: 9.5, mono: true, fill: C.inkSoft });
  // The line y = 2x + 1, clipped to the drawn grid.
  g += line(px(-1), py(-1), px(2), py(5), C.brand, 2.4);
  // Gradient triangle from (0,1) to (1,3): one across, two up.
  g += line(px(0), py(1), px(1), py(1), C.amber, 2.2);
  g += line(px(1), py(1), px(1), py(3), C.amber, 2.2);
  g += txt(px(0.5), py(1) + 16, 'run 1', { size: 10, mono: true, fill: C.marigoldInk });
  g += txt(px(1) + 26, py(2) + 4, 'rise 2', { size: 10, mono: true, fill: C.marigoldInk });
  g += `<circle cx="${px(0)}" cy="${py(1)}" r="5" fill="${C.green}"/>`;
  g += txt(px(0) - 34, py(1) - 10, 'c = 1', { size: 11, mono: true, fill: C.greenInk });
  g += txt(px(0) - 34, py(1) + 4, 'intercept', { size: 9, fill: C.greenInk, weight: 600 });
  g += txt(px(2) + 46, py(4.4), 'y = 2x + 1', { size: 13, mono: true, fill: C.brandDeep });
  g += txt(px(2) + 46, py(3.8), 'm = rise &divide; run = 2', { size: 10, fill: C.inkSoft, weight: 600 });
  return svg(300, 200, 'The line y equals 2x plus 1 on a grid, crossing the y-axis at 1 with a gradient triangle of run 1 and rise 2', g, 300);
}

// ---------------------------------------------------------------------------
// The lessons
// ---------------------------------------------------------------------------

export const ALGEBRA_LESSONS = {

  patterns: `
<p>A <span class="term">sequence</span> is an ordered list of numbers built by a rule. Each number is a <span class="term">term</span>, and its position in the list is called n &mdash; so the 1st term has n = 1, the 100th has n = 100.</p>
<p class="les-h">From a sequence to its rule</p>
${fig(sequenceRuleSVG(), 'The terms go up by <b>3</b> each time, so the rule is built on the 3 times table. But 3n gives 3, 6, 9, 12 &mdash; every value is <b>2 short</b>, so the rule is <b>3n + 2</b>. The common difference sets the multiplier; the gap between the two rows sets the adjustment.')}
<ul class="def-list">
  <li>A <span class="term">term-to-term rule</span> tells you how to get the next term from the one before &mdash; "add 4". It is easy to spot but useless for jumping ahead.</li>
  <li>A <span class="term">position-to-term rule</span> (the nth-term rule) goes straight to any term. For example, with 4n + 3, term 100 = 4 &times; 100 + 3 = <span class="hl">403</span>, with no need to list terms 1&ndash;99.</li>
  <li>Always test a rule you have found on a term you did not use to build it. For 7, 11, 15, 19&hellip; the rule 4n + 3 gives n = 2 &rarr; 11. &#10003;</li>
</ul>
<ol class="les-steps">
  <li><b>Find the common difference</b> between consecutive terms. If it is not constant, the rule is not linear &mdash; go to second differences.</li>
  <li><b>Write that difference &times; n</b> as the start of the rule.</li>
  <li><b>Compare at n = 1:</b> whatever is missing (or extra) is the number you add or subtract.</li>
  <li><b>Check on another term.</b> A rule that works for n = 1 only is a coincidence, not a rule.</li>
</ol>
<p class="les-h">When the gaps themselves change</p>
${fig(secondDiffSVG(), 'The first gaps are 4, 6, 8, 10 &mdash; not constant, so no rule of the form dn + c can fit. But the <b>second gaps</b> are a constant 2, which is the signature of a squared rule and lets you extend the pattern without one.')}
<ul class="def-list">
  <li>Two families are worth knowing on sight: the <span class="hl">square numbers</span> 1, 4, 9, 16&hellip; with nth term n&sup2;, and the <span class="hl">triangular numbers</span> 1, 3, 6, 10&hellip; with nth term n(n + 1) &divide; 2.</li>
  <li>Constant second differences always mean the rule involves n&sup2;. For example, 2, 6, 12, 20, 30 has second differences of 2, and its nth term is n(n + 1).</li>
</ul>
<div class="kbox"><span class="kbox-tag">Two rules</span><span class="formula">term-to-term: add the common difference<br>position-to-term: nth term = d &times; n + adjust</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127917; Theatre seating</span>
    <p>Row 1 has 10 seats, and each row behind has 4 more: 10, 14, 18, 22&hellip; The nth-term rule is 4n + 6, so row 20 has 4&times;20+6 = <b>86 seats</b> &mdash; no need to count every row in between.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128176; Loan repayments</span>
    <p>A loan balance drops the same amount each month: $2000, $1800, $1600&hellip; The term-to-term rule (subtract 200) predicts next month, but the nth-term rule predicts <b>any</b> month instantly.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127959;&#65039; A growing tiled border</span>
    <p>A tiled border around a growing pool needs 8, 12, 16, 20&hellip; tiles. Spotting the nth-term rule 4n + 4 tells you exactly how many tiles any size pool needs, without building a model first.</p>
  </div>
</div>`,

  expressions: `
<p>A <span class="term">variable</span> is a letter standing in for a number that is unknown or can change. A <span class="term">term</span> is one piece of an expression, like 3x, and the number in front of it (3) is its <span class="term">coefficient</span>.</p>
<p class="les-h">Only like terms combine</p>
${fig(likeTermsSVG(), 'Collecting like terms is sorting, not calculating. The x-tiles gather into 8x and the y-tiles into 2y &mdash; and since an x-tile is not a y-tile, <b>8x + 2y</b> is as far as it goes. It is not "10 of something".')}
<ul class="def-list">
  <li>Like terms have exactly the same letter part <em>and the same power</em>. So 3x + 5x = 8x, but 3x + 2y cannot be combined, and neither can x + x&sup2; &mdash; x&sup2; means x&times;x, a different tile entirely.</li>
  <li>The sign in front belongs to the term. In 7x &minus; 3x + 2, the terms are +7x, &minus;3x and +2, giving <span class="hl">4x + 2</span>.</li>
  <li>Two expressions are <span class="term">equivalent</span> if they give the same value for every substitution. Spot-check by trying a number: 2(x + 3) and 2x + 6 both give 16 at x = 5.</li>
</ul>
<p class="les-h">Expanding is measuring one rectangle twice</p>
${fig(expandAreaSVG(), 'A rectangle 2 tall and (x + 3) wide can be measured whole, or split into a 2-by-x piece and a 2-by-3 piece. Both count the same area, so <b>2(x + 3) = 2x + 6</b> &mdash; the distributive law is not a rule to remember, it is an area seen two ways.')}
<ol class="les-steps">
  <li><b>To expand:</b> multiply <em>every</em> term inside the bracket by what is outside &mdash; a(b + c) = ab + ac.</li>
  <li><b>Watch a negative outside:</b> it flips the sign of every term inside. &minus;2(x &minus; 3) = &minus;2x <span class="hl">+ 6</span>, not &minus;2x &minus; 6.</li>
  <li><b>Then collect like terms</b> in what you have written.</li>
  <li><b>To factorise, run it backwards:</b> find the highest common factor and write it outside a bracket. 6x + 9 = <span class="hl">3(2x + 3)</span>.</li>
  <li><b>Always check by expanding again:</b> 3&times;2x + 3&times;3 = 6x + 9. &#10003;</li>
</ol>
<div class="kbox"><span class="kbox-tag">The engine: distributive property</span><span class="formula">a(b + c) = ab + ac &nbsp;(expanding &mdash; and, reversed, factoring)<br>&minus;2(x &minus; 3) = &minus;2x + 6 &nbsp;(a negative outside flips every sign inside)</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128241; Phone data plan</span>
    <p>A plan costs $20 base plus $5 per GB used. The cost for g GB is the expression <b>20 + 5g</b>. Using 6 GB: 20 + 5&times;6 = <b>$50</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128661; Taxi fare</span>
    <p>A taxi charges a $4 flagfall plus $2 per kilometre: <b>4 + 2k</b>. A 9 km trip costs 4 + 2&times;9 = <b>$22</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127818; Packing lunchboxes</span>
    <p>Packing x apples, and 4 more bananas than apples, means total fruit is x + (x + 4) = <b>2x + 4</b> &mdash; collecting the two like terms (x and x) into 2x.</p>
  </div>
</div>`,

  equations: `
<p>An equation asserts that two expressions name the <span class="hl">same number</span>. Picture a <span class="term">balance scale</span>: the two sides weigh exactly the same, and your job is to get the unknown alone on one pan without ever tipping it.</p>
<p class="les-h">Why "do the same to both sides" is allowed</p>
${fig(balanceSVG(), 'Removing 1 from only one pan would tip the scale and change the problem. Removing it from <b>both</b> keeps the two sides equal, so the new equation has the same solution as the old one. Every legal move is that same argument.')}
<ul class="def-list">
  <li>Solving means finding the value of the unknown that keeps both sides equal. For example, x + 3 = 7 is solved by <span class="hl">x = 4</span>, since 4 + 3 = 7.</li>
  <li>Every step must be a legal move: add, subtract, multiply or divide <span class="hl">both sides equally</span>.</li>
  <li>If the unknown appears on <em>both</em> sides, gather it first. From 3x + 5 = x + 13, subtract x from both sides &rarr; 2x + 5 = 13 &rarr; <span class="hl">x = 4</span>. You are just lifting an x-shaped weight off each pan.</li>
</ul>
<p class="les-h">Undo in the reverse order it was built</p>
${fig(inverseMachineSVG(), 'The expression was built by doubling, then adding 1. To get back you must <b>undo in reverse</b>: subtract 1 first, then halve. Undoing in the order it was built (halving 9 first) gives the wrong answer.')}
<ol class="les-steps">
  <li><b>Simplify each side</b> &mdash; expand brackets, collect like terms.</li>
  <li><b>Gather the unknowns on one side</b>, the plain numbers on the other.</li>
  <li><b>Undo the operations in reverse order</b>: additions and subtractions first, then the multiplication or division.</li>
  <li><b>Substitute your answer back</b> into the <em>original</em> equation. Both sides must come out equal &mdash; this catches nearly every slip.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Legal moves</span><span class="formula">do the SAME thing to both sides<br>undo operations in reverse</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128179; Saving for a skateboard</span>
    <p>You have $35 saved and want a $95 skateboard, saving $12 a week: 35 + 12w = 95 &rarr; 12w = 60 &rarr; <b>w = 5 weeks</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127777;&#65039; Temperature conversion</span>
    <p>F = 1.8C + 32. If today is 68&deg;F: 1.8C + 32 = 68 &rarr; 1.8C = 36 &rarr; <b>C = 20&deg;C</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127909; Movie tickets</span>
    <p>A group booking costs an $8 fee plus $14 per ticket. If the total was $92: 8 + 14t = 92 &rarr; 14t = 84 &rarr; <b>t = 6 tickets</b>.</p>
  </div>
</div>`,

  inequalities: `
<p>An <span class="term">inequality</span> (&gt;, &lt;, &ge;, &le;) describes a whole <span class="hl">range</span> of solutions rather than a single value &mdash; a stretch of the number line instead of one point on it.</p>
<p class="les-h">Reading the ends: open or filled</p>
${fig(inequalityLineSVG(), 'The arrow shows which way the solutions run; the circle at the end says whether the boundary itself counts. <b>Open</b> for a strict &lt; or &gt;, <b>filled</b> for &le; or &ge;. Everything else about the two lines is identical.')}
<ul class="def-list">
  <li>A strict inequality (&lt;, &gt;) excludes its endpoint: for x &lt; 5, the value 5 is not a solution.</li>
  <li>&le; and &ge; include theirs: for x &ge; 3, the value 3 <em>is</em> a solution &mdash; and questions are often decided exactly there.</li>
  <li>Many real limits are ranges, not single numbers &mdash; a lift limit w &le; 500 kg, a ride needing h &ge; 120 cm.</li>
</ul>
<p class="les-h">The one exception: multiplying or dividing by a negative</p>
${fig(flipSignSVG(), 'Multiplying by a negative <b>reflects</b> the number line through zero. 2 sits left of 4, but &minus;2 sits <em>right</em> of &minus;4 &mdash; the reflection swaps their order, so the inequality sign has to swap with it.')}
<ol class="les-steps">
  <li><b>Solve exactly as you would an equation</b> &mdash; the same legal moves apply.</li>
  <li><b>The moment you multiply or divide by a negative, flip the sign.</b> For example, &minus;2x &lt; 6 &rarr; divide by &minus;2 &rarr; <span class="hl">x &gt; &minus;3</span>.</li>
  <li><b>Draw the solution</b> on a number line, choosing an open or filled circle to match the sign.</li>
  <li><b>Test one value from inside your range</b> in the original inequality. If it fails, the sign was flipped the wrong way.</li>
</ol>
<div class="kbox"><span class="kbox-tag">The exception</span><span class="formula">&times; or &divide; by a NEGATIVE &rarr; reverse the inequality sign</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128663; A speed limit sign</span>
    <p>A sign reads "speed &le; 50 km/h". Any speed from 0 up to <em>and including</em> 50 is legal &mdash; not only exactly 50.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127905; A rollercoaster height rule</span>
    <p>A ride requires height &ge; 120 cm. A rider exactly 120 cm tall is allowed on; someone even 1 cm shorter is turned away.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127871; A party snack budget</span>
    <p>You have $150 for snacks at $6 each: 6n &le; 150 &rarr; n &le; 25. You can buy <b>up to 25 items</b> without going over budget.</p>
  </div>
</div>`,

  graphs: `
<p>The <span class="hl">coordinate plane</span> locates every point with an ordered pair (x, y): across first, then up. A straight-line graph is simply the picture of <em>every</em> pair that makes an equation true.</p>
<p class="les-h">Reading m and c straight off the picture</p>
${fig(linearGraphSVG(), 'In <b>y = mx + c</b>, the c is where the line crosses the y-axis, and the m is the shape of the step: go <b>1 across</b> and the line climbs <b>2 up</b>, so m = 2. Both letters are things you can point at.')}
<ul class="def-list">
  <li>A point lies on the line exactly when its coordinates satisfy the equation. For example, (1, 3) is on y = 2x + 1 because 2&times;1 + 1 = 3; (1, 5) is not.</li>
  <li>The <span class="term">gradient</span> m is rise &divide; run &mdash; how much y changes for one step of x. A bigger m is a steeper line; a negative m slopes downhill.</li>
  <li>The <span class="term">y-intercept</span> c is the value of y when x = 0, so it is the line's starting height &mdash; a flagfall, a base fee, a head start.</li>
  <li>Lines with the same gradient are parallel: y = 2x + 1 and y = 2x &minus; 4 climb identically and never meet.</li>
</ul>
<p class="les-h">Plotting a line by hand</p>
${fig(plotFromTableSVG(), 'Every row of the table is one point on the grid. Work out all three <em>before</em> plotting any of them &mdash; then if the three do not fall in a straight line, you have caught an arithmetic slip rather than drawn it.')}
<ol class="les-steps">
  <li><b>Pick three easy x-values</b> &mdash; 0, 1 and 2 will do for almost any question.</li>
  <li><b>Substitute each into the equation</b> and write the (x, y) pair down before plotting anything.</li>
  <li><b>Plot the points and join them</b> with a ruled straight line, extending past the outer points.</li>
  <li><b>Check with the third point.</b> Three points that are not in a straight line mean an arithmetic slip &mdash; which is exactly why you plot three and not two.</li>
</ol>
<div class="kbox"><span class="kbox-tag">y = 2x &minus; 1, worked point by point</span><span class="formula">x=0: y=2(0)&minus;1=&minus;1 &rarr; (0,&minus;1)<br>x=1: y=2(1)&minus;1=1 &rarr; (1,1)<br>x=2: y=2(2)&minus;1=3 &rarr; (2,3)</span></div>
<div class="kbox"><span class="kbox-tag">Line equation</span><span class="formula">y = mx + c<br>m = gradient = rise &divide; run<br>c = y-intercept</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128241; Comparing phone plans</span>
    <p>Plan A costs y = 20 (a flat fee, no per-GB charge). Plan B costs y = 5g + 5. Graphing both lines shows exactly where B becomes cheaper or pricier as data use (g) grows.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128692; A cyclist's distance-time graph</span>
    <p>A cyclist's distance from home is graphed against time. A steeper line means faster travel (a bigger gradient); a flat, horizontal section means the cyclist has stopped.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128506;&#65039; A treasure map</span>
    <p>A map marks treasure at (4, 3) &mdash; 4 steps east, then 3 steps north from the corner. Every map, game and GPS app is really a coordinate plane in disguise.</p>
  </div>
</div>`,

};
