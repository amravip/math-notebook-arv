// tools/geometry-lessons.mjs
//
// "Read the Chapter" content for the five Geometry-strand topics (angles, shapes, transformations,
// pythagoras, circles), split out of lesson-content.mjs when a review found the Geometry chapters
// were the hardest to follow: each was a stack of long compound bullets, with no picture anywhere in
// the prose — in the one strand where the picture *is* the explanation. Several also had real gaps
// (vertically opposite angles were named in the Key-facts box but never explained; the three rigid
// motions were never defined at all; Pythagoras never said when to add and when to subtract).
//
// Every lesson here follows the same shape:
//   1. one plain-language opening sentence,
//   2. short sub-headed groups (.les-h) so the reader can scan rather than wade,
//   3. an inline explainer diagram (.les-fig) wherever the diagram carries the idea,
//   4. one-idea-per-bullet .def-list items, each with a worked "For example",
//   5. a numbered method (.les-steps) for the routine the chapter's practice actually asks for,
//   6. the existing .kbox summary and .rw-examples real-world cards (kept from the original).
//
// Consumed by lesson-content.mjs, which spreads GEOMETRY_LESSONS into LESSON_EXPANSIONS.
// New CSS classes used here: .les-h, .les-fig, .les-steps, .les-tablewrap/.les-table (css/styles.css).

import { r1, svg, fig, txt, line, rect, arrow } from './svg-kit.mjs';

// ---------------------------------------------------------------------------
// Small SVG toolkit. All figures are drawn in the notebook's existing palette
// (brand #3B4CA8 for the "given" geometry, marigold for the angle/answer being
// highlighted, #C9791A for anything that moved or was constructed).
// ---------------------------------------------------------------------------

const RAD = Math.PI / 180;

// Point on a circle, using ordinary maths angles (0° = east, anticlockwise positive) even though
// SVG's y-axis points down — every figure below thinks in maths angles and this does the flip.
function pt(cx, cy, r, a) {
  return [r1(cx + r * Math.cos(a * RAD)), r1(cy - r * Math.sin(a * RAD))];
}

// Filled pie-slice marking the angle between two directions at a vertex. Sweep-flag 0 because a
// maths-anticlockwise turn is also anticlockwise on screen once y is flipped.
function wedge(cx, cy, r, a1, a2, fill) {
  const [x1, y1] = pt(cx, cy, r, a1);
  const [x2, y2] = pt(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 0 ${x2},${y2} Z" fill="${fill}"/>`;
}

// --- Angles: the five kinds of angle, drawn to scale in one strip ----------------------------
export function angleTypesSVG() {
  const items = [
    { deg: 45, name: 'Acute', desc: 'under 90&deg;' },
    { deg: 90, name: 'Right', desc: 'exactly 90&deg;' },
    { deg: 130, name: 'Obtuse', desc: '90&deg; to 180&deg;' },
    { deg: 180, name: 'Straight', desc: 'exactly 180&deg;' },
    { deg: 290, name: 'Reflex', desc: 'over 180&deg;' }
  ];
  const PW = 96, cx = 46, cy = 54, L = 34;
  let g = '';
  items.forEach((it, i) => {
    const [ax, ay] = pt(cx, cy, L, 0);
    const [bx, by] = pt(cx, cy, L, it.deg);
    const mark = it.deg === 90
      ? `<path d="M${cx + 13},${cy} L${cx + 13},${cy - 13} L${cx},${cy - 13}" fill="none" stroke="#293372" stroke-width="1.6"/>`
      : wedge(cx, cy, 15, 0, it.deg, 'rgba(255,194,75,.55)');
    // Push the degree label further out on narrow angles, where radius 27 would sit on an arm.
    const [tx, ty] = pt(cx, cy, it.deg < 60 ? 33 : 27, it.deg / 2);
    g += `<g transform="translate(${i * PW},0)">${mark}` +
      line(cx, cy, ax, ay, '#3B4CA8', 2.4) +
      line(cx, cy, bx, by, '#3B4CA8', 2.4) +
      `<circle cx="${cx}" cy="${cy}" r="2.8" fill="#20263F"/>` +
      txt(tx, r1(ty + 3.5), it.deg + '&deg;', { size: 10.5, mono: true, fill: '#293372' }) +
      txt(cx, 100, it.name, { size: 12 }) +
      txt(cx, 113, it.desc, { size: 10, weight: 400, fill: '#5A6178' }) +
      '</g>';
  });
  return svg(PW * items.length, 120,
    'Five angles drawn to scale: acute 45 degrees, right 90 degrees, obtuse 130 degrees, straight 180 degrees and reflex 290 degrees', g);
}

// --- Angles: corresponding / alternate / co-interior, on the same base figure three times -----
export function parallelAnglesSVG() {
  const PW = 156, H = 152;
  const yTop = 44, yBot = 104, xL = 10, xR = 146;
  const t1 = [52, 18], t2 = [110, 132];
  const dx = t2[0] - t1[0], dy = t2[1] - t1[1];
  const xAt = (y) => r1(t1[0] + ((y - t1[1]) * dx) / dy);
  const U = [xAt(yTop), yTop], L = [xAt(yBot), yBot];
  const DOWN = r1((Math.atan2(-dy, dx) * 180) / Math.PI); // direction of the transversal, heading down-right
  const UP = r1(DOWN + 180);

  // Each panel shades one pair of angles on the identical base figure.
  const panels = [
    { title: 'Corresponding &mdash; &ldquo;F&rdquo;', note: 'a = a (equal)', marks: [[U, DOWN, 0, 'a'], [L, DOWN, 0, 'a']] },
    { title: 'Alternate &mdash; &ldquo;Z&rdquo;', note: 'a = a (equal)', marks: [[U, DOWN, 0, 'a'], [L, UP, 180, 'a']] },
    { title: 'Co-interior &mdash; &ldquo;C&rdquo;', note: 'a + b = 180&deg;', marks: [[U, DOWN, 0, 'a'], [L, 0, UP, 'b']] }
  ];

  const chevron = (x, y) => `<polyline points="${x - 5},${y - 5} ${x},${y} ${x - 5},${y + 5}" fill="none" stroke="#5A6178" stroke-width="1.6"/>`;

  let g = '';
  panels.forEach((p, i) => {
    let b = '';
    p.marks.forEach((m) => { b += wedge(m[0][0], m[0][1], 20, m[1], m[2], m[3] === 'a' ? 'rgba(255,194,75,.62)' : 'rgba(120,215,195,.6)'); });
    b += line(xL, yTop, xR, yTop, '#3B4CA8', 2.2) + line(xL, yBot, xR, yBot, '#3B4CA8', 2.2);
    b += chevron(124, yTop) + chevron(124, yBot);
    b += line(t1[0], t1[1], t2[0], t2[1], '#C9791A', 2.2);
    p.marks.forEach((m) => {
      const [lx, ly] = pt(m[0][0], m[0][1], 28, (m[1] + m[2]) / 2);
      b += txt(lx, r1(ly + 4), m[3], { size: 12.5, mono: true, fill: '#293372' });
    });
    b += txt(PW / 2, 13, p.title, { size: 11.5 });
    b += txt(PW / 2, 145, p.note, { size: 11, mono: true, fill: '#5A6178' });
    g += `<g transform="translate(${i * PW},0)">${b}</g>`;
  });
  return svg(PW * 3, H,
    'Two parallel lines cut by a slanted line, shown three times: corresponding angles equal, alternate angles equal, co-interior angles adding to 180 degrees', g);
}

// --- Shapes: why (n − 2) × 180° — fan the polygon into triangles from one corner --------------
export function polygonSplitSVG() {
  const PW = 160, cx = 80, cy = 66, R = 44;
  const tint = ['#E8ECFA', '#FCEBCB', '#E1F0E8', '#F9E2E5'];
  let g = '';
  [5, 6].forEach((n, panel) => {
    const P = [];
    for (let i = 0; i < n; i++) P.push(pt(cx, cy, R, 90 + (i * 360) / n));
    let b = '';
    for (let i = 1; i < n - 1; i++) {
      const tri = [P[0], P[i], P[i + 1]];
      b += `<polygon points="${tri.map((p) => p.join(',')).join(' ')}" fill="${tint[(i - 1) % tint.length]}"/>`;
      const gx = r1((tri[0][0] + tri[1][0] + tri[2][0]) / 3);
      const gy = r1((tri[0][1] + tri[1][1] + tri[2][1]) / 3);
      b += txt(gx, gy + 4, String(i), { size: 11, mono: true, fill: '#5A6178' });
    }
    for (let i = 2; i < n - 1; i++) b += line(P[0][0], P[0][1], P[i][0], P[i][1], '#C9791A', 1.6, '4 3');
    b += `<polygon points="${P.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#3B4CA8" stroke-width="2.2" stroke-linejoin="round"/>`;
    b += `<circle cx="${P[0][0]}" cy="${P[0][1]}" r="3" fill="#C9791A"/>`;
    b += txt(cx, 128, `${n} sides &rarr; ${n - 2} triangles`, { size: 11 });
    b += txt(cx, 142, `${n - 2} &times; 180&deg; = ${(n - 2) * 180}&deg;`, { size: 11, mono: true, fill: '#293372' });
    g += `<g transform="translate(${panel * PW},0)">${b}</g>`;
  });
  return svg(PW * 2, 150,
    'A pentagon split into 3 triangles and a hexagon split into 4 triangles, both fanned from one corner', g);
}

// --- Pythagoras: the actual squares, so "a² + b² = c²" stops being just letters ---------------
export function pythagSquaresSVG() {
  const u = 16;
  const C = [78, 132], B = [78 + 4 * u, 132], A = [78, 132 - 3 * u];
  const sq = (pts, fill, stroke) =>
    `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // Outward normal of the hypotenuse AB, scaled to its own length — that is the far edge of the big square.
  const nx = B[1] - A[1], ny = -(B[0] - A[0]);
  const hyp = [A, B, [B[0] + nx, B[1] + ny], [A[0] + nx, A[1] + ny]];

  let g = '';
  g += sq([[C[0], C[1]], [B[0], B[1]], [B[0], B[1] + 4 * u], [C[0], C[1] + 4 * u]], '#FCEBCB', '#C9791A');
  g += sq([[A[0], A[1]], [C[0], C[1]], [C[0] - 3 * u, C[1]], [A[0] - 3 * u, A[1]]], '#E1F0E8', '#238B62');
  g += sq(hyp, '#E8ECFA', '#3B4CA8');
  g += txt(110, 168, '4&sup2; = 16', { size: 12, mono: true, fill: '#8a5a10' });
  g += txt(54, 112, '3&sup2; = 9', { size: 12, mono: true, fill: '#17624a' });
  g += txt(134, 80, '5&sup2; = 25', { size: 12, mono: true, fill: '#293372', rotate: 36.9 });
  g += `<polygon points="${A.join(',')} ${B.join(',')} ${C.join(',')}" fill="#FFFFFF" stroke="#20263F" stroke-width="2" stroke-linejoin="round"/>`;
  g += `<path d="M${C[0]},${C[1] - 12} L${C[0] + 12},${C[1] - 12} L${C[0] + 12},${C[1]}" fill="none" stroke="#20263F" stroke-width="1.5"/>`;
  // Only the two legs are labelled inside the triangle — the hypotenuse already carries "5² = 25"
  // along its own square, and a third label in here would collide with the right-angle mark.
  g += txt(86, 106, '3', { size: 11, mono: true, anchor: 'start', fill: '#20263F' });
  g += txt(116, 126, '4', { size: 11, mono: true, fill: '#20263F' });
  return svg(200, 208,
    'A 3-4-5 right-angled triangle with a square drawn on each side: the 9-square and 16-square together equal the 25-square',
    `<g transform="translate(-14,-8)">${g}</g>`, 210);
}

// --- Transformations: the four moves, each on its own small grid ------------------------------
export function transformPanelsSVG() {
  const PW = 116, GX = 8, GY0 = 116, CELL = 12, N = 8;
  const X = (g) => r1(GX + CELL * g);
  const Y = (g) => r1(GY0 - CELL * g);
  const poly = (pts, fill, stroke, dash) =>
    `<polygon points="${pts.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="2" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

  let grid = '';
  for (let i = 0; i <= N; i++) {
    grid += line(X(0), Y(i), X(N), Y(i), '#E4E8F2', 1);
    grid += line(X(i), Y(0), X(i), Y(N), '#E4E8F2', 1);
  }

  const T = [[1, 1], [3, 1], [1, 4]];
  const OBJ = poly(T, 'rgba(59,76,168,.12)', '#3B4CA8');
  const IMG = (pts) => poly(pts, 'rgba(255,194,75,.42)', '#C9791A');

  const panels = [
    {
      name: 'Translation', sub: 'slide',
      body: OBJ + IMG([[5, 3], [7, 3], [5, 6]]) + arrow(X(1.4), Y(1.4), X(4.7), Y(3.1), '#C9791A')
    },
    {
      name: 'Reflection', sub: 'flip',
      body: line(X(4), Y(0), X(4), Y(N), '#5A6178', 1.6, '5 4') + OBJ + IMG([[7, 1], [5, 1], [7, 4]])
    },
    {
      name: 'Rotation', sub: 'turn',
      body: OBJ + IMG([[7, 1], [7, 3], [4, 1]]) +
        `<path d="M${X(4) + 20},${Y(4)} A20,20 0 0 0 ${X(4)},${Y(4) - 20}" fill="none" stroke="#C9791A" stroke-width="1.8"/>` +
        // Arrowhead points west, along the anticlockwise tangent where the arc ends — the chapter
        // teaches anticlockwise as the default direction, so the cue has to agree with it.
        `<polygon points="${X(4) - 7},${Y(4) - 20} ${X(4) + 1},${Y(4) - 25} ${X(4) + 1},${Y(4) - 15}" fill="#C9791A"/>` +
        `<circle cx="${X(4)}" cy="${Y(4)}" r="3.2" fill="#20263F"/>`
    },
    {
      name: 'Enlargement', sub: 'resize, &times;2',
      body: [[2, 2], [6, 2], [2, 8]].map((p) => line(X(0), Y(0), X(p[0]), Y(p[1]), '#5A6178', 1, '4 3')).join('') +
        IMG([[2, 2], [6, 2], [2, 8]]) + OBJ + `<circle cx="${X(0)}" cy="${Y(0)}" r="3.2" fill="#20263F"/>`
    }
  ];

  let g = '';
  panels.forEach((p, i) => {
    g += `<g transform="translate(${i * PW},0)">${grid}${p.body}` +
      txt(PW / 2, 12, p.name, { size: 11 }) +
      txt(PW / 2, 130, p.sub, { size: 10.5, weight: 400, fill: '#5A6178' }) + '</g>';
  });
  return svg(PW * 4, 136,
    'Four grids showing a blue triangle and its orange image after a translation, a reflection in a dashed mirror line, a rotation about a marked centre, and an enlargement by scale factor 2', g);
}

// --- Circles: every part named, on two uncluttered circles ------------------------------------
export function circlePartsSVG() {
  const R = 52, cx = 92, cy = 92, PW = 196;
  const base = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#F6F7FE" stroke="#3B4CA8" stroke-width="2.2"/>`;

  // Panel A — the three measurements a formula ever asks for. The radius points down-right so it
  // stays clear of both the diameter label and the circumference pointer coming in from the top.
  let a = base;
  a += line(cx - R, cy, cx + R, cy, '#C9791A', 2.2);
  const [rx, ry] = pt(cx, cy, R, -55);
  a += line(cx, cy, rx, ry, '#238B62', 2.4);
  a += `<circle cx="${cx}" cy="${cy}" r="3.2" fill="#20263F"/>`;
  a += txt(cx, cy - 9, 'diameter d', { size: 10.5, fill: '#8a5a10' });
  a += txt(r1((cx + rx) / 2) + 14, r1((cy + ry) / 2) + 15, 'radius r', { size: 10.5, anchor: 'start', fill: '#17624a' });
  a += txt(cx - 7, cy + 15, 'centre', { size: 10, weight: 400, anchor: 'end', fill: '#5A6178' });
  a += arrow(cx, 22, cx, cy - R - 2, '#5A6178');
  a += txt(cx, 15, 'circumference C', { size: 10.5, fill: '#5A6178' });
  a += txt(cx, 176, 'd = 2r&nbsp;&nbsp;&nbsp;r = d &divide; 2', { size: 11, mono: true, fill: '#293372' });

  // Panel B — the named pieces of a circle that questions refer to.
  let b = base;
  b += wedge(cx, cy, R, 62, 140, 'rgba(255,194,75,.55)');
  const [a1x, a1y] = pt(cx, cy, R, 62), [a2x, a2y] = pt(cx, cy, R, 140);
  b += `<path d="M${a1x},${a1y} A${R},${R} 0 0 0 ${a2x},${a2y}" fill="none" stroke="#C9791A" stroke-width="3.4"/>`;
  b += line(cx, cy, a1x, a1y, '#C9791A', 1.6) + line(cx, cy, a2x, a2y, '#C9791A', 1.6);
  const [c1x, c1y] = pt(cx, cy, R, -18), [c2x, c2y] = pt(cx, cy, R, -104);
  b += line(c1x, c1y, c2x, c2y, '#238B62', 2.2);
  b += line(cx + R, cy - 44, cx + R, cy + 44, '#7C5CBF', 2.2);
  b += `<circle cx="${cx + R}" cy="${cy}" r="2.8" fill="#7C5CBF"/>`;
  b += txt(cx - 4, cy - 18, 'sector', { size: 10.5, fill: '#8a5a10' });
  b += txt(cx - 34, 24, 'arc', { size: 10.5, fill: '#8a5a10' });
  b += txt(cx - 30, cy + 58, 'chord', { size: 10.5, fill: '#17624a' });
  b += txt(cx + R, cy + 60, 'tangent', { size: 10.5, fill: '#6247a0' });
  b += txt(cx, 176, 'a sector is a slice; an arc is part of the edge', { size: 9.5, weight: 400, fill: '#5A6178' });

  return svg(PW * 2, 184,
    'Two labelled circles: the first shows the centre, radius, diameter and circumference; the second shows a sector, an arc, a chord and a tangent',
    `<g>${a}</g><g transform="translate(${PW},0)">${b}</g>`);
}

// Slice a circle into thin wedges and lay them in a zigzag strip — the classic argument for why
// A = πr²: the strip approximates a rectangle of height r and width half the circumference (πr).
// (Moved here from lesson-content.mjs with the circles lesson, its only user.)
export function wedgeRearrangeSVG() {
  const W = 168, H = 64, n = 8, b = W / n;
  let g = '';
  for (let i = 0; i < n; i++) {
    const x0 = i * b, x1 = (i + 1) * b, xm = x0 + b / 2, up = i % 2 === 0;
    const pts = up ? `${x0},${H} ${x1},${H} ${xm},0` : `${x0},0 ${x1},0 ${xm},${H}`;
    g += `<polygon points="${pts}" fill="${up ? '#E4572E' : '#FCE7B8'}" stroke="#fff" stroke-width="1"/>`;
  }
  g += `<text x="${W / 2}" y="${H + 16}" text-anchor="middle" font-family="Space Mono" font-size="10" fill="#5A6178">width &asymp; half the circumference (&pi;r)</text>`;
  g += `<text x="${W / 2}" y="${H + 29}" text-anchor="middle" font-family="Space Mono" font-size="10" fill="#5A6178">height &asymp; r &nbsp;&rarr;&nbsp; area &asymp; &pi;r &times; r = &pi;r&sup2;</text>`;
  return `<svg viewBox="0 -4 ${W} ${H + 38}" width="${W}" role="img" aria-label="A circle sliced into wedges and rearranged into a zigzag strip that approximates a rectangle">${g}</svg>`;
}

// --- Pythagoras: the hypotenuse is defined by the right angle, not by the page ------------------
// The chapter opens by saying "find the right angle first, then look straight across". Three turns of
// the same triangle make that concrete: the longest side moves around the page, but it is always the
// one facing the square corner.
function hypotenuseOrientationsSVG() {
  const panels = [
    { pts: [[14, 96], [92, 96], [14, 38]], right: 0, label: 'right angle bottom-left' },
    { pts: [[16, 34], [94, 34], [94, 96]], right: 1, label: 'right angle top-right' },
    { pts: [[16, 96], [94, 96], [94, 30]], right: 1, label: 'right angle bottom-right' },
  ];
  let g = '';
  panels.forEach((p, i) => {
    const ox = i * 112;
    const P = p.pts.map((q) => [q[0] + ox, q[1]]);
    const R = P[p.right];
    const others = P.filter((_, k) => k !== p.right);
    g += `<polygon points="${P.map((q) => q.join(',')).join(' ')}" fill="#E8ECFA" stroke="#3B4CA8" stroke-width="1.6"/>`;
    // The right-angle square, built from equal steps along the two sides that meet there.
    const step = (from, to, d) => {
      const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
      return [r1(from[0] + (dx / len) * d), r1(from[1] + (dy / len) * d)];
    };
    const u = step(R, others[0], 11), w = step(R, others[1], 11);
    const corner = [r1(u[0] + w[0] - R[0]), r1(u[1] + w[1] - R[1])];
    g += `<polyline points="${u.join(',')} ${corner.join(',')} ${w.join(',')}" fill="none" stroke="#20263F" stroke-width="1.4"/>`;
    // The hypotenuse joins the two corners that are NOT the right angle.
    g += line(others[0][0], others[0][1], others[1][0], others[1][1], '#C9791A', 3.2);
    const mid = [r1((others[0][0] + others[1][0]) / 2), r1((others[0][1] + others[1][1]) / 2)];
    g += txt(mid[0] + (i === 0 ? 13 : -13), mid[1] - 3, 'c', { size: 13, fill: '#8a5a10' });
    g += txt(ox + 55, 118, p.label, { size: 9, fill: '#5A6178', weight: 600 });
  });
  g += txt(170, 14, 'the hypotenuse always faces the square corner', { size: 10.5, fill: '#5A6178', weight: 600 });
  return svg(340, 126, 'The same right-angled triangle in three orientations, with the hypotenuse highlighted opposite the right angle each time', g, 340);
}

// --- Shapes: classifying a triangle by its sides ------------------------------------------------
// Tick marks are the convention for "these sides are equal", and reading them is exactly what the
// chapter's card sort asks for.
function triangleTypesSVG() {
  const kinds = [
    { name: 'Equilateral', desc: 'all three equal', pts: [[52, 26], [16, 92], [88, 92]], ticks: [1, 1, 1] },
    { name: 'Isosceles', desc: 'exactly two equal', pts: [[52, 26], [18, 92], [86, 92]], ticks: [1, 1, 0] },
    { name: 'Scalene', desc: 'none equal', pts: [[34, 26], [14, 92], [92, 92]], ticks: [0, 0, 0] },
  ];
  let g = '';
  kinds.forEach((k, i) => {
    const ox = i * 112;
    const P = k.pts.map((q) => [q[0] + ox, q[1]]);
    g += `<polygon points="${P.map((q) => q.join(',')).join(' ')}" fill="#E8ECFA" stroke="#3B4CA8" stroke-width="1.6"/>`;
    // One tick across the midpoint of each side that shares its length with another.
    [[0, 1], [0, 2], [1, 2]].forEach((pair, si) => {
      if (!k.ticks[si]) return;
      const a = P[pair[0]], b = P[pair[1]];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * 5, ny = (dx / len) * 5;
      g += line(r1(mx - nx), r1(my - ny), r1(mx + nx), r1(my + ny), '#C9791A', 2.2);
    });
    g += txt(ox + 52, 110, k.name, { size: 11.5, fill: '#20263F' });
    g += txt(ox + 52, 122, k.desc, { size: 9.5, fill: '#5A6178', weight: 600 });
  });
  return svg(340, 130, 'Three triangles classified by their sides: equilateral with a tick on all three, isosceles with a tick on two, and scalene with none', g, 340);
}

// --- Transformations: the three coordinate rules, from one point --------------------------------
// As a table they are three strings to memorise. Drawn from a single point they are three places it
// can land, and the sign changes become something you can see.
function coordRulesSVG() {
  const S = 196, pad = 16, u = (S - 2 * pad) / 8, cx = S / 2, cy = S / 2;
  const X = (a) => r1(cx + a * u), Y = (a) => r1(cy - a * u);
  let g = '';
  for (let i = -4; i <= 4; i++) {
    g += line(X(i), pad, X(i), S - pad, '#E4E8F2', 1);
    g += line(pad, Y(i), S - pad, Y(i), '#E4E8F2', 1);
  }
  g += line(pad, cy, S - pad, cy, '#5A6178', 1.5) + line(cx, pad, cx, S - pad, '#5A6178', 1.5);
  const marks = [
    { at: [3, 2], fill: '#FFC24B', label: 'P (3, 2)', dx: 7, dy: -9, colour: '#20263F' },
    { at: [3, -2], fill: '#fff', label: "(3, &minus;2)", dx: 7, dy: 15, colour: '#3B4CA8' },
    { at: [-3, 2], fill: '#fff', label: '(&minus;3, 2)', dx: -7, dy: -9, colour: '#238B62', anchor: 'end' },
    { at: [-3, -2], fill: '#fff', label: '(&minus;3, &minus;2)', dx: -7, dy: 15, colour: '#7C5CBF', anchor: 'end' },
  ];
  marks.slice(1).forEach((m) => { g += line(X(3), Y(2), X(m.at[0]), Y(m.at[1]), m.colour, 1.2, '3 3'); });
  marks.forEach((m) => {
    g += `<circle cx="${X(m.at[0])}" cy="${Y(m.at[1])}" r="5" fill="${m.fill}" stroke="${m.colour}" stroke-width="2"/>`;
    g += txt(X(m.at[0]) + m.dx, Y(m.at[1]) + m.dy, m.label, { size: 9.5, anchor: m.anchor || 'start', fill: m.colour });
  });
  const rules = [
    ['reflect in x-axis', '(x, y) &rarr; (x, &minus;y)', '#3B4CA8'],
    ['reflect in y-axis', '(x, y) &rarr; (&minus;x, y)', '#238B62'],
    ['rotate 180&deg;', '(x, y) &rarr; (&minus;x, &minus;y)', '#7C5CBF'],
  ];
  rules.forEach((r, i) => {
    const y = 52 + i * 36;
    g += txt(212, y, r[0], { size: 10.5, anchor: 'start', fill: '#5A6178', weight: 600 });
    g += txt(212, y + 15, r[1], { size: 12, mono: true, anchor: 'start', fill: r[2] });
  });
  return svg(356, S + 4, 'A point at 3 comma 2 with its images under a reflection in each axis and a 180 degree rotation, each labelled with its coordinate rule', g, 340);
}

// ---------------------------------------------------------------------------
// The lessons
// ---------------------------------------------------------------------------

export const GEOMETRY_LESSONS = {

  angles: `
<p>An angle measures <span class="hl">how far something has turned</span>. Two straight arms meet at a point called the <span class="term">vertex</span>, and the angle is the amount of turn from one arm to the other, measured in degrees (&deg;). A full turn all the way round is 360&deg;, so a quarter turn &mdash; a right angle &mdash; is 90&deg;.</p>
<p class="les-h">The five kinds of angle</p>
${fig(angleTypesSVG(), 'Almost every angle you meet is one of these five. Naming an angle before you calculate is the quickest way to catch a wrong answer: a missing angle that <b>looks</b> obtuse should never come out as 40&deg;.')}
<p class="les-h">The size of an angle is <em>not</em> the length of its arms</p>
<ul class="def-list">
  <li>An angle's size depends only on how much it has turned, never on how long the arms are drawn. For example, a 30&deg; angle is 30&deg; whether its arms are 1 cm or 10 cm long &mdash; only the gap between the arms counts.</li>
  <li>Because of this, a small angle with long arms can look bigger than a large angle with short arms. Always read the turn, not the ink.</li>
</ul>
<p class="les-h">Four facts that solve almost every angle problem</p>
<ul class="def-list">
  <li><b>On a straight line, angles add to 180&deg;.</b> For example, if one angle on a straight line is 120&deg;, the other is 180 &minus; 120 = <span class="hl">60&deg;</span>.</li>
  <li><b>Around a point, angles add to 360&deg;.</b> For example, if three angles meeting at a point are 150&deg;, 90&deg; and an unknown, the unknown is 360 &minus; 150 &minus; 90 = <span class="hl">120&deg;</span>.</li>
  <li><b>Vertically opposite angles are equal.</b> When two straight lines cross they make an X shape, and the two angles facing each other across the X are always equal. For example, if one angle at the crossing is 70&deg;, the angle directly opposite it is also <span class="hl">70&deg;</span> (and the other two are each 110&deg;).</li>
  <li><b>The angles inside a triangle add to 180&deg;</b>, and inside any quadrilateral they add to 360&deg;. For example, a triangle with angles 90&deg; and 60&deg; has a third angle of 180 &minus; 90 &minus; 60 = <span class="hl">30&deg;</span>.</li>
</ul>
<p>Two extra names describe pairs that add to a fixed total: angles are <span class="term">complementary</span> if they add to 90&deg;, and <span class="term">supplementary</span> if they add to 180&deg;. For example, 35&deg; and 55&deg; are complementary; 35&deg; and 145&deg; are supplementary. (Alphabetical order helps: <b>c</b> before <b>s</b>, 90 before 180.)</p>
<p class="les-h">Angles in parallel lines</p>
<p>Parallel lines never meet, and are marked with matching arrowheads. A line that cuts across them is called a <span class="term">transversal</span>, and it creates pairs of angles that are linked no matter how far apart the parallel lines are.</p>
${fig(parallelAnglesSVG(), 'The same figure three times. <b>Corresponding</b> angles sit in matching corners (an F shape) and are equal; <b>alternate</b> angles sit on opposite sides of the transversal, between the lines (a Z shape), and are equal; <b>co-interior</b> angles sit on the same side, between the lines (a C shape), and add to 180&deg;.')}
<ul class="def-list">
  <li>If one angle is 70&deg;, its corresponding angle and its alternate angle are both <span class="hl">70&deg;</span>, while its co-interior partner is 180 &minus; 70 = <span class="hl">110&deg;</span>.</li>
  <li>When one transversal crosses two parallel lines it makes eight angles, and every one of them is either the angle you were given or 180&deg; minus it &mdash; nothing else. If your answer is neither, check the pairing again.</li>
</ul>
<p class="les-h">How to find a missing angle</p>
<ol class="les-steps">
  <li><b>Name the pattern.</b> Is the angle on a straight line, around a point, across an X, inside a triangle, or between parallel lines?</li>
  <li><b>Write the total</b> that pattern gives you: 180&deg;, 360&deg;, or "equal to".</li>
  <li><b>Subtract</b> the angles you already know from that total.</li>
  <li><b>Check it looks right.</b> Compare your answer with the picture &mdash; an angle that looks acute should come out under 90&deg;.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Key facts</span><span class="formula">straight line = 180&deg;<br>point = 360&deg;<br>triangle = 180&deg;&nbsp;&nbsp;quadrilateral = 360&deg;<br>vertically opposite angles equal</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129466; A skate ramp</span>
    <p>A ramp meets flat ground at 25&deg;. Since angles on a straight line add to 180&deg;, the angle on the other side is 180&deg; &minus; 25&deg; = <b>155&deg;</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127968; A roof's pitch</span>
    <p>A symmetric roof's two slopes meet at 110&deg; at the peak. The three angles of that triangle add to 180&deg;, so the two equal base angles share 180&deg; &minus; 110&deg; = 70&deg; between them: each is <b>35&deg;</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129517; A ship's bearing</span>
    <p>A <span class="term">bearing</span> is an angle measured clockwise from north, always written as 3 digits (e.g. 060&deg;). A ship sails on a bearing of 60&deg;, then turns to a bearing of 150&deg; &mdash; a turn of 150&deg; &minus; 60&deg; = <b>90&deg;</b>, a quarter-turn clockwise.</p>
  </div>
</div>`,

  shapes: `
<p>A <span class="term">polygon</span> is a closed flat shape made only of straight sides &mdash; and it is named by how many sides it has: 3 triangle, 4 quadrilateral, 5 pentagon, 6 hexagon, 8 octagon. A polygon is <span class="term">regular</span> when <span class="hl">all its sides and all its angles are equal</span>.</p>
<p class="les-h">Triangles are named twice over</p>
${fig(triangleTypesSVG(), 'Matching tick marks mean &ldquo;these sides are the same length&rdquo; &mdash; the standard way a diagram tells you which triangle you are looking at, when the drawing itself is not to scale.')}
<ul class="def-list">
  <li><b>By their sides:</b> <span class="term">equilateral</span> (all three equal), <span class="term">isosceles</span> (exactly two equal), <span class="term">scalene</span> (none equal).</li>
  <li><b>By their biggest angle:</b> right-angled (one 90&deg; angle), acute (all three under 90&deg;), obtuse (one over 90&deg;). Both names can apply at once &mdash; a triangle can be right-angled <em>and</em> isosceles.</li>
  <li>Equal sides force equal angles. In an isosceles triangle the two angles opposite the equal sides are equal, and every angle of an equilateral triangle is 180 &divide; 3 = <span class="hl">60&deg;</span>. For example, an isosceles triangle with a 40&deg; apex has base angles of (180 &minus; 40) &divide; 2 = <span class="hl">70&deg;</span> each.</li>
</ul>
<p class="les-h">The quadrilateral family</p>
<p>Most quadrilaterals form a <span class="hl">nested family</span>: trapezium &rarr; parallelogram &rarr; rhombus and rectangle &rarr; square. Each one is a special case of the one before it, and a special case keeps every property of its parent. That is why a square is still a rectangle, still a rhombus and still a parallelogram &mdash; but a rectangle is not a square. (The kite is the exception: it sits outside that chain entirely.)</p>
<div class="les-tablewrap"><table class="les-table">
  <thead><tr><th>Shape</th><th>What makes it that shape</th></tr></thead>
  <tbody>
    <tr><td>Trapezium</td><td>at least one pair of parallel sides</td></tr>
    <tr><td>Parallelogram</td><td>both pairs of opposite sides parallel and equal; opposite angles equal</td></tr>
    <tr><td>Rhombus</td><td>a parallelogram with all four sides equal</td></tr>
    <tr><td>Rectangle</td><td>a parallelogram with four right angles</td></tr>
    <tr><td>Square</td><td>four equal sides <em>and</em> four right angles &mdash; both a rhombus and a rectangle</td></tr>
    <tr><td>Kite</td><td>two pairs of equal sides next to each other, not opposite &mdash; not part of the chain above</td></tr>
  </tbody>
</table></div>
<p class="les-h">Angle sums: why (n &minus; 2) &times; 180&deg;</p>
${fig(polygonSplitSVG(), 'Pick one corner and join it to every other corner. An n-sided polygon always falls into <b>n &minus; 2</b> triangles, and each triangle carries 180&deg; &mdash; so the interior angles must total (n &minus; 2) &times; 180&deg;.')}
<ul class="def-list">
  <li><b>Interior angles</b> of any polygon add to <span class="term">(n &minus; 2) &times; 180&deg;</span>. For example, a hexagon (n = 6) totals (6 &minus; 2) &times; 180&deg; = <span class="hl">720&deg;</span>.</li>
  <li><b>In a regular polygon</b> every angle is equal, so divide that total by n. For example, a regular hexagon: 720&deg; &divide; 6 = <span class="hl">120&deg;</span> per angle.</li>
  <li><b>Exterior angles</b> &mdash; the turn you make at each corner walking round the outside &mdash; always total 360&deg;, for every polygon. So one exterior angle of a regular polygon is 360&deg; &divide; n.</li>
  <li>At each corner the interior and exterior angles sit on a straight line, so <span class="hl">interior + exterior = 180&deg;</span>. For example, a regular octagon: exterior = 360&deg; &divide; 8 = 45&deg;, so interior = 180&deg; &minus; 45&deg; = <span class="hl">135&deg;</span> &mdash; which matches (8 &minus; 2) &times; 180&deg; &divide; 8. Two routes, same answer.</li>
</ul>
<p class="les-h">One angle of a regular polygon</p>
<ol class="les-steps">
  <li>Count the sides, n.</li>
  <li>Exterior angle = 360&deg; &divide; n &mdash; usually the quicker route.</li>
  <li>Interior angle = 180&deg; &minus; exterior angle.</li>
  <li>Check: a regular quadrilateral (a square) gives exactly 90&deg;, and the angle grows towards 180&deg; as n gets bigger &mdash; it can never reach it.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Angle sums</span><span class="formula">interior total = (n &minus; 2) &times; 180&deg;<br>exterior total = 360&deg; (always)<br>interior + exterior = 180&deg; at each corner</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128721; A stop sign</span>
    <p>A stop sign is a regular octagon (8 sides). Interior angles total (8&minus;2)&times;180&deg; = 1080&deg;, so each angle is 1080&deg; &divide; 8 = <b>135&deg;</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128029; A honeycomb</span>
    <p>Bees build honeycomb from regular hexagons because a hexagon's 120&deg; angles fit three-to-a-point (3 &times; 120&deg; = 360&deg;) and tile a flat surface with no gaps &mdash; only triangles, squares and hexagons can do this alone.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127959;&#65039; A roof truss</span>
    <p>A triangular roof truss stays rigid, while a plain quadrilateral frame can collapse sideways &mdash; three fixed side lengths lock a triangle's angles, which is why builders brace structures with them.</p>
  </div>
</div>`,

  transformations: `
<p>A <span class="term">transformation</span> moves or resizes a shape. The starting shape is the <span class="term">object</span>, the shape you end up with is the <span class="hl">image</span>, and matching corners are labelled A and A&prime; ("A dash").</p>
<p class="les-h">The four transformations</p>
${fig(transformPanelsSVG(), 'Blue is the object, orange is the image. A translation slides it, a reflection flips it across the dashed mirror line, a rotation turns it about the marked centre, and an enlargement resizes it away from the marked centre.')}
<div class="les-tablewrap"><table class="les-table">
  <thead><tr><th>Transformation</th><th>What it does</th><th>You must state</th><th>Size</th></tr></thead>
  <tbody>
    <tr><td>Translation</td><td>slides every point the same distance in the same direction</td><td>the vector &mdash; how far right/left, how far up/down</td><td>unchanged</td></tr>
    <tr><td>Reflection</td><td>flips the shape over a mirror line; each point lands the same distance the other side</td><td>the mirror line (e.g. the y-axis, or y = x)</td><td>unchanged</td></tr>
    <tr><td>Rotation</td><td>turns the shape about a fixed point</td><td>the centre, the angle, and the direction</td><td>unchanged</td></tr>
    <tr><td>Enlargement</td><td>stretches or shrinks the shape away from a centre</td><td>the centre and the scale factor k</td><td>&times; k</td></tr>
  </tbody>
</table></div>
<ul class="def-list">
  <li>Translation, reflection and rotation are <span class="term">rigid motions</span>: every length and every angle survives, so the image is <span class="hl">congruent</span> (identical, just moved). Only its position or facing changes.</li>
  <li>An enlargement keeps all the angles but multiplies every length, so the image is <span class="term">similar</span> &mdash; the same shape, a different size. For example, a triangle enlarged by scale factor 2 keeps its angles but every side is twice as long.</li>
  <li>If a question does not say which way to turn, mathematicians rotate <span class="term">anticlockwise</span> by convention. So "rotate 90&deg;" with no direction given means 90&deg; anticlockwise.</li>
</ul>
<p class="les-h">Coordinate rules worth knowing by heart</p>
${fig(coordRulesSVG(), 'One point, three images. Reflecting in the x-axis flips the <b>y</b> sign, reflecting in the y-axis flips the <b>x</b> sign, and a 180&deg; rotation flips both &mdash; which is why it lands diagonally opposite.')}
<div class="les-tablewrap"><table class="les-table">
  <thead><tr><th>Transformation</th><th>Rule</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Translate by (a, b)</td><td>(x, y) &rarr; (x + a, y + b)</td><td>(2, 3) by (4, &minus;1) &rarr; (6, 2)</td></tr>
    <tr><td>Reflect in the x-axis</td><td>(x, y) &rarr; (x, &minus;y)</td><td>(2, 3) &rarr; (2, &minus;3)</td></tr>
    <tr><td>Reflect in the y-axis</td><td>(x, y) &rarr; (&minus;x, y)</td><td>(2, 3) &rarr; (&minus;2, 3)</td></tr>
    <tr><td>Reflect in y = x</td><td>(x, y) &rarr; (y, x)</td><td>(2, 3) &rarr; (3, 2)</td></tr>
    <tr><td>Rotate 90&deg; anticlockwise about (0, 0)</td><td>(x, y) &rarr; (&minus;y, x)</td><td>(2, 3) &rarr; (&minus;3, 2)</td></tr>
    <tr><td>Rotate 90&deg; clockwise about (0, 0)</td><td>(x, y) &rarr; (y, &minus;x)</td><td>(2, 3) &rarr; (3, &minus;2)</td></tr>
    <tr><td>Rotate 180&deg; about (0, 0)</td><td>(x, y) &rarr; (&minus;x, &minus;y)</td><td>(2, 3) &rarr; (&minus;2, &minus;3)</td></tr>
    <tr><td>Enlarge by k from (0, 0)</td><td>(x, y) &rarr; (kx, ky)</td><td>(2, 3) with k = 2 &rarr; (4, 6)</td></tr>
  </tbody>
</table></div>
<p class="les-h">Lengths scale by k &mdash; but area scales by k&sup2;</p>
<ul class="def-list">
  <li>An enlargement multiplies every length by the scale factor k. For example, scale factor 3 turns a 2 cm side into 6 cm.</li>
  <li>Area does <em>not</em> scale by k &mdash; it scales by <span class="hl">k&sup2;</span>, because a shape is stretched in two directions at once. For example, scale factor 3 turns an area of 5 cm&sup2; into 5 &times; 3&sup2; = <span class="hl">45 cm&sup2;</span>, not 15.</li>
  <li>So doubling every side (k = 2) makes a shape hold <b>4 times</b> as much, not twice. For example, a 3 &times; 3 square (area 9) enlarges to 6 &times; 6, area 36 &mdash; four times as much.</li>
  <li>The same logic carries on: volume scales by k&sup3;. One, two, three dimensions &mdash; one, two, three powers of k.</li>
</ul>
<p class="les-h">Transforming a shape, point by point</p>
<ol class="les-steps">
  <li><b>Read what is fixed:</b> a translation needs its vector, a reflection its mirror line, a rotation its centre <em>and</em> direction, an enlargement its centre and scale factor. A rotation without a centre is not a defined move.</li>
  <li><b>Take the vertices one at a time</b> and apply the rule to each, writing the image coordinates down as you go. Never try to move the whole shape by eye.</li>
  <li><b>Join the image points</b> in the same order as the original, and label them A&prime;, B&prime;, C&prime;.</li>
  <li><b>Check the result is the right kind of shape:</b> after a slide, flip or turn it must be <em>congruent</em> &mdash; same size, same angles. Only an enlargement may change the size.</li>
  <li><b>Sanity-check one length</b> against the original. If a "rotation" has changed a side length, a point was plotted wrongly.</li>
</ol>
<div class="kbox"><span class="kbox-tag">Congruent or similar?</span><span class="formula">slide / flip / turn &rarr; CONGRUENT<br>enlarge by k &rarr; SIMILAR<br>lengths &times;k&nbsp;&nbsp;area &times;k&sup2;&nbsp;&nbsp;volume &times;k&sup3;</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127918; Video game characters</span>
    <p>A game character flips to face left instead of right &mdash; a <b>reflection</b>. It slides across the screen &mdash; a <b>translation</b>. Its size never changes in either move, only its position or facing direction.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128424;&#65039; Enlarging on a photocopier</span>
    <p>A photocopier enlarges a photo by 150% (scale factor 1.5). Every length grows by 1.5&times;, but the paper's area grows by 1.5&sup2; = <b>2.25&times;</b>, not 1.5&times;.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129513; Wallpaper patterns</span>
    <p>A repeating wallpaper pattern is built entirely from translations &mdash; sliding the same motif sideways and down, no resizing or flipping needed, to tile the whole wall.</p>
  </div>
</div>`,

  pythagoras: `
<p>In a <span class="hl">right-angled</span> triangle, the side opposite the right angle is always the longest, and has its own name: the <span class="term">hypotenuse</span>. Find the right angle first, look straight across from it, and that is the hypotenuse &mdash; whichever way the triangle happens to be turned.</p>
<p class="les-h">Finding the hypotenuse before you calculate</p>
${fig(hypotenuseOrientationsSVG(), 'The hypotenuse is not &ldquo;the bottom one&rdquo; or &ldquo;the sloping one&rdquo; &mdash; it is whichever side sits <b>opposite the right angle</b>. Find the square corner, look straight across, and label that side c before substituting anything.')}
<p class="les-h">Why the rule talks about squares</p>
${fig(pythagSquaresSVG(), 'Draw an actual square on each side of a 3-4-5 triangle. The two smaller squares hold 9 and 16 unit squares &mdash; and 9 + 16 = 25 fills the big one exactly. That is all <b>a&sup2; + b&sup2; = c&sup2;</b> is saying.')}
<p><span class="term">Pythagoras' theorem</span>: <b>a&sup2; + b&sup2; = c&sup2;</b>, where c is the hypotenuse and a and b are the two shorter sides. It works for every right-angled triangle and for no other kind, so the first thing to check is that the right-angle mark is really there.</p>
<p class="les-h">Two jobs &mdash; and the difference is add or subtract</p>
<ul class="def-list">
  <li><b>Missing hypotenuse? Add.</b> c = &radic;(a&sup2; + b&sup2;). For example, legs 6 and 8: c = &radic;(36 + 64) = &radic;100 = <span class="hl">10</span>.</li>
  <li><b>Missing shorter side? Subtract.</b> a = &radic;(c&sup2; &minus; b&sup2;), always taking the hypotenuse's square first. For example, hypotenuse 13 and one leg 5: a = &radic;(169 &minus; 25) = &radic;144 = <span class="hl">12</span>.</li>
  <li><b>Self-check:</b> the hypotenuse must be the longest side. If a shorter side comes out bigger than the hypotenuse, you added when you should have subtracted.</li>
</ul>
<p class="les-h">Working through a question</p>
<ol class="les-steps">
  <li><b>Mark the right angle</b> and label the side opposite it c.</li>
  <li><b>Decide the job:</b> is c the missing one (add the squares) or a known one (subtract)?</li>
  <li><b>Square, combine, then square-root.</b></li>
  <li><b>Round only at the end</b>, and write the units. Keep the full decimal through the middle steps &mdash; rounding early shifts the final answer.</li>
</ol>
<ul class="def-list">
  <li>Some side lengths come out whole. Sets like <span class="hl teal">3-4-5</span>, 5-12-13 and 8-15-17 fit exactly and are worth recognising instantly. Multiplying a set through still works: double 3-4-5 for 6-8-10, triple it for 9-12-15.</li>
  <li>The <span class="term">converse</span> works too: if a&sup2; + b&sup2; = c&sup2; is true for a triangle's three sides, then that triangle <em>must</em> have a right angle. The theorem can test a triangle, not just measure one. For example, 8-15-17: 64 + 225 = 289 = 17&sup2;, so the corner is exactly square.</li>
  <li>When the answer is not whole, leave it as a rounded decimal with units. For example, &radic;20 &asymp; 4.472 &mdash; carry those decimals, and write 4.5 cm only on the final line.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Theorem &amp; converse</span><span class="formula">hypotenuse missing: c = &radic;(a&sup2; + b&sup2;)<br>shorter side missing: a = &radic;(c&sup2; &minus; b&sup2;)<br>if a&sup2; + b&sup2; = c&sup2;, the angle IS right</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129692; Setting up a ladder</span>
    <p>A 5 m ladder leans against a wall with its base 3 m out. The ladder is the hypotenuse, so this is a subtract job: it reaches &radic;(5&sup2; &minus; 3&sup2;) = <b>4 m</b> up the wall &mdash; a 3-4-5 triangle.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128250; A TV's screen size</span>
    <p>A TV advertised as "55 inches" means the <em>diagonal</em> of the screen (the hypotenuse) is 55 inches &mdash; not its width or height, which form the two shorter sides.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128208; Checking a corner is square</span>
    <p>Builders mark 3 m along one wall and 4 m along the other from a corner. If the diagonal between those marks measures exactly <b>5 m</b>, the converse guarantees the corner is a true right angle.</p>
  </div>
</div>`,

  circles: `
<p>A circle is every point that sits the same distance from one centre point. That distance is the <span class="term">radius</span>, and it is the number nearly every circle question is really about &mdash; so if a question hands you anything else, turn it into the radius first.</p>
<p class="les-h">The parts of a circle</p>
${fig(circlePartsSVG(), 'The <b>radius</b> runs from the centre to the edge; the <b>diameter</b> runs right across through the centre, so it is always twice the radius; the <b>circumference</b> is the distance all the way round. A <b>chord</b> joins two points on the edge without passing through the centre, an <b>arc</b> is part of the edge, a <b>sector</b> is a slice, and a <b>tangent</b> is a line that just touches the circle at one point.')}
<ul class="def-list">
  <li>Diameter and radius convert in one step: <span class="hl">d = 2r</span> and <span class="hl">r = d &divide; 2</span>. For example, a 30 cm plate has a radius of 15 cm.</li>
  <li><span class="hl">&pi;</span> (pi) is what you get when you divide any circle's circumference by its diameter &mdash; about 3.14. Every circle in the universe gives the same answer, which is exactly why one formula fits them all.</li>
  <li>Because C &divide; d = &pi;, multiplying back gives <b>C = &pi;d</b>, and since d = 2r that is the same as <b>C = 2&pi;r</b>. The two forms are one formula, not two.</li>
</ul>
<p class="les-h">The two formulas &mdash; and how to pick</p>
<div class="les-tablewrap"><table class="les-table">
  <thead><tr><th>The question asks for&hellip;</th><th>Use</th><th>Units</th></tr></thead>
  <tbody>
    <tr><td>the distance <em>around</em> &mdash; a rim, a fence, one wheel turn</td><td>C = &pi;d = 2&pi;r</td><td>cm, m (length)</td></tr>
    <tr><td>the space <em>inside</em> &mdash; a surface, a lid, ground covered</td><td>A = &pi;r&sup2;</td><td>cm&sup2;, m&sup2; (area)</td></tr>
  </tbody>
</table></div>
<ol class="les-steps">
  <li><b>Check what you were given</b> &mdash; radius or diameter? If it is the diameter, halve it before doing anything else.</li>
  <li><b>Pick the formula</b> from around-versus-inside.</li>
  <li><b>Substitute and calculate</b>, using &pi; &asymp; 3.14 (or the calculator's &pi; key).</li>
  <li><b>Write the units</b>, squared for area. Then sanity-check with &pi; &asymp; 3.</li>
</ol>
<ul class="def-list">
  <li>For a circle of radius 5 cm: C = 2 &times; 3.14 &times; 5 = <span class="hl">31.4 cm</span>, and A = 3.14 &times; 5&sup2; = 3.14 &times; 25 = <span class="hl">78.5 cm&sup2;</span>. Note that r&sup2; means square the radius <em>first</em>, then multiply by &pi;.</li>
  <li><b>The most common slip</b> is putting the diameter into A = &pi;r&sup2;. A 10 cm-wide circle has area &pi; &times; 5&sup2; = 78.5 cm&sup2;, not &pi; &times; 10&sup2; = 314 cm&sup2; &mdash; four times too big.</li>
  <li>The <em>perimeter</em> of a half-circle is not just half the circumference: you have to add the straight edge back on. For a semicircle of radius 5 cm, perimeter = &frac12; &times; 31.4 + 10 = <span class="hl">25.7 cm</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Formulas</span><span class="formula">C = &pi;d = 2&pi;r&nbsp;&nbsp;(around)<br>A = &pi;r&sup2;&nbsp;&nbsp;(inside)<br>d = 2r&nbsp;&nbsp;&pi; &asymp; 3.14</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128692; A bike wheel</span>
    <p>A bike wheel has a 66 cm diameter. Every full turn rolls the bike forward one circumference: &pi; &times; 66 &asymp; <b>207 cm</b>, just over 2 metres per turn.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127829; Comparing pizza deals</span>
    <p>A small pizza (20 cm across) costs $10; a large (30 cm across) costs $18. Area scales with r&sup2;, so the large has (15&divide;10)&sup2; = <b>2.25&times;</b> the area for only 1.8&times; the price &mdash; better value.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127939; A running track's lanes</span>
    <p>A 400 m track's lanes are curved. Runners in outer lanes start further forward, because a bigger radius means a bigger circumference (C = 2&pi;r) to cover the same number of laps fairly.</p>
  </div>
  <div class="rw-card">
    ${wedgeRearrangeSVG()}
    <span class="rw-tag">&#129921; Why A = &pi;r&sup2;?</span>
    <p>Slice a circle into thin wedges and lay them out alternating point-up, point-down. The zigzag strip is roughly a rectangle: height r, width half the circumference (&pi;r) &mdash; area = &pi;r &times; r = &pi;r&sup2;.</p>
  </div>
</div>`
};
