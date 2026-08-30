// tools/svg-kit.mjs
//
// The drawing primitives shared by every "Read the chapter" lesson module (geometry-lessons.mjs,
// number-lessons.mjs). Extracted when the second module needed the same `txt`/`line`/`svg` helpers
// the first had defined privately — two copies of a text helper is how two chapters end up with
// different label sizes.
//
// Everything here is deliberately small and dumb: these emit SVG strings, they hold no state, and
// they know nothing about mathematics. Topic-specific figure builders live in the lesson module
// that uses them.

// Round to one decimal. SVG coordinates computed from trigonometry otherwise land as
// 47.000000000000004, which bloats every generated page for no visual gain.
export const r1 = (n) => Number(n.toFixed(1));

// The notebook's palette, mirroring the custom properties in css/styles.css. Figures are drawn with
// literal hex (an SVG in generated HTML cannot read a stylesheet variable through a presentation
// attribute), so this is the single place those literals are written down.
export const C = {
  ink: '#20263F',
  inkSoft: '#5A6178',
  brand: '#3B4CA8',
  brandDeep: '#293372',
  brandTint: '#E8ECFA',
  marigold: '#FFC24B',
  marigoldTint: '#FCEBCB',
  marigoldInk: '#8a5a10',
  line: '#E4E8F2',
  paper: '#FFFFFF',
  green: '#238B62',
  greenTint: '#E1F0E8',
  greenInk: '#17624a',
  amber: '#C9791A',
  amberTint: '#FBF0DC',
  red: '#C93F4C',
  redTint: '#F9E2E5',
  violet: '#7C5CBF',
  violetTint: '#EFE9FA',
};

// `label` becomes the figure's accessible name, so write it as a sentence describing what is drawn,
// not "diagram 3". `width` defaults to the viewBox width, which renders the figure at its natural
// size and lets .les-fig's max-width shrink it on a phone.
export const svg = (w, h, label, body, width) =>
  `<svg viewBox="0 0 ${w} ${h}" width="${width || w}" role="img" aria-label="${label}">${body}</svg>`;

// A figure with its caption. The caption does the teaching — it says what the picture shows, not
// "Figure 1" — so never leave it empty.
export const fig = (svgMarkup, caption) =>
  `<figure class="les-fig">${svgMarkup}<figcaption>${caption}</figcaption></figure>`;

export function txt(x, y, s, o) {
  o = o || {};
  const fam = o.mono ? 'Space Mono, monospace' : 'Nunito, sans-serif';
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : '';
  return `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${fam}" ` +
    `font-size="${o.size || 11}" font-weight="${o.weight || 700}" fill="${o.fill || C.ink}"${rot}>${s}</text>`;
}

export function line(x1, y1, x2, y2, stroke, w, dash) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w || 2}" ` +
    `stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function rect(x, y, w, h, o) {
  o = o || {};
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r === undefined ? 3 : o.r}" ` +
    `fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1.4}"` +
    `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}

// Straight arrow with a solid head, for vectors, "this becomes that" pointers and number-line jumps.
export function arrow(x1, y1, x2, y2, color, w) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, h = 7;
  const bx = x2 - ux * h, by = y2 - uy * h;
  const px = -uy * 4, py = ux * 4;
  return line(x1, y1, r1(bx), r1(by), color, w || 2) +
    `<polygon points="${x2},${y2} ${r1(bx + px)},${r1(by + py)} ${r1(bx - px)},${r1(by - py)}" fill="${color}"/>`;
}

// A pie cut into `total` equal slices with the first `coloredCount` filled — the clearest picture of
// "parts of a whole", and shared by fractions, ratios, percentages and probability so the same idea
// wears the same picture in all four chapters.
export function pizzaSVG(total, coloredCount, opts) {
  opts = opts || {};
  const cx = 62, cy = 62, r = 54;
  const colorA = opts.colorA || '#E4572E', colorB = opts.colorB || '#FCE7B8';
  let paths = '';
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = r1(cx + r * Math.cos(a0)), y0 = r1(cy + r * Math.sin(a0));
    const x1 = r1(cx + r * Math.cos(a1)), y1 = r1(cy + r * Math.sin(a1));
    const fill = i < coloredCount ? colorA : colorB;
    paths += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z" fill="${fill}" stroke="#fff" stroke-width="1.5"/>`;
  }
  return svg(124, 124,
    `A pizza cut into ${total} slices, ${coloredCount} of one topping and ${total - coloredCount} of the other`,
    paths, 124);
}

// A curved hop from x1 to x2 above a number line — the standard way a jump is drawn in a school
// text, and much easier to follow than a straight arrow lying on the line itself.
export function hop(x1, x2, baseY, height, color) {
  const mid = r1((x1 + x2) / 2);
  const dir = x2 > x1 ? 1 : -1;
  const tipX = r1(x2 - dir * 7);
  return `<path d="M${x1},${baseY} Q${mid},${baseY - height} ${tipX},${baseY}" fill="none" ` +
    `stroke="${color}" stroke-width="2" stroke-linecap="round"/>` +
    `<polygon points="${x2},${baseY} ${tipX},${baseY - 4.5} ${tipX},${baseY + 4.5}" fill="${color}"/>`;
}

// A cuboid's net (unfolded flat), coloured by matching face-pair — top/bottom, front/back, left/
// right — so the "3 pairs, add, then double" surface-area method has a picture to point at.
export function cuboidNetSVG(l, w, h) {
  const s = 14;
  const L = l * s, W = w * s, H = h * s;
  const totalW = 2 * W + 2 * L, totalH = 2 * W + H;
  const rowMid = W, rowBot = W + H, colRight = W + L, colBack = W + L + W;
  const colorPair = ['#CDEBD9', '#C7D0F2', '#FCE7B8'];
  const face = (x, y, fw, fh, fill, label) =>
    `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="${fill}" stroke="#8A90A8" stroke-width="1.2"/>` +
    `<text x="${x + fw / 2}" y="${y + fh / 2 + 4}" text-anchor="middle" font-family="Space Mono" font-size="10" font-weight="700" fill="#20263F">${label}</text>`;
  let g = '';
  g += face(W, 0, L, W, colorPair[0], 'TOP');
  g += face(0, rowMid, W, H, colorPair[2], 'L');
  g += face(W, rowMid, L, H, colorPair[1], 'FRONT');
  g += face(colRight, rowMid, W, H, colorPair[2], 'R');
  g += face(colBack, rowMid, L, H, colorPair[1], 'BACK');
  g += face(W, rowBot, L, W, colorPair[0], 'BOTTOM');
  return `<svg viewBox="0 0 ${totalW} ${totalH}" width="${Math.min(totalW, 210)}" role="img" aria-label="Net of a ${l} by ${w} by ${h} cuboid unfolded into six faces">${g}</svg>`;
}
