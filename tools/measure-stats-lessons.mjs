// tools/measure-stats-lessons.mjs
//
// "Read the chapter" content for the Measurement strand (perimeter & area, volume, conversions) and
// the Statistics strand (data & averages, probability), rewritten to the shape used by
// geometry-lessons.mjs, number-lessons.mjs and algebra-lessons.mjs.
//
// The two strands share a file because each is small, and because both turn on the same habit: know
// what is being measured before reaching for a formula. Perimeter versus area, volume versus surface
// area, mean versus median, and "one trial" versus "many trials" are all the same kind of confusion,
// and every figure here is chosen to separate the pair it belongs to.
//
// Consumed by lesson-content.mjs, which spreads MEASURE_STATS_LESSONS into LESSON_EXPANSIONS.

import { C, r1, svg, fig, txt, line, rect, arrow, cuboidNetSVG } from './svg-kit.mjs';

// ---------------------------------------------------------------------------
// Figure builders
// ---------------------------------------------------------------------------

// Perimeter and area on the same rectangle, so the difference is one picture rather than two
// definitions: a traced edge against a tiled inside.
function perimeterVsAreaSVG() {
  const U = 22, w = 5, h = 3, XA = 24, XB = 210, Y = 34;
  let g = '';
  // Left: perimeter as a traced edge with each side counted.
  g += rect(XA, Y, w * U, h * U, { r: 0, fill: C.paper, stroke: C.brand, sw: 3.5 });
  g += txt(XA + (w * U) / 2, Y - 9, '5', { size: 11.5, mono: true, fill: C.brandDeep });
  g += txt(XA + (w * U) / 2, Y + h * U + 16, '5', { size: 11.5, mono: true, fill: C.brandDeep });
  g += txt(XA - 12, Y + (h * U) / 2 + 4, '3', { size: 11.5, mono: true, fill: C.brandDeep });
  g += txt(XA + w * U + 12, Y + (h * U) / 2 + 4, '3', { size: 11.5, mono: true, fill: C.brandDeep });
  g += txt(XA + (w * U) / 2, Y + h * U + 40, 'PERIMETER', { size: 11, fill: C.brandDeep });
  g += txt(XA + (w * U) / 2, Y + h * U + 55, '5+3+5+3 = 16 cm', { size: 11, mono: true, fill: C.ink });
  g += txt(XA + (w * U) / 2, Y + h * U + 70, 'a length &mdash; walk the edge', { size: 9.5, fill: C.inkSoft, weight: 600 });
  // Right: area as counted unit squares.
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      g += rect(XB + c * U, Y + r * U, U, U, { r: 0, fill: C.greenTint, stroke: C.green, sw: 1 });
    }
  }
  g += rect(XB, Y, w * U, h * U, { r: 0, fill: 'none', stroke: C.green, sw: 2 });
  g += txt(XB + (w * U) / 2, Y + h * U + 40, 'AREA', { size: 11, fill: C.greenInk });
  g += txt(XB + (w * U) / 2, Y + h * U + 55, '5 &times; 3 = 15 cm&sup2;', { size: 11, mono: true, fill: C.ink });
  g += txt(XB + (w * U) / 2, Y + h * U + 70, 'a covering &mdash; count the squares', { size: 9.5, fill: C.inkSoft, weight: 600 });
  return svg(360, Y + h * U + 82, 'The same 5 by 3 rectangle shown twice: once with its edge traced for perimeter, once tiled with fifteen unit squares for area', g, 350);
}

// Why a triangle is half a rectangle, and why a parallelogram is not. Both formulas fall out of the
// same move: cut a piece off and slide it to the other end.
function areaFormulasSVG() {
  const U = 22, X = 26, Y = 30, w = 4, h = 3;
  let g = '';
  // Triangle inside its bounding rectangle.
  g += rect(X, Y, w * U, h * U, { r: 0, fill: 'none', stroke: C.inkSoft, sw: 1.2, dash: '4 3' });
  g += `<polygon points="${X},${Y + h * U} ${X + w * U},${Y + h * U} ${X + w * U * 0.35},${Y}" fill="${C.brandTint}" stroke="${C.brand}" stroke-width="1.8"/>`;
  g += line(X + w * U * 0.35, Y, X + w * U * 0.35, Y + h * U, C.amber, 1.6, '3 3');
  g += rect(X + w * U * 0.35, Y + h * U - 8, 8, 8, { r: 0, fill: 'none', stroke: C.amber, sw: 1.2 });
  g += txt(X + w * U * 0.35 + 22, Y + (h * U) / 2, 'height', { size: 9.5, fill: C.marigoldInk });
  g += txt(X + (w * U) / 2, Y + h * U + 16, 'base', { size: 9.5, fill: C.inkSoft, weight: 600 });
  g += txt(X + (w * U) / 2, Y + h * U + 36, 'half the rectangle', { size: 10.5, fill: C.brandDeep });
  g += txt(X + (w * U) / 2, Y + h * U + 51, 'A = &frac12; b h', { size: 12, mono: true, fill: C.ink });
  // Parallelogram sheared back into a rectangle.
  const X2 = 216, S = 20;
  g += `<polygon points="${X2 + S},${Y} ${X2 + S + w * U},${Y} ${X2 + w * U},${Y + h * U} ${X2},${Y + h * U}" fill="${C.greenTint}" stroke="${C.green}" stroke-width="1.8"/>`;
  g += `<polygon points="${X2 + S},${Y} ${X2 + S},${Y + h * U} ${X2},${Y + h * U}" fill="${C.marigoldTint}" stroke="${C.marigoldInk}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
  g += arrow(X2 + 8, Y + h * U + 12, X2 + w * U + 4, Y + h * U + 12, C.marigoldInk, 1.5);
  g += txt(X2 + (w * U) / 2, Y + h * U + 28, 'slide the corner across', { size: 9.5, fill: C.marigoldInk, weight: 600 });
  g += txt(X2 + (w * U) / 2, Y + h * U + 48, 'becomes a rectangle', { size: 10.5, fill: C.greenInk });
  g += txt(X2 + (w * U) / 2, Y + h * U + 63, 'A = b h', { size: 12, mono: true, fill: C.ink });
  return svg(360, Y + h * U + 76, 'A triangle drawn inside its bounding rectangle, and a parallelogram with a corner triangle sliding across to make a rectangle', g, 350);
}

// Volume as stacked layers. "Base area times height" stops being a formula and becomes a count of
// how many cubes tile one layer, times how many layers there are.
function volumeLayersSVG() {
  const U = 17, DX = 9, DY = -6, X = 40, Y = 118, w = 3, d = 2, layers = 4;
  const P = (cx, cy, cz) => [r1(X + cx * U + cz * DX), r1(Y - cy * U + cz * DY)];
  let g = '';
  // Draw back-to-front so nearer cubes overlap the ones behind.
  for (let z = d - 1; z >= 0; z--) {
    for (let y = 0; y < layers; y++) {
      for (let x = 0; x < w; x++) {
        const [px, py] = P(x, y, z);
        const top = `${px},${py - U} ${px + DX},${py - U + DY} ${px + U + DX},${py - U + DY} ${px + U},${py - U}`;
        const side = `${px + U},${py - U} ${px + U + DX},${py - U + DY} ${px + U + DX},${py + DY} ${px + U},${py}`;
        g += `<polygon points="${top}" fill="${y === 0 ? C.brandTint : C.paper}" stroke="${C.brand}" stroke-width="1"/>`;
        g += `<polygon points="${side}" fill="${C.brandTint}" stroke="${C.brand}" stroke-width="1"/>`;
        g += rect(px, py - U, U, U, { r: 0, fill: y === 0 ? '#D5DCF5' : C.paper, stroke: C.brand, sw: 1 });
      }
    }
  }
  const [bx, by] = P(0, 0, 0);
  g += txt(bx + 34, by + 22, 'one layer = 3 &times; 2 = 6 cubes', { size: 10.5, fill: C.brandDeep });
  g += arrow(X - 14, Y - 2, X - 14, Y - layers * U + 4, C.green, 1.8);
  g += txt(X - 26, Y - (layers * U) / 2, '4 layers', { size: 10, fill: C.greenInk, rotate: -90 });
  g += txt(196, 44, 'V = base area &times; height', { size: 12, mono: true, anchor: 'start', fill: C.ink });
  g += txt(196, 62, '= 6 &times; 4 = 24 cm&sup3;', { size: 12, mono: true, anchor: 'start', fill: C.greenInk });
  g += txt(196, 86, 'Surface area is a different', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(196, 99, 'question about the same box:', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(196, 112, 'the skin, not the filling.', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(370, 148, 'A cuboid drawn as four stacked layers of six unit cubes, giving a volume of twenty-four', g, 350);
}

// The metric ladder. Every prefix is a rung, and converting is counting rungs — which is also why
// the decimal point is all that ever moves.
function metricLadderSVG() {
  const rungs = [['km', '1000 m'], ['m', '100 cm'], ['cm', '10 mm'], ['mm', '']];
  const X = 60, Y = 26, RH = 40, BW = 72;
  let g = '';
  rungs.forEach((r, i) => {
    const y = Y + i * RH;
    g += rect(X, y, BW, 28, { r: 8, fill: C.brandTint, stroke: C.brand, sw: 1.4 });
    g += txt(X + BW / 2, y + 19, r[0], { size: 14, mono: true, fill: C.brandDeep });
    if (i < rungs.length - 1) {
      const step = i === 0 ? '1000' : i === 1 ? '100' : '10';
      g += arrow(X + BW + 10, y + 20, X + BW + 10, y + RH + 2, C.green, 1.6);
      g += txt(X + BW + 18, y + RH - 6, '&times; ' + step, { size: 10.5, mono: true, anchor: 'start', fill: C.greenInk });
      g += arrow(X - 10, y + RH + 2, X - 10, y + 20, C.amber, 1.6);
      g += txt(X - 18, y + RH - 6, '&divide; ' + step, { size: 10.5, mono: true, anchor: 'end', fill: C.marigoldInk });
    }
  });
  g += txt(X + BW / 2, Y - 10, 'big unit', { size: 10, fill: C.inkSoft, weight: 600 });
  g += txt(X + BW / 2, Y + rungs.length * RH - 4, 'small unit', { size: 10, fill: C.inkSoft, weight: 600 });
  g += txt(230, 60, 'DOWN the ladder:', { size: 11, anchor: 'start', fill: C.greenInk });
  g += txt(230, 76, 'smaller unit, bigger number', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(230, 104, 'UP the ladder:', { size: 11, anchor: 'start', fill: C.marigoldInk });
  g += txt(230, 120, 'bigger unit, smaller number', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(230, 146, '2.5 km = 2500 m', { size: 11.5, mono: true, anchor: 'start', fill: C.ink });
  return svg(400, Y + rungs.length * RH + 6, 'A ladder of metric units from kilometres down to millimetres with multiply and divide arrows between the rungs', g, 350);
}

// The speed triangle: cover the quantity you want and the arrangement of the other two is the
// formula. It is a memory aid, but it is one that also shows why the three rearrangements agree.
function speedTriangleSVG() {
  const CX = 82, TOP = 16, BOT = 118, HW = 66;
  let g = `<polygon points="${CX},${TOP} ${CX - HW},${BOT} ${CX + HW},${BOT}" fill="${C.brandTint}" stroke="${C.brand}" stroke-width="2"/>`;
  g += line(CX - 33, 70, CX + 33, 70, C.brand, 1.8);
  g += line(CX, 70, CX, BOT, C.brand, 1.8);
  g += txt(CX, 56, 'd', { size: 20, mono: true, fill: C.brandDeep });
  g += txt(CX - 32, 100, 's', { size: 20, mono: true, fill: C.brandDeep });
  g += txt(CX + 32, 100, 't', { size: 20, mono: true, fill: C.brandDeep });
  g += txt(CX, BOT + 18, 'distance, speed, time', { size: 10, fill: C.inkSoft, weight: 600 });
  const rows = [['cover d', 'd = s &times; t'], ['cover s', 's = d &divide; t'], ['cover t', 't = d &divide; s']];
  rows.forEach((r, i) => {
    const y = 34 + i * 34;
    g += rect(184, y - 16, 176, 26, { r: 7, fill: C.paper, stroke: C.line, sw: 1.2 });
    g += txt(194, y + 2, r[0], { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
    g += txt(258, y + 2, r[1], { size: 12.5, mono: true, anchor: 'start', fill: C.ink });
  });
  g += txt(184, 142, 'match the units first &mdash; 30 min is 0.5 h', { size: 10, anchor: 'start', fill: C.red, weight: 700 });
  return svg(370, 152, 'A triangle with distance on top and speed and time below, giving the three rearrangements of the speed formula', g, 350);
}

// A dot plot with mean, median and mode marked, and one outlier doing the damage. Choosing an average
// is a judgement, and this is the picture the judgement is made from.
function averagesSVG() {
  const data = [2, 3, 3, 3, 4, 5, 5, 6, 18];
  const X0 = 26, X1 = 336, lo = 0, hi = 20, BASE = 96, R = 6.5;
  const at = (v) => r1(X0 + ((v - lo) / (hi - lo)) * (X1 - X0));
  let g = line(X0, BASE, X1, BASE, C.inkSoft, 1.8);
  for (let v = 0; v <= 20; v += 2) {
    g += line(at(v), BASE - 4, at(v), BASE + 4, C.inkSoft, 1.1);
    g += txt(at(v), BASE + 18, String(v), { size: 9.5, mono: true, fill: C.inkSoft });
  }
  const stackCount = {};
  data.forEach((v) => {
    stackCount[v] = (stackCount[v] || 0) + 1;
    const cy = BASE - 10 - (stackCount[v] - 1) * (R * 2 + 2);
    const far = v > 12;
    g += `<circle cx="${at(v)}" cy="${cy}" r="${R}" fill="${far ? C.redTint : C.brandTint}" stroke="${far ? C.red : C.brand}" stroke-width="1.6"/>`;
  });
  const marker = (v, label, color, dy) => {
    let s = line(at(v), BASE + 6, at(v), BASE + 26 + dy, color, 1.6, '3 3');
    s += txt(at(v), BASE + 38 + dy, label, { size: 10.5, fill: color });
    return s;
  };
  g += marker(4, 'median 4', C.green, 0);
  g += marker(3, 'mode 3', C.violet, 18);
  g += marker(5.4, 'mean 5.4', C.amber, 36);
  g += txt(at(18), BASE - 34, 'outlier', { size: 10, fill: C.red });
  g += arrow(at(18), BASE - 28, at(18), BASE - 18, C.red, 1.4);
  g += txt(X0, 16, 'One value far from the rest drags the MEAN up past almost every data point.',
    { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(X0, 30, 'The median barely moves &mdash; which is why house prices are quoted as medians.',
    { size: 10.5, anchor: 'start', fill: C.inkSoft, weight: 600 });
  return svg(360, BASE + 82, 'A dot plot with a cluster of small values and one outlier at eighteen, with the mean pulled to the right of the median', g, 350);
}

// The 0-to-1 scale, with words placed where they actually belong. "Likely" is not a number, and this
// is where the number lives.
function probScaleSVG() {
  const X0 = 30, X1 = 330, Y = 54;
  const at = (p) => r1(X0 + p * (X1 - X0));
  let g = `<defs><linearGradient id="pgrad" x1="0" x2="1"><stop offset="0" stop-color="${C.redTint}"/><stop offset="0.5" stop-color="${C.marigoldTint}"/><stop offset="1" stop-color="${C.greenTint}"/></linearGradient></defs>`;
  g += `<rect x="${X0}" y="${Y - 11}" width="${X1 - X0}" height="22" rx="11" fill="url(#pgrad)" stroke="${C.inkSoft}" stroke-width="1.2"/>`;
  const marks = [[0, '0', 'impossible'], [0.25, '&frac14;', 'unlikely'], [0.5, '&frac12;', 'even chance'], [0.75, '&frac34;', 'likely'], [1, '1', 'certain']];
  marks.forEach((m) => {
    g += line(at(m[0]), Y - 11, at(m[0]), Y + 11, C.inkSoft, 1.4);
    g += txt(at(m[0]), Y - 20, m[1], { size: 12, mono: true, fill: C.ink });
    g += txt(at(m[0]), Y + 28, m[2], { size: 9.5, fill: C.inkSoft, weight: 600 });
  });
  g += `<circle cx="${at(1 / 6)}" cy="${Y}" r="6" fill="${C.brand}"/>`;
  g += txt(at(1 / 6), Y + 50, 'rolling a 6', { size: 10, fill: C.brandDeep });
  g += txt(at(1 / 6), Y + 62, 'P = 1/6', { size: 10, mono: true, fill: C.brandDeep });
  g += `<circle cx="${at(0.5)}" cy="${Y}" r="6" fill="${C.violet}"/>`;
  g += txt(at(0.5), Y + 62, 'a coin landing heads', { size: 10, fill: C.violet });
  return svg(360, Y + 74, 'A probability scale from 0 to 1 labelled impossible, unlikely, even chance, likely and certain, with two events marked', g, 350);
}

// A tree diagram for two coins, because the classic wrong answer (three outcomes) comes from not
// listing the sample space — and a tree lists it for you.
function coinTreeSVG() {
  const X0 = 40, X1 = 130, X2 = 236, Y = 78;
  const nodeR = 15;
  const leaf = (y, label, highlight) =>
    rect(X2, y - 14, 46, 28, { r: 8, fill: highlight ? C.greenTint : C.paper, stroke: highlight ? C.green : C.line, sw: highlight ? 1.8 : 1.2 }) +
    txt(X2 + 23, y + 5, label, { size: 13, mono: true, fill: highlight ? C.greenInk : C.ink });
  let g = line(X0, Y, X1 - nodeR, 42, C.inkSoft, 1.5) + line(X0, Y, X1 - nodeR, 114, C.inkSoft, 1.5);
  g += txt(X0 + 34, 46, 'H', { size: 11, mono: true, fill: C.inkSoft });
  g += txt(X0 + 34, 116, 'T', { size: 11, mono: true, fill: C.inkSoft });
  [[42, 'H'], [114, 'T']].forEach(([cy, label]) => {
    g += `<circle cx="${X1}" cy="${cy}" r="${nodeR}" fill="${C.brandTint}" stroke="${C.brand}" stroke-width="1.6"/>`;
    g += txt(X1, cy + 5, label, { size: 13, mono: true, fill: C.brandDeep });
    g += line(X1 + nodeR, cy, X2 - 4, cy - 20, C.inkSoft, 1.5);
    g += line(X1 + nodeR, cy, X2 - 4, cy + 20, C.inkSoft, 1.5);
  });
  g += `<circle cx="${X0}" cy="${Y}" r="${nodeR}" fill="${C.paper}" stroke="${C.inkSoft}" stroke-width="1.6"/>`;
  g += txt(X0, Y + 5, 'start', { size: 8.5, fill: C.inkSoft });
  g += leaf(22, 'HH', false) + leaf(62, 'HT', true) + leaf(94, 'TH', true) + leaf(134, 'TT', false);
  g += txt(300, 22, '4 equally', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(300, 34, 'likely', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(300, 46, 'outcomes', { size: 10, anchor: 'start', fill: C.inkSoft, weight: 600 });
  g += txt(300, 78, 'exactly one', { size: 10, anchor: 'start', fill: C.greenInk });
  g += txt(300, 90, 'head: 2 of 4', { size: 10, anchor: 'start', fill: C.greenInk });
  g += txt(300, 106, '= 1/2', { size: 12, mono: true, anchor: 'start', fill: C.greenInk });
  return svg(370, 158, 'A tree diagram for tossing two coins, branching to the four outcomes HH, HT, TH and TT', g, 350);
}

// ---------------------------------------------------------------------------
// The lessons
// ---------------------------------------------------------------------------

export const MEASURE_STATS_LESSONS = {

  'perimeter-area': `
<p><span class="term">Perimeter</span> is the distance around the edge of a shape &mdash; a length. <span class="term">Area</span> is the space inside it &mdash; a covering, counted in <span class="hl">unit squares</span>. They measure different things, so they are never interchangeable.</p>
<p class="les-h">Two questions about one shape</p>
${fig(perimeterVsAreaSVG(), 'Perimeter walks the edge and is measured in cm; area tiles the inside and is measured in cm&sup2;. That little <b>&sup2;</b> is not decoration &mdash; it is the reminder that you counted squares, not steps.')}
<ul class="def-list">
  <li>Perimeter and area are independent. A 1 &times; 8 rectangle has perimeter 18 but area 8, while a 4 &times; 4 square has a <em>smaller</em> perimeter (16) and a bigger area (16).</li>
  <li>Area units are always squared: cm&sup2;, m&sup2;, km&sup2;. An answer to an area question without the square is only half an answer.</li>
</ul>
<p class="les-h">Where the formulas come from</p>
${fig(areaFormulasSVG(), 'A triangle fills exactly <b>half</b> the rectangle around it, which is the &frac12; in &frac12;bh. A parallelogram is a rectangle with one corner slid along, so no area is gained or lost &mdash; hence simply bh. Notice the height is the <b>perpendicular</b> one, never the slanted side.')}
<ul class="def-list">
  <li>Rectangle = length &times; width. Triangle = <span class="hl">&frac12; &times; base &times; height</span>. Parallelogram = base &times; height. For example, a triangle with base 8 cm and height 5 cm has area &frac12; &times; 8 &times; 5 = 20 cm&sup2;.</li>
  <li>A <span class="term">trapezium</span> has one pair of parallel sides (a and b, h apart) and area <span class="hl">&frac12;(a + b) &times; h</span> &mdash; average the parallel sides, then multiply by the height. For a = 6, b = 10, h = 4: &frac12; &times; 16 &times; 4 = 32.</li>
  <li>"Height" always means the <span class="term">perpendicular height</span>, measured at a right angle to the base. Using the slanted side is the most common wrong answer in this chapter.</li>
</ul>
<ol class="les-steps">
  <li><b>Decide which question is being asked</b> &mdash; edge or inside, cm or cm&sup2;.</li>
  <li><b>For a compound shape, split it</b> into rectangles and triangles, and mark every length you know on the diagram.</li>
  <li><b>Find the missing lengths</b> from the ones given &mdash; opposite sides of the whole shape must still agree.</li>
  <li><b>Work out each piece, then add</b> (or subtract, for a cut-out), and write the units.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Key areas</span><span class="formula">rectangle = l &times; w<br>triangle = &frac12; &times; b &times; h<br>parallelogram = b &times; h<br>trapezium = &frac12;(a + b) &times; h</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128679; Fencing a garden</span>
    <p>A rectangular garden is 8 m by 5 m. Fencing needs the <b>perimeter</b>: 2 &times; (8+5) = <b>26 m</b> of fence.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129529; Carpeting a room</span>
    <p>A room is 4 m by 3.5 m. Carpet needed is the <b>area</b>: 4 &times; 3.5 = <b>14 m&sup2;</b> &mdash; carpet is bought by area, not by the length of the walls.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128204; Two paddocks, same fence</span>
    <p>A 10 m &times; 10 m paddock has perimeter 40 m and area 100 m&sup2;. An 18 m &times; 2 m paddock also has perimeter 40 m, but only <b>36 m&sup2;</b> &mdash; the same fencing can enclose very different areas.</p>
  </div>
</div>`,

  volume: `
<p><span class="term">Volume</span> measures how much space a 3-D solid fills, in <span class="hl">cubic</span> units. <span class="term">Surface area</span> measures the total area of its faces &mdash; the filling versus the skin.</p>
<p class="les-h">Volume is layers of unit cubes</p>
${fig(volumeLayersSVG(), 'Tile the base with unit cubes, then stack that layer as many times as the solid is tall. That is exactly what <b>V = base area &times; height</b> counts &mdash; and it works for any prism, not only boxes.')}
<ul class="def-list">
  <li>For any prism, volume = base area &times; height. For example, a box with base 3 &times; 2 = 6 and height 4 has volume 6 &times; 4 = <span class="hl">24 cm&sup3;</span>.</li>
  <li>Capacity is the same measurement wearing a different unit: a cube 10 cm on each side holds 1000 cm&sup3;, which is defined as <span class="hl">1 litre</span>.</li>
  <li>To find a side length back from a volume you <span class="term">undo the cube</span>. For 64 cm&sup3;: 3&sup3; = 27 is too small, 4&sup3; = 64 fits &mdash; so the side is <span class="hl">4 cm</span>.</li>
  <li>Scaling behaves differently in 3-D: double every edge of a cube and the volume becomes <b>8 times</b> bigger (2&sup3;), not twice. A 2 cm cube (8 cm&sup3;) becomes a 4 cm cube (64 cm&sup3;).</li>
</ul>
<p class="les-h">Surface area: three pairs, add, then double</p>
<ol class="les-steps">
  <li><b>Decide which is wanted:</b> how much it <em>holds</em> is volume; how much <em>wraps</em> it is surface area.</li>
  <li><b>For volume, find the base area</b>, then multiply by the height. Units are cubed.</li>
  <li><b>For a cuboid's surface area</b>, note the 6 faces come in 3 matching pairs. Find one from each pair, add the three, then double. For a 4 &times; 3 &times; 2 box: 12 + 8 + 6 = 26, doubled = <span class="hl">52 cm&sup2;</span>.</li>
  <li><b>Check the units</b> &mdash; cm&sup3; for volume, cm&sup2; for surface area. Getting these the wrong way round is the fastest way to spot your own mistake.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Prism &amp; capacity</span><span class="formula">V = base area &times; height<br>SA of a cuboid = 2(lw + lh + wh)<br>1 litre = 1000 cm&sup3;</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128031; Filling a fish tank</span>
    <p>A tank is 60 &times; 30 &times; 40 cm: volume = 72,000 cm&sup3;. Since 1000 cm&sup3; = 1 litre, that's <b>72 litres</b> of water to fill it.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128230; A shipping box</span>
    <p>A box is 50 &times; 40 &times; 30 cm (60,000 cm&sup3;). Doubling every dimension to 100 &times; 80 &times; 60 cm doesn't just double the volume &mdash; it makes it <b>8 times</b> bigger (480,000 cm&sup3;).</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127873; Wrapping a gift</span>
    <p>Wrapping paper needed is the box's <b>surface area</b> (every face added up); how much it can hold is its <b>volume</b> &mdash; two different questions about the very same box.</p>
  </div>
  <div class="rw-card">
    ${cuboidNetSVG(4, 3, 2)}
    <span class="rw-tag">&#128230; Unfolding a cereal box (4 &times; 3 &times; 2 cm)</span>
    <p>Top &amp; bottom: 4&times;3 = 12 cm&sup2; each. Front &amp; back: 4&times;2 = 8 cm&sup2; each. Left &amp; right: 3&times;2 = 6 cm&sup2; each.</p>
    <p>SA = 2&times;(12 + 8 + 6) = 2&times;26 = <b>52 cm&sup2;</b> &mdash; the flattened net above shows exactly these 6 pieces.</p>
  </div>
</div>`,

  conversions: `
<p>The metric system runs on <span class="hl">powers of ten</span>, so converting between units never involves anything harder than moving a decimal point. The skill is knowing which way it moves.</p>
<p class="les-h">The ladder of units</p>
${fig(metricLadderSVG(), 'Going <b>down</b> to a smaller unit multiplies, so the number gets <em>bigger</em> &mdash; 2.5 km is 2500 m, because a metre is a smaller ruler and you need more of them. Going up divides. If your answer moved the wrong way, you climbed the wrong direction.')}
<ul class="def-list">
  <li>1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm; and for capacity, 1 L = 1000 ml. Converting to a <em>smaller</em> unit always gives a <em>bigger</em> number.</li>
  <li>The same ladder works for mass (kg, g, mg) and capacity (L, ml), because the prefixes mean the same thing everywhere.</li>
  <li>Mixing units mid-calculation is the classic slip. Convert everything to one unit <em>first</em>, before any arithmetic.</li>
</ul>
<p class="les-h">Rates and the speed triangle</p>
${fig(speedTriangleSVG(), 'Cover the quantity you want, and the layout of the other two <em>is</em> the formula. Side by side means multiply; one over the other means divide. All three arrangements say the same thing, so any one of them can be checked against another.')}
<ul class="def-list">
  <li>A <span class="term">rate</span> combines two different kinds of unit &mdash; km per hour, dollars per kilogram, mg per kg of body weight.</li>
  <li>speed = distance &divide; time, rearranging to distance = speed &times; time and time = distance &divide; speed. For example, 150 km in 3 h is <span class="hl">50 km/h</span>.</li>
  <li>Units must match before you calculate. For 24 km in 30 min, convert 30 min = 0.5 h first: 24 &divide; 0.5 = <span class="hl">48 km/h</span>. Dividing by 30 gives a nonsense answer.</li>
  <li>Speed has two common outfits. To convert km/h to m/s, divide by 3.6 (1000 m &divide; 3600 s), so 90 km/h = <b>25 m/s</b>.</li>
</ul>
<ol class="les-steps">
  <li><b>Write down what unit the answer must be in</b> before you start.</li>
  <li><b>Convert every quantity into matching units</b> &mdash; minutes to hours, cm to m.</li>
  <li><b>Pick the arrangement</b> from the triangle and substitute.</li>
  <li><b>Sanity-check the size:</b> a car at 48 km/h is believable, one at 0.8 km/h is not.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Speed relationship</span><span class="formula">speed = distance &divide; time (rearranges three ways)<br>km/h &rarr; m/s: &divide; 3.6</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127859; Following a recipe</span>
    <p>A recipe needs 250 ml of milk, but your jug is marked in litres. Since 1 L = 1000 ml, 250 ml = <b>0.25 L</b> &mdash; converting first avoids pouring the wrong amount.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#9992;&#65039; Planning a road trip</span>
    <p>A trip is 360 km at 90 km/h. Time = distance &divide; speed = 360 &divide; 90 = <b>4 hours</b> &mdash; but only once both are already in matching units.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128138; Reading a medicine dose</span>
    <p>A label says 5 mg per kg of body weight. For a 20 kg child, that's 5 &times; 20 = <b>100 mg</b> &mdash; mixing up mg and g here could mean a dose 1000 times too strong.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128692; A cyclist's mixed-unit speed</span>
    <p>A cyclist rides 24 km in 30 minutes. 30 minutes is <b>0.5 hours</b> &mdash; convert the time first: speed = 24 &divide; 0.5 = <b>48 km/h</b>. Dividing 24 by "30" (forgetting the unit switch) gives a wrong, much smaller answer.</p>
  </div>
</div>`,

  statistics: `
<p>Statistics summarise a whole set of data with a single number. There are three different "averages", and choosing the right one is itself the skill &mdash; they can disagree wildly about the same data.</p>
<p class="les-h">Three averages, one data set</p>
${fig(averagesSVG(), 'Eight values sit between 2 and 6, and one sits at 18. The <b>mode</b> and <b>median</b> stay with the crowd, but the <b>mean</b> is dragged up to 5.4 &mdash; higher than all but one of the readings. Neither average is wrong; they answer different questions.')}
<ul class="def-list">
  <li>The <span class="term">mean</span> is the fair-share average: add every value, divide by how many. For example, the mean of 4, 6, 8 is 18 &divide; 3 = <span class="hl">6</span>.</li>
  <li>The <span class="term">median</span> is the middle value once the data is <em>in order</em>. With an even count there is no single middle, so average the two middle values: for 4, 6, 8, 10 the median is <span class="hl">7</span>.</li>
  <li>The <span class="term">mode</span> is the most common value &mdash; the only average that also works for non-numbers like shoe colour.</li>
  <li>The <span class="term">range</span> (max &minus; min) describes <em>spread</em>, not centre. Two classes can share a mean of 60 while one ranges 55&ndash;65 and the other 20&ndash;100.</li>
  <li>The mean need not be one of the actual values: for 2, 3, 3, 10 the mean is 4.5, a number that appears nowhere in the list.</li>
</ul>
<p class="les-h">Summarising a data set</p>
<ol class="les-steps">
  <li><b>Put the data in order first.</b> Median and range are both wrong without it, and outliers become obvious.</li>
  <li><b>Count the values</b> &mdash; you need the count for the mean, and its odd-or-evenness for the median.</li>
  <li><b>Work out the summary asked for</b>, showing the sum and the count for a mean.</li>
  <li><b>Look for an outlier.</b> If one exists, say which average you trust and why &mdash; that reasoning is usually what the question is really testing.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Centre &amp; spread</span><span class="formula">mean = fair share (sum &divide; count)<br>median = middle<br>mode = most common<br>range = max &minus; min</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127968; Average house prices</span>
    <p>In a street of 9 houses worth about $600,000 each, one mansion sells for $5,000,000. The <b>mean</b> price jumps, making the street look expensive &mdash; the <b>median</b> (the middle house) still shows the true typical price.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127951; A batting average</span>
    <p>A batter scores 20, 35, 15, 100, 30. The <b>mean</b> (40) is pulled up by the one big 100; the <b>median</b> (30) better reflects a typical innings.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128094; Shoe sizes in a class</span>
    <p>The <b>mode</b> (most common size) tells a shop which size to stock the most of &mdash; the mean shoe size might come out as 7.3, a size that doesn't even exist.</p>
  </div>
</div>`,

  probability: `
<p>Probability measures how likely an event is, on a scale from <span class="hl">0 (impossible) to 1 (certain)</span>. Every probability question begins the same way: list what can happen.</p>
<p class="les-h">Where a probability lives</p>
${fig(probScaleSVG(), 'Words like "likely" are vague; the scale is not. Rolling a 6 sits at <b>1/6</b> &mdash; unlikely but far from impossible &mdash; while a coin landing heads sits exactly halfway. Every probability you calculate must land somewhere on this bar, which is the first check on any answer.')}
<ul class="def-list">
  <li>The <span class="term">sample space</span> is the full list of equally likely outcomes. Rolling one die has sample space 1, 2, 3, 4, 5, 6.</li>
  <li>For equally likely outcomes, <span class="term">P(event) = favourable &divide; total</span>. For example, P(even on a die) = 3 &divide; 6 = &frac12;.</li>
  <li>A probability can never be below 0 or above 1. An answer of 1.5 or &minus;0.2 means the favourable and total counts were swapped or miscounted.</li>
  <li>The complement rule: P(not A) = 1 &minus; P(A). This turns many hard "at least one" questions into easy ones. If P(rain) = 0.3, then P(no rain) = <span class="hl">0.7</span>.</li>
</ul>
<p class="les-h">Two events: list them before you multiply</p>
${fig(coinTreeSVG(), 'Tossing two coins is often guessed as three outcomes &mdash; 0, 1 or 2 heads. The tree shows <b>four</b> equally likely paths, and two of them give exactly one head. So the answer is 2/4 = <b>1/2</b>, not 1/3. The tree is the sample space, drawn.')}
<ol class="les-steps">
  <li><b>List or draw the sample space</b> &mdash; a tree for two stages, a grid for two dice.</li>
  <li><b>Count the favourable outcomes</b>, then divide by the total.</li>
  <li><b>For combined events:</b> "AND" multiplies when the events are <span class="term">independent</span>; "OR" adds when they cannot both happen at once.</li>
  <li><b>Check the answer sits between 0 and 1</b>, and that all the possibilities together add to exactly 1.</li>
</ol>
<ul class="def-list">
  <li>Each toss, roll or spin is <span class="term">independent</span> of the last. After five tails in a row, heads is still exactly 50% likely &mdash; a coin has no memory and is never "due".</li>
  <li>A probability is not tested by one trial. It is checked over many repeats, comparing the prediction to the <span class="term">relative frequency</span>: 200 spins landing red 50 times gives 50 &divide; 200 = <span class="hl">&frac14;</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Core formulas</span><span class="formula">P(event) = favourable &divide; total<br>P(not A) = 1 &minus; P(A)<br>independent AND: &times; &nbsp;|&nbsp; exclusive OR: +</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127922; Rolling two dice</span>
    <p>Wanting a total of 7: the sample space has 6&times;6 = 36 equally likely outcomes, and 6 of them make 7. So P(total = 7) = 6&frasl;36 = <b>1&frasl;6</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127780;&#65039; Reading a weather forecast</span>
    <p>A forecast gives a 30% chance of rain. P(rain) = 0.3, so P(no rain) = 1 &minus; 0.3 = <b>0.7</b> &mdash; more likely than not, but rain is still a real possibility.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129689; Tossing two coins</span>
    <p>It's tempting to guess 3 outcomes (0, 1 or 2 heads). The true sample space has 4: HH, HT, TH, TT &mdash; so "exactly one head" is 2&frasl;4 = <b>1&frasl;2</b>, not 1&frasl;3.</p>
  </div>
</div>`,

};
