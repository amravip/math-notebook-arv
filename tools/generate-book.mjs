// tools/generate-book.mjs
//
// Builds the multi-page "book" site from the original single-page prototype
// (_source/original-single-page.html). Not part of the running site — a one-time/repeatable Node
// generator, run whenever the source content changes. Extracts the CURRICULUM (topic data) and CH
// (Head-First chapter content: hooks, goals, vocab, discovery, mistakes, retrieval, summary) objects
// by running that exact, already-reviewed JS snippet in a sandboxed vm context (safe: it is
// first-party trusted content, not external/untrusted input), then renders one static HTML page per
// topic plus the shared shell. Preserves every educational sentence verbatim — only restructures
// delivery into separate pages, fixes the window.storage bug (-> localStorage), and adds Bookmarks.
//
// Usage: node tools/generate-book.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { LESSON_EXPANSIONS } from './lesson-content.mjs';
import { NOTICE_WONDER, GO_FURTHER, MENTAL_TIPS, CPA_PANELS } from './enrichment-content.mjs';
import { formatHint } from './format-hint.mjs';
import { deriveTileSpec } from './tile-spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '_source', 'original-single-page.html');
const TOPICS_DIR = path.join(ROOT, 'topics');

// --- 1. Extract CURRICULUM + CH by executing the trusted data-definition slice of the source ---

function extractDataSlice(html) {
  const start = html.indexOf('const CURRICULUM = ');
  const end = html.indexOf('function sectionInner(t,group){');
  if (start === -1 || end === -1) throw new Error('Could not locate CURRICULUM/CH data slice in source.');
  return html.slice(start, end);
}

function loadData() {
  const html = fs.readFileSync(SRC, 'utf-8');
  const slice = extractDataSlice(html);
  // Only `const nav=document.getElementById(...)` at the top of the slice touches the DOM; nothing
  // else in this pure-data range needs it, so a harmless stub is enough.
  const sandbox = { document: { getElementById: () => null } };
  vm.createContext(sandbox);
  // Top-level const/let bindings from vm.runInContext don't reliably show up as own-properties of
  // the sandbox object across Node versions, so explicitly copy them onto globalThis at the end.
  vm.runInContext(slice + '\nglobalThis.CURRICULUM=CURRICULUM;globalThis.CH=CH;globalThis.ORDER=ORDER;', sandbox, { filename: 'curriculum-data.js' });
  return { CURRICULUM: sandbox.CURRICULUM, CH: sandbox.CH, ORDER: sandbox.ORDER };
}

// --- 2. Fixed (non-random) intro figures for the 6 dynamic topics, baked at build time ---

function quadrantChart() {
  const S = 250, pad = 30, c = S / 2, u = (c - pad) / 5; let g = '';
  for (let i = -5; i <= 5; i++) { g += `<line class="fig-g" x1="${c + i * u}" y1="${pad}" x2="${c + i * u}" y2="${S - pad}"/><line class="fig-g" x1="${pad}" y1="${c - i * u}" x2="${S - pad}" y2="${c - i * u}"/>`; }
  g += `<line class="fig-ax" x1="${pad}" y1="${c}" x2="${S - pad}" y2="${c}"/><line class="fig-ax" x1="${c}" y1="${pad}" x2="${c}" y2="${S - pad}"/>`;
  g += `<text class="fig-txt soft" x="${S - pad + 2}" y="${c + 13}">x</text><text class="fig-txt soft" x="${c + 5}" y="${pad}">y</text>`;
  const o = (c - pad) / 2, q = (x, y, rom, sign) => `<text class="fig-txt" text-anchor="middle" x="${x}" y="${y - 3}">${rom}</text><text class="fig-txt soft" text-anchor="middle" x="${x}" y="${y + 14}">${sign}</text>`;
  g += q(c + o, c - o, 'I', '(+, +)') + q(c - o, c - o, 'II', '(&minus;, +)') + q(c - o, c + o, 'III', '(&minus;, &minus;)') + q(c + o, c + o, 'IV', '(+, &minus;)');
  return `<svg class="viz" viewBox="0 0 ${S} ${S}" width="250" role="img" aria-label="four quadrants">${g}</svg>`;
}
function straightAngle(a) {
  const W = 230, H = 118, ox = W / 2, oy = 88, len = 95, rad = a * Math.PI / 180;
  let g = `<line class="fig-ax" x1="${ox - len}" y1="${oy}" x2="${ox + len}" y2="${oy}"/>`;
  g += `<line class="fig-line" x1="${ox}" y1="${oy}" x2="${(ox + len * Math.cos(rad)).toFixed(1)}" y2="${(oy - len * Math.sin(rad)).toFixed(1)}"/>`;
  g += `<circle class="fig-pt" cx="${ox}" cy="${oy}" r="3"/>`;
  const la = a / 2 * Math.PI / 180, lx = ((180 + a) / 2) * Math.PI / 180;
  g += `<text class="fig-txt ang" text-anchor="middle" x="${(ox + 48 * Math.cos(la)).toFixed(1)}" y="${(oy - 48 * Math.sin(la) + 4).toFixed(1)}">${a}&deg;</text>`;
  g += `<text class="fig-txt ang" text-anchor="middle" x="${(ox + 48 * Math.cos(lx)).toFixed(1)}" y="${(oy - 48 * Math.sin(lx) + 4).toFixed(1)}">x</text>`;
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" width="220" role="img" aria-label="angles on a straight line">${g}</svg>`;
}
function miniPoly(cx, cy, r, n, label) { const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); } return `<polygon class="fig-shape" points="${pts.join(' ')}"/><text class="fig-txt soft" text-anchor="middle" x="${cx}" y="${cy + r + 17}">${label}</text>`; }
function polyRow() { return `<svg class="viz" viewBox="0 0 300 125" width="285" role="img" aria-label="polygons">${miniPoly(55, 58, 40, 3, 'triangle')}${miniPoly(150, 58, 40, 4, 'quadrilateral')}${miniPoly(245, 58, 40, 5, 'pentagon')}</svg>`; }
function coordPlane(R, pts, opts) {
  opts = opts || {}; const S = 210, pad = 18, c = S / 2, u = (c - pad) / R;
  const X = v => +(c + v * u).toFixed(1), Y = v => +(c - v * u).toFixed(1);
  let g = `<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--brand)"/></marker></defs>`;
  for (let i = -R; i <= R; i++) g += `<line class="fig-g" x1="${X(i)}" y1="${pad}" x2="${X(i)}" y2="${S - pad}"/><line class="fig-g" x1="${pad}" y1="${Y(i)}" x2="${S - pad}" y2="${Y(i)}"/>`;
  g += `<line class="fig-ax" x1="${pad}" y1="${c}" x2="${S - pad}" y2="${c}"/><line class="fig-ax" x1="${c}" y1="${pad}" x2="${c}" y2="${S - pad}"/>`;
  g += `<text class="fig-txt soft" x="${S - pad + 1}" y="${c + 13}">x</text><text class="fig-txt soft" x="${c + 5}" y="${pad}">y</text>`;
  (opts.arrows || []).forEach(a => { g += `<line class="fig-arr" x1="${X(a.x1)}" y1="${Y(a.y1)}" x2="${X(a.x2)}" y2="${Y(a.y2)}" marker-end="url(#ah)"/>`; });
  pts.forEach(p => { g += `<circle class="fig-pt${p.hollow ? ' hollow' : ''}" cx="${X(p.x)}" cy="${Y(p.y)}" r="4.5"/>`; if (p.label) g += `<text class="fig-txt" x="${X(p.x) + 7}" y="${Y(p.y) - 6}">${p.label}</text>`; });
  return `<svg class="viz" viewBox="0 0 ${S} ${S}" width="215" height="215" role="img" aria-label="coordinate grid">${g}</svg>`;
}
function rightTri(aL, bL, cL) {
  const W = 230, H = 175, ox = 36, oy = 142, aw = 150, bh = 100;
  let g = `<polygon class="fig-shape" points="${ox},${oy} ${ox + aw},${oy} ${ox},${oy - bh}"/>`;
  g += `<path class="fig-ra" d="M${ox + 14},${oy} L${ox + 14},${oy - 14} L${ox},${oy - 14}"/>`;
  g += `<text class="fig-txt" text-anchor="middle" x="${ox + aw / 2}" y="${oy + 18}">${aL}</text>`;
  g += `<text class="fig-txt" text-anchor="end" x="${ox - 6}" y="${oy - bh / 2 + 4}">${bL}</text>`;
  g += `<text class="fig-txt" text-anchor="start" x="${ox + aw / 2 + 6}" y="${oy - bh / 2 - 4}">${cL}</text>`;
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" width="225" role="img" aria-label="right-angled triangle">${g}</svg>`;
}
function circleFig(label, kind) {
  const S = 170, c = S / 2, R = 58;
  let g = `<circle class="fig-shape" cx="${c}" cy="${c}" r="${R}"/><circle class="fig-pt" cx="${c}" cy="${c}" r="3"/>`;
  if (kind === 'd') g += `<line class="fig-line" x1="${c - R}" y1="${c}" x2="${c + R}" y2="${c}"/><text class="fig-txt" text-anchor="middle" x="${c}" y="${c - 7}">${label}</text>`;
  else g += `<line class="fig-line" x1="${c}" y1="${c}" x2="${c + R}" y2="${c}"/><text class="fig-txt" text-anchor="middle" x="${c + R / 2}" y="${c - 7}">${label}</text>`;
  return `<svg class="viz" viewBox="0 0 ${S} ${S}" width="165" role="img" aria-label="circle">${g}</svg>`;
}
// Squares-built-on-each-side proof of a2 + b2 = c2, on a 3-4-5 triangle: the two smaller square
// areas (9 and 16) visibly add to the largest (25). Gives the theorem a *why*, not just a statement.
function pythagorasProof() {
  const ox = 72, oy = 150, u = 18;
  const X = (m) => +(ox + m * u).toFixed(1), Y = (m) => +(oy - m * u).toFixed(1);
  const poly = (pts, fill) => `<polygon points="${pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}" fill="${fill}" stroke="var(--ink-soft)" stroke-width="1"/>`;
  let g = '';
  g += poly([[0, 0], [4, 0], [4, -4], [0, -4]], 'rgba(59,76,168,.14)');   // a2 = 16 (below)
  g += poly([[0, 0], [0, 3], [-3, 3], [-3, 0]], 'rgba(59,76,168,.14)');   // b2 = 9 (left)
  g += poly([[0, 3], [4, 0], [7, 4], [3, 7]], 'rgba(255,194,75,.24)');    // c2 = 25 (hypotenuse)
  g += `<polygon points="${X(0)},${Y(0)} ${X(4)},${Y(0)} ${X(0)},${Y(3)}" fill="var(--paper)" stroke="var(--brand)" stroke-width="1.5"/>`;
  g += `<path class="fig-ra" d="M${X(0.7)},${Y(0)} L${X(0.7)},${Y(0.7)} L${X(0)},${Y(0.7)}"/>`;
  g += `<text class="fig-txt" text-anchor="middle" x="${X(2)}" y="${Y(-2) + 4}">a&sup2; = 16</text>`;
  g += `<text class="fig-txt" text-anchor="middle" x="${X(-1.5)}" y="${Y(1.5) + 4}">b&sup2; = 9</text>`;
  g += `<text class="fig-txt" text-anchor="middle" x="${X(3.4)}" y="${Y(3.6) + 4}">c&sup2; = 25</text>`;
  return `<svg class="viz" viewBox="0 0 218 240" width="218" role="img" aria-label="Squares built on the three sides of a 3-4-5 right triangle, with areas 9, 16 and 25, showing 9 plus 16 equals 25">${g}</svg>`;
}
const INTRO_FIG = {
  graphs: quadrantChart, angles: () => straightAngle(125), shapes: polyRow,
  transformations: () => coordPlane(6, [{ x: -3, y: 1, label: 'A' }, { x: 1, y: 1, label: "A'", hollow: true }], { arrows: [{ x1: -3, y1: 1, x2: 1, y2: 1 }] }),
  pythagoras: pythagorasProof, circles: () => circleFig('r', 'r')
};
const INTRO_CAP = {
  graphs: 'The axes split the plane into four quadrants. A point&rsquo;s signs (x, y) decide which one it lands in.',
  angles: 'Angles on a straight line always add to 180&deg;; angles around a point add to 360&deg;.',
  shapes: 'Polygons are named by their number of sides. Interior angles sum to (n &minus; 2) &times; 180&deg;.',
  transformations: 'A translation slides every point by the same amount &mdash; here (x, y) each shift right by 4.',
  pythagoras: 'Build a square on each side of this 3-4-5 triangle. The two smaller areas add up exactly to the largest: 9 + 16 = 25. That <em>is</em> a&sup2; + b&sup2; = c&sup2; &mdash; seen as areas, not just stated as a rule.',
  circles: 'r = radius, d = 2r. Circumference = 2&pi;r, Area = &pi;r&sup2;.'
};
const DYNAMIC_IDS = new Set(['graphs', 'angles', 'shapes', 'transformations', 'pythagoras', 'circles']);

// The 18 static topics' answers have no author-supplied `accept` array (unlike the 6 dynamic
// topics' generated questions), so mark-answer always showed a neutral "answered" state, never
// highlighting a wrong answer. Deriving accept=[strippedAnswer] from the already-authored `ans`
// field lets the same tolerant isCorrect()/normAns() matching (unit-stripping, numeric tolerance,
// comma/whitespace-insensitive) grade these too. ~97% of the 720 answers are a single clean value;
// a handful of multi-part answers (e.g. "$18 and $27") may occasionally mismatch on odd phrasing —
// the same trade-off the dynamic topics already accept.
// Fraction answers are authored as stacked spans (<span class="frac"><span class="n">2</span>
// <span class="d">3</span></span>) with no literal "/", so a naive tag-strip collapses "2/3" to
// "23" — which then never matches a learner typing "2/3". Rebuild "n/d" from those spans BEFORE
// stripping the rest, so the derived accept value is the same text the learner types. (Mixed
// numbers like 2·1/6 become "21/6"; normAns strips whitespace either way, so the slash is what
// matters.) Affects the frac-span answers in Fractions and Probability; plain-text "1/6" answers
// already carry their slash and are untouched.
//
// The final tag-strip only removes REAL tags — "<" (or "</") immediately followed by a letter —
// not a bare "<" used as a maths operator. A naive /<[^>]+>/ ate the "less-than" in Inequalities
// answers like `<span class="m">x < 7</span>`: it matched "< 7</span>" as one "tag", truncating
// the accepted answer to just "x" (so a correct "x < 7" could never be marked right, while a bare
// "x" was wrongly accepted). "x > 4" was unaffected because ">" alone never opens a tag match.
function stripTags(html) {
  return String(html)
    .replace(/<span class="frac">\s*<span class="n">([^<]*)<\/span>\s*<span class="d">([^<]*)<\/span>\s*<\/span>/g, '$1/$2')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .trim();
}

// --- 2b. Visual models for the static topics the review found had none. Hand-authored, simple,
// reusing the same .fig-*/.viz classes the dynamic topics' generated figures already use, so they
// read as one consistent visual language rather than a bolted-on addition. ---

const STATIC_MODELS = {
  operations: `<div class="cap">Order of operations &mdash; same level: work left to right</div>
    <svg class="viz" viewBox="0 0 260 150" width="260" role="img" aria-label="BEDMAS priority order, brackets first">
      <rect class="fig-shape" x="10" y="8" width="240" height="26" rx="7"/><text class="fig-txt" x="130" y="26" text-anchor="middle">Brackets</text>
      <line class="fig-arr" x1="130" y1="34" x2="130" y2="44" marker-end="url(#dArrow)"/>
      <rect class="fig-shape" x="30" y="46" width="200" height="26" rx="7"/><text class="fig-txt" x="130" y="64" text-anchor="middle">Exponents</text>
      <line class="fig-arr" x1="130" y1="72" x2="130" y2="82" marker-end="url(#dArrow)"/>
      <rect class="fig-shape" x="50" y="84" width="160" height="26" rx="7"/><text class="fig-txt" x="130" y="102" text-anchor="middle">&times; and &divide;</text>
      <line class="fig-arr" x1="130" y1="110" x2="130" y2="120" marker-end="url(#dArrow)"/>
      <rect class="fig-shape" x="70" y="122" width="120" height="26" rx="7"/><text class="fig-txt" x="130" y="140" text-anchor="middle">+ and &minus;</text>
      <defs><marker id="dArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--ink-soft)"/></marker></defs>
    </svg>`,

  factors: `<div class="cap">Factor tree for 36</div>
    <svg class="viz" viewBox="0 0 220 170" width="220" role="img" aria-label="Factor tree showing 36 broken into prime factors 2, 2, 3, 3">
      <line class="fig-line" x1="110" y1="20" x2="60" y2="60"/><line class="fig-line" x1="110" y1="20" x2="160" y2="60"/>
      <line class="fig-line" x1="60" y1="70" x2="35" y2="110"/><line class="fig-line" x1="60" y1="70" x2="85" y2="110"/>
      <line class="fig-line" x1="160" y1="70" x2="135" y2="110"/><line class="fig-line" x1="160" y1="70" x2="185" y2="110"/>
      <circle class="fig-pt" cx="110" cy="20" r="16"/><text class="fig-txt" x="110" y="25" text-anchor="middle" style="fill:#fff">36</text>
      <circle class="fig-shape" cx="60" cy="65" r="15"/><text class="fig-txt" x="60" y="70" text-anchor="middle">6</text>
      <circle class="fig-shape" cx="160" cy="65" r="15"/><text class="fig-txt" x="160" y="70" text-anchor="middle">6</text>
      <circle class="fig-shape" cx="35" cy="120" r="14"/><text class="fig-txt" x="35" y="125" text-anchor="middle">2</text>
      <circle class="fig-shape" cx="85" cy="120" r="14"/><text class="fig-txt" x="85" y="125" text-anchor="middle">3</text>
      <circle class="fig-shape" cx="135" cy="120" r="14"/><text class="fig-txt" x="135" y="125" text-anchor="middle">2</text>
      <circle class="fig-shape" cx="185" cy="120" r="14"/><text class="fig-txt" x="185" y="125" text-anchor="middle">3</text>
      <text class="fig-txt soft" x="110" y="158" text-anchor="middle">36 = 2 &times; 2 &times; 3 &times; 3</text>
    </svg>
    <div class="cap" style="margin-top:16px">HCF &amp; LCM of 18 and 24 as shared prime factors</div>
    <svg class="viz" viewBox="0 0 264 150" width="264" role="img" aria-label="Two overlapping circles of prime factors: 18 is 2,3,3 and 24 is 2,2,2,3; the shared 2 and 3 sit in the overlap">
      <circle cx="98" cy="70" r="58" fill="var(--brand)" fill-opacity=".10" stroke="var(--brand)"/>
      <circle cx="166" cy="70" r="58" fill="var(--marigold)" fill-opacity=".16" stroke="#C9791A"/>
      <text class="fig-txt" text-anchor="middle" x="58" y="30">18</text>
      <text class="fig-txt" text-anchor="middle" x="206" y="30">24</text>
      <text class="fig-txt" text-anchor="middle" x="64" y="76" style="font-size:16px">3</text>
      <text class="fig-txt" text-anchor="middle" x="132" y="62" style="font-size:16px">2</text>
      <text class="fig-txt" text-anchor="middle" x="132" y="86" style="font-size:16px">3</text>
      <text class="fig-txt" text-anchor="middle" x="200" y="60" style="font-size:16px">2</text>
      <text class="fig-txt" text-anchor="middle" x="200" y="84" style="font-size:16px">2</text>
      <text class="fig-txt soft" text-anchor="middle" x="132" y="116" style="font-size:10px">shared</text>
    </svg>
    <div class="pvexp">HCF = the overlap = 2 &times; 3 = <b>6</b>. LCM = everything = 2 &times; 2 &times; 2 &times; 3 &times; 3 = <b>72</b>.</div>`,

  decimals: `<div class="cap">Which is bigger &mdash; 0.7 or 0.65?</div>
    <svg class="viz" viewBox="0 0 262 118" width="262" role="img" aria-label="Two bars from 0 to 1: the top filled to 0.7, the bottom to 0.65, showing 0.7 reaches further">
      ${[['0.7', 0.7, 18, 'var(--brand)'], ['0.65', 0.65, 66, 'var(--marigold)']].map(([lab, v, y, col]) => {
    const x0 = 44, w = 196;
    let s = `<text class="fig-txt" text-anchor="end" x="38" y="${y + 17}">${lab}</text>`;
    s += `<rect x="${x0}" y="${y}" width="${w}" height="24" rx="3" fill="none" stroke="var(--grid)"/>`;
    s += `<rect x="${x0}" y="${y}" width="${(w * v).toFixed(1)}" height="24" rx="3" fill="${col}" fill-opacity=".55"/>`;
    for (let i = 1; i < 10; i++) s += `<line x1="${(x0 + w * i / 10).toFixed(1)}" y1="${y}" x2="${(x0 + w * i / 10).toFixed(1)}" y2="${y + 24}" stroke="var(--grid)" stroke-dasharray="2 2"/>`;
    return s;
  }).join('')}
      <line x1="${(44 + 196 * 0.65).toFixed(1)}" y1="14" x2="${(44 + 196 * 0.65).toFixed(1)}" y2="96" stroke="var(--ink-soft)" stroke-dasharray="3 3"/>
      <line x1="${(44 + 196 * 0.7).toFixed(1)}" y1="14" x2="${(44 + 196 * 0.7).toFixed(1)}" y2="96" stroke="var(--brand)" stroke-dasharray="3 3"/>
    </svg>
    <div class="pvexp">0.7 = 0.70, and 70 hundredths &gt; 65 hundredths &mdash; more digits doesn&rsquo;t mean a bigger number.</div>`,

  percentages: `<div class="cap">25% of a hundred square</div>
    <svg class="viz" viewBox="0 0 210 210" width="180" role="img" aria-label="A ten by ten grid with 25 of the 100 small squares shaded">
      ${(() => { let g = ''; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) { const shaded = r < 3 ? (r < 2 ? true : c < 5) : false; g += `<rect x="${c * 20 + 5}" y="${r * 20 + 5}" width="18" height="18" fill="${shaded ? 'var(--brand)' : 'none'}" stroke="var(--grid)"/>`; } return g; })()}
    </svg>
    <div class="pvexp">25 of 100 squares shaded = 25%</div>`,

  ratios: `<div class="cap">Ratio 2 : 3 as a bar model</div>
    <svg class="viz" viewBox="0 0 260 90" width="260" role="img" aria-label="A bar split into 2 blue parts and 3 gold parts, showing a 2 to 3 ratio">
      <rect x="10" y="10" width="52" height="34" fill="var(--brand)"/><rect x="62" y="10" width="52" height="34" fill="var(--brand)"/>
      <rect x="114" y="10" width="52" height="34" fill="var(--marigold)"/><rect x="166" y="10" width="52" height="34" fill="var(--marigold)"/><rect x="218" y="10" width="32" height="34" fill="var(--marigold)"/>
      <text class="fig-txt soft" x="10" y="66" text-anchor="start">2 parts</text><text class="fig-txt soft" x="250" y="66" text-anchor="end">3 parts</text>
    </svg>`,

  powers: `<div class="cap">2&sup3; as repeated multiplication</div>
    <svg class="viz" viewBox="0 0 260 70" width="260" role="img" aria-label="2 cubed shown as 2 times 2 times 2 equals 8">
      <rect class="fig-shape" x="10" y="10" width="40" height="40" rx="8"/><text class="fig-txt" x="30" y="35" text-anchor="middle">2</text>
      <text class="fig-txt soft" x="60" y="35" text-anchor="middle">&times;</text>
      <rect class="fig-shape" x="72" y="10" width="40" height="40" rx="8"/><text class="fig-txt" x="92" y="35" text-anchor="middle">2</text>
      <text class="fig-txt soft" x="122" y="35" text-anchor="middle">&times;</text>
      <rect class="fig-shape" x="134" y="10" width="40" height="40" rx="8"/><text class="fig-txt" x="154" y="35" text-anchor="middle">2</text>
      <text class="fig-txt soft" x="192" y="35" text-anchor="middle">=</text>
      <rect x="206" y="10" width="46" height="40" rx="8" fill="var(--easy-bg)" stroke="var(--easy)"/><text class="fig-txt" x="229" y="35" text-anchor="middle" style="fill:var(--easy)">8</text>
    </svg>`,

  patterns: `<div class="cap">Position &rarr; term, common difference +4</div>
    <svg class="viz" viewBox="0 0 260 90" width="260" role="img" aria-label="Table of sequence positions 1 to 4 against terms 3, 7, 11, 15 with a plus 4 arrow between each">
      ${[3, 7, 11, 15].map((v, i) => `<rect class="fig-shape" x="${10 + i * 62}" y="30" width="46" height="34" rx="6"/><text class="fig-txt" x="${33 + i * 62}" y="52" text-anchor="middle">${v}</text><text class="fig-txt soft" x="${33 + i * 62}" y="20" text-anchor="middle">n=${i + 1}</text>`).join('')}
      ${[0, 1, 2].map(i => `<text class="fig-txt ang" x="${64 + i * 62}" y="52" text-anchor="middle">+4</text>`).join('')}
    </svg>`,

  expressions: `<div class="cap">Algebra tiles for 3x + 2</div>
    <svg class="viz" viewBox="0 0 270 70" width="270" role="img" aria-label="Three long x tiles and two small unit tiles representing the expression 3x plus 2">
      ${[0, 1, 2].map(i => `<rect class="fig-shape" x="${10 + i * 46}" y="10" width="38" height="18" rx="4"/><text class="fig-txt" x="${29 + i * 46}" y="24" text-anchor="middle" style="font-size:11px">x</text>`).join('')}
      ${[0, 1].map(i => `<rect class="fig-shape" x="${152 + i * 26}" y="10" width="18" height="18" rx="4"/><text class="fig-txt" x="${161 + i * 26}" y="24" text-anchor="middle" style="font-size:11px">1</text>`).join('')}
      <text class="fig-txt soft" x="135" y="52" text-anchor="middle">3 lots of x, plus 2 units = 3x + 2</text>
    </svg>`,

  equations: `<div class="cap">A balance scale: x + 4 = 10</div>
    <svg class="viz" viewBox="0 0 240 145" width="240" role="img" aria-label="A balance scale, level, with x plus 4 on the left pan and 10 on the right pan">
      <line class="fig-ax" x1="120" y1="20" x2="120" y2="55"/>
      <line class="fig-line" x1="30" y1="55" x2="210" y2="55"/>
      <line class="fig-line" x1="45" y1="55" x2="45" y2="80"/><line class="fig-line" x1="20" y1="80" x2="70" y2="80"/>
      <line class="fig-line" x1="195" y1="55" x2="195" y2="80"/><line class="fig-line" x1="170" y1="80" x2="220" y2="80"/>
      <circle class="fig-pt" cx="120" cy="18" r="4"/>
      <text class="fig-txt" x="45" y="100" text-anchor="middle">x + 4</text>
      <text class="fig-txt" x="195" y="100" text-anchor="middle">10</text>
      <text class="fig-txt soft" x="120" y="118" text-anchor="middle" style="font-size:11px">Balanced: whatever you do</text>
      <text class="fig-txt soft" x="120" y="132" text-anchor="middle" style="font-size:11px">to one side, do to the other</text>
    </svg>`,

  inequalities: `<div class="cap">x &gt; 4 on a number line</div>
    <svg class="viz" viewBox="0 0 260 60" width="260" role="img" aria-label="Number line from 1 to 7 with an open circle at 4 and the line shaded to the right, showing x greater than 4">
      <line class="fig-ax" x1="15" y1="30" x2="245" y2="30"/>
      ${[1, 2, 3, 4, 5, 6, 7].map((n, i) => `<line class="fig-g" x1="${15 + i * 38}" y1="25" x2="${15 + i * 38}" y2="35"/><text class="fig-txt soft" x="${15 + i * 38}" y="48" text-anchor="middle" style="font-size:10px">${n}</text>`).join('')}
      <line class="fig-line" x1="${15 + 3 * 38}" y1="30" x2="245" y2="30" style="stroke-width:4"/>
      <circle cx="${15 + 3 * 38}" cy="30" r="6" fill="var(--paper)" stroke="var(--brand)" stroke-width="2.5"/>
      <line class="fig-arr" x1="230" y1="30" x2="245" y2="30" marker-end="url(#iArrow)"/>
      <defs><marker id="iArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--brand)"/></marker></defs>
    </svg>`,

  volume: `<div class="cap">2 &times; 3 &times; 2 cuboid, built layer by layer</div>
    <svg class="viz" viewBox="0 0 200 150" width="200" role="img" aria-label="Two layers of a 3 by 2 grid of unit cubes stacked to show volume">
      ${[0, 1].map(layer => Array.from({ length: 6 }, (_, i) => { const c = i % 3, r = Math.floor(i / 3); const ox = 30 + c * 34 - layer * 6; const oy = 90 - r * 30 - layer * 34; return `<rect x="${ox}" y="${oy}" width="30" height="26" fill="rgba(59,76,168,.12)" stroke="var(--brand)"/>`; }).join('')).join('')}
      <text class="fig-txt soft" x="100" y="130" text-anchor="middle">2 layers of 3&times;2</text>
      <text class="fig-txt soft" x="100" y="144" text-anchor="middle">= 12 unit cubes</text>
    </svg>`,

  conversions: `<div class="cap">Metric ladder &mdash; each step is a power of ten</div>
    <svg class="viz" viewBox="0 0 260 70" width="260" role="img" aria-label="km to m to cm to mm, connected by times 1000, times 100 and times 10 arrows">
      ${['km', 'm', 'cm', 'mm'].map((u, i) => `<rect class="fig-shape" x="${10 + i * 62}" y="15" width="46" height="30" rx="7"/><text class="fig-txt" x="${33 + i * 62}" y="35" text-anchor="middle">${u}</text>`).join('')}
      ${['&times;1000', '&times;100', '&times;10'].map((lab, i) => `<line class="fig-arr" x1="${58 + i * 62}" y1="30" x2="${68 + i * 62}" y2="30" marker-end="url(#cArrow)"/><text class="fig-txt soft" x="${64 + i * 62}" y="11" text-anchor="middle" style="font-size:9px">${lab}</text>`).join('')}
      <defs><marker id="cArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink-soft)"/></marker></defs>
    </svg>`,

  statistics: `<div class="cap">Dot plot for 2, 3, 3, 10 &mdash; the 10 pulls the mean up</div>
    <svg class="viz" viewBox="0 0 260 70" width="260" role="img" aria-label="Dot plot showing values 2, 3, 3 and 10 on a number line, with the mean marked between 4 and 5">
      <line class="fig-ax" x1="15" y1="45" x2="245" y2="45"/>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => `<line class="fig-g" x1="${15 + i * 23}" y1="40" x2="${15 + i * 23}" y2="50"/>`).join('')}
      <circle class="fig-pt" cx="${15 + 1 * 23}" cy="35" r="5"/>
      <circle class="fig-pt" cx="${15 + 2 * 23}" cy="35" r="5"/><circle class="fig-pt" cx="${15 + 2 * 23}" cy="23" r="5"/>
      <circle class="fig-pt" cx="${15 + 9 * 23}" cy="35" r="5"/>
      <text class="fig-txt ang" x="${15 + 3.5 * 23}" y="62" text-anchor="middle" style="font-size:10.5px">mean = 4.5</text>
    </svg>`,

  probability: `<div class="cap">Sample space for two coin tosses</div>
    <svg class="viz" viewBox="-15 0 205 190" width="205" role="img" aria-label="A two by two grid showing the four equally likely outcomes HH, HT, TH, TT for tossing two coins">
      <line class="fig-ax" x1="55" y1="20" x2="55" y2="170"/><line class="fig-ax" x1="55" y1="20" x2="180" y2="20"/>
      <text class="fig-txt soft" x="90" y="12" text-anchor="middle">coin 2</text><text class="fig-txt soft" x="15" y="98" text-anchor="middle">coin 1</text>
      <text class="fig-txt" x="90" y="33" text-anchor="middle">H</text><text class="fig-txt" x="150" y="33" text-anchor="middle">T</text>
      <text class="fig-txt" x="40" y="65" text-anchor="middle">H</text><text class="fig-txt" x="40" y="140" text-anchor="middle">T</text>
      <rect class="fig-shape" x="60" y="45" width="60" height="40"/><text class="fig-txt" x="90" y="70" text-anchor="middle">HH</text>
      <rect class="fig-shape" x="120" y="45" width="60" height="40"/><text class="fig-txt" x="150" y="70" text-anchor="middle">HT</text>
      <rect class="fig-shape" x="60" y="120" width="60" height="40"/><text class="fig-txt" x="90" y="145" text-anchor="middle">TH</text>
      <rect class="fig-shape" x="120" y="120" width="60" height="40"/><text class="fig-txt" x="150" y="145" text-anchor="middle">TT</text>
    </svg>`
};

// --- 2c. Content fixes from the educational review — see the review report for the reasoning
// behind each change. Applied as a patch over the loaded data rather than editing the archived
// source file, so every change here is visible, versioned and reversible in one place. ---

function applyContentFixes(CURRICULUM, CH) {
  const byId = {};
  CURRICULUM.forEach((g) => g.topics.forEach((t) => { byId[t.id] = t; }));

  // Educational-review follow-up: "Read the Chapter" was too thin to build real understanding from
  // (one short paragraph, no worked real-world scenarios). LESSON_EXPANSIONS in lesson-content.mjs
  // replaces t.lesson per topic with a fuller explanation plus 3 real-world example cards.
  Object.keys(LESSON_EXPANSIONS).forEach((id) => { if (byId[id]) byId[id].lesson = LESSON_EXPANSIONS[id]; });

  // Decimals: fix #1 — an ordering question listed 3 numbers but two were identical (0.7 and 0.7),
  // so the answer key silently dropped one. Made the third value genuinely distinct. Both the
  // question and its answer wrap all three numbers in a single <span class="m">, so patch that
  // whole run of text rather than each number separately.
  const dec = byId.decimals;
  const dupQ = dec.easy.find((e) => e.q.includes('0.7, 0.67, 0.7'));
  if (dupQ) {
    dupQ.q = dupQ.q.replace('0.7, 0.67, 0.7', '0.7, 0.67, 0.72');
    dupQ.steps = dupQ.steps.map((s) => s.replace('0.67, 0.7', '0.67, 0.7, 0.72'));
    dupQ.ans = dupQ.ans.replace('0.67, 0.7', '0.67, 0.7, 0.72');
  }
  // Decimals: fix #2 — "Round 12.45 to 1 decimal place" was answered 12.4, contradicting the
  // notebook's own "5 or more rounds up" rule (12.45 rounds to 12.5). Corrected the answer key.
  const roundQ = dec.easy.find((e) => e.q.includes('12.45'));
  if (roundQ) {
    roundQ.steps = roundQ.steps.map((s) => s.replace('12.4', '12.5'));
    roundQ.ans = roundQ.ans.replace('12.4', '12.5');
  }

  // Fractions: the review found no misconception check for dividing fractions (only addition is
  // covered), and no mixed-number question anywhere in the bank. Extend the Watch Out with the
  // division error, and swap the least-distinctive Hard question for a mixed-number one.
  const frac = byId.fractions;
  frac.watchout += ' And when dividing, flip the second fraction before multiplying — dividing straight across gives the wrong answer.';
  // The Hard tier's final question (1/2 + 1/3 + 1/6, using nested .frac/.n/.d spans rather than
  // plain "1/2" text) is the least distinctive of the 10 — replace it with a mixed-number question,
  // since the review found none anywhere in this chapter despite mixed numbers being common in
  // real assessments. Keeps the tier at exactly 10 questions.
  const mixedFrac = (n, d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
  frac.hard[frac.hard.length - 1] = {
    q: `Work out 1&frac12; + ${mixedFrac(2, 3)} (a mixed number plus a fraction).`,
    steps: [
      `Convert 1&frac12; to an improper fraction: ${mixedFrac(3, 2)}.`,
      `Common denominator of 2 and 3 is 6: ${mixedFrac(3, 2)} = ${mixedFrac(9, 6)}, ${mixedFrac(2, 3)} = ${mixedFrac(4, 6)}.`,
      `Add: ${mixedFrac(9, 6)} + ${mixedFrac(4, 6)} = ${mixedFrac(13, 6)} = 2${mixedFrac(1, 6)}.`
    ],
    ans: `2${mixedFrac(1, 6)}`
  };

  // Probability: "sample space" is used in the Lesson prose but was never added to Vocabulary, and
  // the AND/OR combination rule used in the Hard-tier dice questions was only ever demonstrated
  // through worked steps, never stated as an explicit rule.
  const prob = CH.probability;
  if (prob && prob.vocab && !prob.vocab.some((v) => v[0] === 'sample space')) {
    prob.vocab.push(['sample space', 'the full list of equally likely outcomes for an experiment']);
  }
  if (prob) {
    prob.summary = prob.summary || [];
    if (!prob.summary.some((s) => s.includes('AND') || s.includes('OR'))) {
      prob.summary.push('For combined events: AND means multiply the probabilities, OR means add them');
    }
  }

  // Pythagoras: tell the learner directly that the numbers refresh on reset — a genuine strength
  // (prevents rote memorisation) the chapter never actually told the student about.
  const pyth = CH.pythagoras;
  if (pyth && pyth.hook && !pyth.hook.includes('fresh numbers')) {
    pyth.hook += ' (Reset your progress any time for a fresh set of numbers to practise on.)';
  }

  // Perimeter & Area: the original grid-diagram's caption sat only 4px below the grid's bottom edge
  // (viewBox height 90, grid ends at y=82, caption baseline at y=86) — the caption's own text visibly
  // overlapped the bottom row of the grid. Give it real clearance below the grid instead.
  const pa = byId['perimeter-area'];
  if (pa && pa.model && pa.model.includes('viewBox="0 0 170 90"')) {
    pa.model = pa.model.replace('viewBox="0 0 170 90"', 'viewBox="0 0 170 100"').replace('<text x="85" y="86"', '<text x="85" y="96"');
  }

  // --- Round-2 educational review follow-up (see math-notebook-review-round2 artifact) ---
  // Vocabulary gaps: terms used in the expanded lessons/practice but never formally defined.
  const pushVocab = (id, term, def) => {
    const c = CH[id];
    if (c && c.vocab && !c.vocab.some((v) => v[0] === term)) c.vocab.push([term, def]);
  };
  pushVocab('fractions', 'reciprocal', 'a fraction flipped upside down — multiply by it instead of dividing');
  pushVocab('factors', 'composite', 'a number with more than two factors — not prime, and not 1');
  pushVocab('percentages', 'base', 'the original amount a percentage is taken of');
  pushVocab('volume', 'net', 'a solid unfolded flat, showing every face at once');

  // Fractions: division of fractions had only 1 item in 30 (Hard[8]) against 4 multiplication
  // items — replace 2 of the multiplication duplicates with division, one framed concretely
  // ("how many quarters fit?") matching the new lesson worked example, one fraction ÷ fraction.
  const mixedFracR2 = (n, d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
  if (frac.hard[4]) {
    frac.hard[4] = {
      q: `How many quarters fit into 3? Work out 3 &divide; ${mixedFracR2(1, 4)}.`,
      steps: [`Dividing by a fraction asks "how many of these fit?" &mdash; flip and multiply: 3 &times; ${mixedFracR2(4, 1)}.`, `= 12.`],
      ans: `12`
    };
  }
  if (frac.hard[7]) {
    frac.hard[7] = {
      q: `Divide ${mixedFracR2(2, 3)} &divide; ${mixedFracR2(1, 6)}.`,
      steps: [`Flip the second fraction and multiply: ${mixedFracR2(2, 3)} &times; ${mixedFracR2(6, 1)}.`, `= 12/3 = 4.`],
      ans: `4`
    };
  }

  // Percentages: the only "reverse" item (Hard[8]: "15% of a number is 45") is abstract — no
  // "sale price after a discount, find the original" item existed, the direction real life asks
  // most often. Replace 2 of the 3 near-duplicate "increases by X%, find new value" items.
  const pct = byId.percentages;
  if (pct.hard[5]) {
    pct.hard[5] = {
      q: `A jacket is on sale for <span class="m">$60</span> after <span class="m">25%</span> off. What was the original price?`,
      steps: [`The sale price is 100% &minus; 25% = 75% of the original.`, `Original = 60 &divide; 0.75 = <span class="m">$80</span>.`],
      ans: `<span class="m">$80</span>`
    };
  }
  if (pct.hard[6]) {
    pct.hard[6] = {
      q: `After a <span class="m">20%</span> pay rise, Mia earns <span class="m">$480</span> a week. What did she earn before the rise?`,
      steps: [`$480 is 100% + 20% = 120% of the original wage.`, `Original = 480 &divide; 1.2 = <span class="m">$400</span>.`],
      ans: `<span class="m">$400</span>`
    };
  }

  // Place value: no item exercised a rounding "carry" across place columns, and none asked for a
  // numeral written from words with an internal zero (the exact case that hides the zero-as-
  // placeholder idea). Replace 2 of the 4 near-identical "largest/smallest digit" items.
  const pv = byId['place-value'];
  if (pv.hard[2]) {
    pv.hard[2] = {
      q: `Round <span class="m">9996</span> to the nearest 10.`,
      steps: [`Look at the ones digit: 6.`, `6 is 5 or more, so round up &mdash; this carries all the way across: 9996 &rarr; <span class="m">10 000</span>.`],
      ans: `<span class="m">10 000</span>`
    };
  }
  if (pv.hard[3]) {
    pv.hard[3] = {
      q: `Write "six thousand and five" as a numeral.`,
      steps: [`Six thousand is 6000.`, `"And five" adds 5 ones, but the hundreds and tens columns are empty &mdash; don't drop those zeros: <span class="m">6005</span>.`],
      ans: `<span class="m">6005</span>`
    };
  }

  // Ratios: rate half of "Ratios & Rates" had no best-buy/unit-price comparison despite the
  // chapter's own real-world blurb promising one. Replace 1 of the 3 near-duplicate "differ by n"
  // items.
  const rat = byId.ratios;
  if (rat.hard[6]) {
    rat.hard[6] = {
      q: `Which is better value: <span class="m">500 g</span> of rice for <span class="m">$4.50</span>, or <span class="m">750 g</span> for <span class="m">$6.30</span>?`,
      steps: [`Unit price A: $4.50 &divide; 500 = $0.009 per gram (0.9c/g).`, `Unit price B: $6.30 &divide; 750 = $0.0084 per gram (0.84c/g).`, `B is cheaper per gram, so it is better value.`],
      ans: `750 g for $6.30`
    };
  }

  // Expressions: negative coefficients outside a bracket never appeared in the bank — the first
  // time a student meets −2(x − 3) would be in a test. Replace one simpler multiplicative item.
  const expr = byId.expressions;
  if (expr.hard[8]) {
    expr.hard[8] = {
      q: `Expand and simplify <span class="m">&minus;3(x &minus; 4)</span>.`,
      steps: [`Multiply every term inside by &minus;3: &minus;3&times;x = &minus;3x, and &minus;3&times;(&minus;4) = +12.`, `&minus;3(x &minus; 4) = <span class="m">&minus;3x + 12</span>.`],
      ans: `<span class="m">−3x + 12</span>`
    };
  }

  // Inequalities: every item solves for x, but none directly tests whether a given boundary value
  // is itself part of the solution — the exact question the ride-height scenario raises. Replace
  // 2 of the 10 near-duplicate "solve a 2-step inequality" Medium items.
  const ineq = byId.inequalities;
  if (ineq.medium[4]) {
    ineq.medium[4] = {
      q: `A charity asks for donations of at least $15 (<span class="m">d &ge; 15</span>). Is a donation of exactly $15 accepted?`,
      steps: [`&ge; means "greater than OR equal to" &mdash; the boundary value is included.`, `$15 satisfies d &ge; 15, so it IS accepted.`],
      ans: `Yes`
    };
  }
  if (ineq.medium[8]) {
    ineq.medium[8] = {
      q: `A lift has a strict weight limit: total weight must be under 500 kg (<span class="m">w &lt; 500</span>). Is exactly 500 kg allowed?`,
      steps: [`&lt; means strictly less than &mdash; the boundary value is NOT included.`, `500 is not less than 500, so exactly 500 kg is NOT allowed.`],
      ans: `No`
    };
  }

  // Statistics: an even-count median item existed only once, in the Hard tier — Medium (where
  // mean/median are first practised together) used odd-count (5-value) data in all 10 items, so a
  // learner could complete the tier without ever averaging two middle values.
  const stats = byId.statistics;
  if (stats.medium[9]) {
    stats.medium[9] = {
      q: `For <span class="m">20, 6, 14, 8</span>, find the mean and median (even count).`,
      steps: [`Mean: (20+6+14+8) &divide; 4 = 48 &divide; 4 = 12.`, `Median: sorted is 6, 8, 14, 20 &mdash; with 4 values, average the middle two: (8+14) &divide; 2 = 11.`],
      ans: `mean 12, median 11`
    };
  }

  // --- Round-3 review follow-up: worked-solution completeness (the "show the working" P0s) ---
  // A recurring finding across the site was that Medium/Hard "Working, step by step" blocks
  // restated the rule and jumped to the answer, showing no intermediate arithmetic — so a stuck
  // learner clicking "Show solution" had nothing to learn from. The fixes below rebuild those
  // steps as a full ordered trace (one operation per line). Every answer is unchanged.
  const mspan = (s) => `<span class="m">${s}</span>`;
  const fracHtml = (n, d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;

  // Operations & Order (BEDMAS): all 20 Medium/Hard solutions were two generic templated
  // lines. medium[0]/hard[0] also feed the top-of-chapter worked examples, so those improve too.
  const op = byId.operations;
  const opSteps = {
    medium: [
      [`Brackets first: ${mspan('8 + 2 = 10')}.`, `Exponent: ${mspan('3² = 9')}.`, `Multiply: ${mspan('10 × 9 = 90')}.`, `Subtract: ${mspan('90 − 5 = 85')}.`],
      [`Exponent first: ${mspan('2² = 4')}.`, `Multiply: ${mspan('6 × 3 = 18')}.`, `Add: ${mspan('4 + 18 = 22')}.`],
      [`Brackets first: ${mspan('15 − 7 = 8')}.`, `Multiply: ${mspan('8 × 4 = 32')}.`, `Add: ${mspan('32 + 1 = 33')}.`],
      [`Brackets first: ${mspan('2 + 3 = 5')}.`, `Divide: ${mspan('50 ÷ 5 = 10')}.`, `Add: ${mspan('10 + 6 = 16')}.`],
      [`Brackets first: ${mspan('9 − 5 = 4')}.`, `Exponent: ${mspan('4² = 16')}.`, `Multiply: ${mspan('4 × 16 = 64')}.`],
      [`Exponents first: ${mspan('3² = 9')} and ${mspan('4² = 16')}.`, `Add: ${mspan('9 + 16 = 25')}.`, `Subtract: ${mspan('25 − 5 = 20')}.`],
      [`Brackets first: ${mspan('6 + 4 = 10')}.`, `Exponent: ${mspan('10² = 100')}.`, `Divide: ${mspan('100 ÷ 20 = 5')}.`],
      [`Exponent first: ${mspan('4² = 16')}.`, `Multiply: ${mspan('3 × 16 = 48')}.`, `Subtract: ${mspan('100 − 48 = 52')}.`],
      [`Inside the brackets, ÷ before +: ${mspan('12 ÷ 4 = 3')}, then ${mspan('3 + 5 = 8')}.`, `Multiply: ${mspan('8 × 2 = 16')}.`],
      [`Exponent first: ${mspan('2³ = 8')}.`, `Multiply: ${mspan('8 × 2 = 16')}.`, `Add: ${mspan('7 + 16 = 23')}.`],
    ],
    hard: [
      [`Innermost brackets: ${mspan('3 + 1 = 4')}.`, `Outer brackets: ${mspan('2 × 4 = 8')}.`, `Divide: ${mspan('48 ÷ 8 = 6')}.`, `Exponent: ${mspan('5² = 25')}.`, `Add: ${mspan('6 + 25 = 31')}.`],
      [`Exponents inside the brackets: ${mspan('4² = 16')}, ${mspan('2³ = 8')}.`, `Each bracket: ${mspan('16 − 8 = 8')} and ${mspan('6 + 3 = 9')}.`, `Multiply: ${mspan('8 × 9 = 72')}.`],
      [`Brackets (exponent first): ${mspan('2² = 4')}, then ${mspan('4 + 1 = 5')}.`, `Divide and multiply, left to right: ${mspan('100 ÷ 5 = 20')}, ${mspan('3 × 4 = 12')}.`, `Subtract: ${mspan('20 − 12 = 8')}.`],
      [`Innermost brackets: ${mspan('8 − 6 = 2')}.`, `Exponents: ${mspan('2² = 4')} and ${mspan('3² = 9')}.`, `Inside the outer bracket: ${mspan('9 + 4 = 13')}.`, `Multiply: ${mspan('2 × 13 = 26')}.`],
      [`Brackets: ${mspan('7 + 5 = 12')}.`, `Exponent: ${mspan('6² = 36')}.`, `Multiply and divide, left to right: ${mspan('12 × 3 = 36')}, ${mspan('36 ÷ 2 = 18')}.`, `Subtract: ${mspan('36 − 18 = 18')}.`],
      [`Exponent inside the brackets: ${mspan('2³ = 8')}, then ${mspan('30 − 8 = 22')}.`, `Divide: ${mspan('22 ÷ 11 = 2')}.`, `Exponent: ${mspan('5² = 25')}.`, `Add: ${mspan('2 + 25 = 27')}.`],
      [`Innermost brackets: ${mspan('1 + 2 = 3')}.`, `Divide inside: ${mspan('18 ÷ 3 = 6')}.`, `Exponent: ${mspan('5² = 25')}.`, `Multiply: ${mspan('6 × 3 = 18')}.`, `Subtract: ${mspan('25 − 18 = 7')}.`],
      [`Brackets: ${mspan('2 + 3 = 5')} and ${mspan('10 − 6 = 4')}.`, `Exponents: ${mspan('5² = 25')}, ${mspan('4² = 16')}.`, `Subtract: ${mspan('25 − 16 = 9')}.`],
      [`Exponent first: ${mspan('6³ = 216')}.`, `Brackets: ${mspan('4 × 9 = 36')}.`, `Divide: ${mspan('216 ÷ 36 = 6')}.`, `Add: ${mspan('6 + 7 = 13')}.`],
      [`Inside the brackets, ÷ then exponent: ${mspan('45 ÷ 5 = 9')}, ${mspan('3² = 9')}, then ${mspan('9 + 9 = 18')}.`, `Multiply: ${mspan('18 × 2 = 36')}.`],
    ]
  };
  ['medium', 'hard'].forEach((k) => opSteps[k].forEach((st, i) => { if (op[k][i]) op[k][i].steps = st; }));

  // Fractions: every add/subtract solution named the common denominator, then skipped the one
  // genuinely new step — rewriting each fraction over it — before giving the answer. Show it.
  const fMed = [
    [`Common denominator of 4 and 3 is ${mspan('12')}.`, `Rewrite each over 12: ${fracHtml(3, 4)} = ${fracHtml(9, 12)} (×3) and ${fracHtml(2, 3)} = ${fracHtml(8, 12)} (×4).`, `Add the numerators: ${fracHtml(9, 12)} + ${fracHtml(8, 12)} = ${fracHtml(17, 12)} = 1${fracHtml(5, 12)}.`],
    [`Common denominator of 6 and 4 is ${mspan('12')}.`, `Rewrite each over 12: ${fracHtml(5, 6)} = ${fracHtml(10, 12)} (×2) and ${fracHtml(1, 4)} = ${fracHtml(3, 12)} (×3).`, `Subtract: ${fracHtml(10, 12)} − ${fracHtml(3, 12)} = ${fracHtml(7, 12)}.`],
    [`Common denominator of 3 and 6 is ${mspan('6')}.`, `Rewrite: ${fracHtml(2, 3)} = ${fracHtml(4, 6)} (×2); ${fracHtml(1, 6)} already has denominator 6.`, `Add: ${fracHtml(4, 6)} + ${fracHtml(1, 6)} = ${fracHtml(5, 6)}.`],
    [`Common denominator of 8 and 2 is ${mspan('8')}.`, `Rewrite: ${fracHtml(1, 2)} = ${fracHtml(4, 8)} (×4); ${fracHtml(7, 8)} already has denominator 8.`, `Subtract: ${fracHtml(7, 8)} − ${fracHtml(4, 8)} = ${fracHtml(3, 8)}.`],
    [`Common denominator of 2 and 5 is ${mspan('10')}.`, `Rewrite each over 10: ${fracHtml(1, 2)} = ${fracHtml(5, 10)} (×5) and ${fracHtml(2, 5)} = ${fracHtml(4, 10)} (×2).`, `Add: ${fracHtml(5, 10)} + ${fracHtml(4, 10)} = ${fracHtml(9, 10)}.`],
    [`Common denominator of 5 and 10 is ${mspan('10')}.`, `Rewrite: ${fracHtml(3, 5)} = ${fracHtml(6, 10)} (×2); ${fracHtml(1, 10)} already has denominator 10.`, `Add: ${fracHtml(6, 10)} + ${fracHtml(1, 10)} = ${fracHtml(7, 10)}.`],
    [`Common denominator of 8 and 4 is ${mspan('8')}.`, `Rewrite: ${fracHtml(1, 4)} = ${fracHtml(2, 8)} (×2); ${fracHtml(5, 8)} already has denominator 8.`, `Subtract: ${fracHtml(5, 8)} − ${fracHtml(2, 8)} = ${fracHtml(3, 8)}.`],
    [`Common denominator of 3 and 4 is ${mspan('12')}.`, `Rewrite each over 12: ${fracHtml(2, 3)} = ${fracHtml(8, 12)} (×4) and ${fracHtml(3, 4)} = ${fracHtml(9, 12)} (×3).`, `Add: ${fracHtml(8, 12)} + ${fracHtml(9, 12)} = ${fracHtml(17, 12)} = 1${fracHtml(5, 12)}.`],
    [`Common denominator of 10 and 5 is ${mspan('10')}.`, `Rewrite: ${fracHtml(2, 5)} = ${fracHtml(4, 10)} (×2); ${fracHtml(9, 10)} already has denominator 10.`, `Subtract: ${fracHtml(9, 10)} − ${fracHtml(4, 10)} = ${fracHtml(5, 10)} = ${fracHtml(1, 2)}.`],
    [`Common denominator of 4 and 6 is ${mspan('12')}.`, `Rewrite each over 12: ${fracHtml(1, 4)} = ${fracHtml(3, 12)} (×3) and ${fracHtml(5, 6)} = ${fracHtml(10, 12)} (×2).`, `Add: ${fracHtml(3, 12)} + ${fracHtml(10, 12)} = ${fracHtml(13, 12)} = 1${fracHtml(1, 12)}.`],
  ];
  fMed.forEach((st, i) => { if (frac.medium[i]) frac.medium[i].steps = st; });

  // Fraction-of-a-quantity (Hard 0–3) was used but never modelled: show the method — divide by
  // the denominator, multiply by the numerator.
  const ofQty = [
    [`${fracHtml(2, 3)} of 30: divide by the denominator (${mspan('30 ÷ 3 = 10')}), then multiply by the numerator (${mspan('10 × 2 = 20')}).`, `Now ${fracHtml(3, 4)} of 20: ${mspan('20 ÷ 4 = 5')}, then ${mspan('5 × 3 = 15')}.`],
    [`${fracHtml(3, 5)} of 40: ${mspan('40 ÷ 5 = 8')}, then ${mspan('8 × 3 = 24')}.`, `Now ${fracHtml(1, 2)} of 24: ${mspan('24 ÷ 2 = 12')}.`],
    [`${fracHtml(3, 4)} of 24: ${mspan('24 ÷ 4 = 6')}, then ${mspan('6 × 3 = 18')}.`, `Now ${fracHtml(2, 3)} of 18: ${mspan('18 ÷ 3 = 6')}, then ${mspan('6 × 2 = 12')}.`],
    [`${fracHtml(2, 5)} of 60: ${mspan('60 ÷ 5 = 12')}, then ${mspan('12 × 2 = 24')}.`, `Now ${fracHtml(3, 4)} of 24: ${mspan('24 ÷ 4 = 6')}, then ${mspan('6 × 3 = 18')}.`],
  ];
  ofQty.forEach((st, i) => { if (frac.hard[i]) frac.hard[i].steps = st; });

  // Factors: the 5 HCF/LCM solutions asserted the answers with a one-line non-method, even though
  // the key-box promises the prime-factorisation method ("primes in BOTH" / "highest power of
  // EACH"). Model it — the shortcut that actually scales to bigger numbers.
  const fac = byId.factors;
  const factHcfLcm = [
    [`Prime factorise each: ${mspan('18 = 2 × 3 × 3')} and ${mspan('24 = 2 × 2 × 2 × 3')}.`, `HCF = the primes in BOTH = ${mspan('2 × 3 = 6')}.`, `LCM = the highest power of every prime = ${mspan('2³ × 3² = 8 × 9 = 72')}.`, `Check: ${mspan('HCF × LCM = 6 × 72 = 432 = 18 × 24')}. ✓`],
    [`Prime factorise: ${mspan('12 = 2 × 2 × 3')} and ${mspan('16 = 2 × 2 × 2 × 2')}.`, `HCF = primes in both = ${mspan('2 × 2 = 4')}.`, `LCM = highest power of each = ${mspan('2⁴ × 3 = 16 × 3 = 48')}.`],
    [`Prime factorise: ${mspan('20 = 2 × 2 × 5')} and ${mspan('30 = 2 × 3 × 5')}.`, `HCF = primes in both = ${mspan('2 × 5 = 10')}.`, `LCM = highest power of each = ${mspan('2² × 3 × 5 = 60')}.`],
    [`Prime factorise: ${mspan('15 = 3 × 5')} and ${mspan('25 = 5 × 5')}.`, `HCF = primes in both = ${mspan('5')}.`, `LCM = highest power of each = ${mspan('3 × 5² = 3 × 25 = 75')}.`],
    [`Prime factorise: ${mspan('24 = 2 × 2 × 2 × 3')} and ${mspan('36 = 2 × 2 × 3 × 3')}.`, `HCF = primes in both = ${mspan('2 × 2 × 3 = 12')}.`, `LCM = highest power of each = ${mspan('2³ × 3² = 8 × 9 = 72')}.`],
  ];
  factHcfLcm.forEach((st, i) => { if (fac.medium[i]) fac.medium[i].steps = st; });

  // Integers: the −3² vs (−3)² distinction was taught in the Watch-out box but never tested (Hard
  // only had (−3)²). Turn that item into an explicit side-by-side contrast so the nuance is checked.
  const intg = byId.integers;
  if (intg.hard[4]) {
    intg.hard[4] = {
      q: `Work out ${mspan('(−3)²')} and ${mspan('−3²')}. (The brackets change everything.)`,
      steps: [
        `${mspan('(−3)²')} means ${mspan('(−3) × (−3) = 9')} &mdash; the brackets square the whole negative number.`,
        `${mspan('−3²')} means ${mspan('−(3²) = −(9) = −9')} &mdash; with no brackets the power applies to the 3 only, then the minus sign is applied.`,
        `So ${mspan('(−3)² = 9')} but ${mspan('−3² = −9')}.`
      ],
      ans: `9 and −9`
    };
  }

  // Statistics: "pick a sensible average for the situation" was a stated goal but never assessed —
  // all 30 items were pure computation. Convert two near-duplicate mean/median items into the
  // judgement task the goal names (leaving the even-count median item at medium[9] intact).
  const st2 = byId.statistics;
  st2.medium[7] = {
    q: `A shoe shop records the sizes it sells and wants to stock the <b>most popular</b> size. Which average should it use &mdash; mean, median or mode?`,
    steps: [`The shop wants the value that comes up most often, not a calculated centre or a middle value.`, `The <b>mode</b> is the most frequent value &mdash; here, the size sold most.`],
    ans: `mode`
  };
  st2.medium[8] = {
    q: `Seven houses sell for similar prices, but one mansion sells for ten times as much. To describe a <b>typical</b> price, is the mean or the median fairer?`,
    steps: [`The mansion is an outlier; it drags the mean upward so it no longer represents a typical house.`, `The <b>median</b> (the middle value) is barely affected by one extreme value, so it is the fairer choice here.`],
    ans: `median`
  };

  // Statistics: a "Data & Averages" chapter with no chart to read. Add one frequency-table item so
  // data literacy means more than a bare list of numbers (replaces a plain "find the mode" item).
  if (st2.hard[8]) {
    st2.hard[8] = {
      q: `A shop records the shoe sizes it sells: <table class="pvtable"><thead><tr><th>Size</th><th>6</th><th>7</th><th>8</th><th>9</th></tr></thead><tbody><tr><td>Sold</td><td>3</td><td>8</td><td>5</td><td>2</td></tr></tbody></table>Read the table: what is the modal size (the mode)?`,
      steps: [`The mode is the value with the highest frequency.`, `Size 7 was sold most often (8 times), so the modal size is <span class="m">7</span>.`],
      ans: `7`
    };
  }

  // Volume: the mistake-detective tested add-vs-multiply (covered well elsewhere) but never the
  // cm³-vs-cm² units confusion the chapter itself flags as the key distinction. Swap it in.
  if (CH.volume) {
    CH.volume.mistake = {
      wrong: `A cuboid&rsquo;s volume is written as <span class="bad">24 cm&sup2;</span>.`,
      error: `They used square units (cm&sup2;, for area) where volume needs cubic units (cm&sup3;).`,
      fix: `Volume fills space in three directions, so it is measured in <b>cubic</b> units: 24 cm&sup3;. Square units (cm&sup2;) are for surface area &mdash; the flat covering.`
    };
  }

  // Probability: the Hard "at least one head" item recommends the complement method but only ever
  // counted directly. Show both routes so the complement technique the chapter teaches is modelled.
  const prb = byId.probability;
  if (prb.hard[0]) {
    prb.hard[0].steps = [
      `Sample space (4 equally likely): HH, HT, TH, TT.`,
      `Exactly one head — HT and TH — is 2/4 = <span class="m">1/2</span>.`,
      `At least one head, counted directly (HH, HT, TH) is 3/4. Or by the complement: 1 − P(no heads) = 1 − P(TT) = 1 − 1/4 = <span class="m">3/4</span> — the same answer, the easy way.`
    ];
  }

  // --- Round-4 follow-up: answer-format fix for "rule + Nth term" compound answers ---
  // These items had no authored `accept`, so generate-book.mjs derived one straight from `ans` —
  // producing a single rigid magic string ("Rule 3n + 2; 10th = 32") that only matched typed
  // verbatim, punctuation included. A learner answering "3n+2, 32" or "2+3n, 32" (mathematically
  // identical) was marked wrong. Author an explicit accept phrased as "<rule> and <value>" instead:
  // this reuses the EXISTING normParts()/partsMatch() "A and B" compound machinery (already used
  // by ratios' "$18 and $27" items) rather than inventing a new parsing pathway, and composes with
  // the new parseLinearExpr() equivalence so a reordered rule ("2+3n") still matches. `ans` (the
  // displayed worked solution) is untouched — only the accepted typed form changes.
  const patterns = byId.patterns;
  const ruleAndTerm = [
    ['3n + 2', '32'], ['4n − 2', '38'], ['5n + 2', '52'], ['6n − 5', '55'], ['2n + 2', '22'],
    ['7n − 4', '66'], ['3n + 7', '37'], ['4n + 2', '42'], ['5n − 5', '45'], ['2n + 6', '26']
  ];
  ruleAndTerm.forEach(([rule, term], i) => { if (patterns.medium[i]) patterns.medium[i].accept = [`${rule} and ${term}`]; });
  if (patterns.hard[0]) patterns.hard[0].accept = ['3n + 1 and 61', '3n + 1 and 61 sticks'];
  if (patterns.hard[8]) patterns.hard[8].accept = ['3n + 3 and 39'];
}

// --- 3. Shared page shell ---

function pageShell({ title, active, bodyHtml, root, extraScripts }) {
  root = root || '';
  extraScripts = extraScripts || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} &middot; The Maths Notebook</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Nunito:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}css/styles.css">
<script>window.SITE_ROOT=${JSON.stringify(root)};${active ? `window.CURRENT_TOPIC_ID=${JSON.stringify(active)};` : ''}</script>
</head>
<body>
<div class="wrap">
  <header class="topbar">
    <a class="brandmark" href="${root}index.html">
      <div class="glyph">&#8721;</div>
      <div><h1>The Maths Notebook</h1><p>Years 6 &ndash; 8 &middot; NZ</p></div>
    </a>
    <nav class="topnav" id="nav"></nav>
    <button class="navtoggle" id="navtoggle" aria-label="Open menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </header>
  <main class="main">
    <div class="inner">
${bodyHtml}
    </div>
  </main>
</div>
<script src="${root}js/toc-data.js"></script>
<script src="${root}js/progress-store.js"></script>
<script src="${root}js/nav.js"></script>
${extraScripts.map(s => `<script src="${root}${s}"></script>`).join('\n')}
</body>
</html>
`;
}

// --- 4. Chapter (topic) page body, mirroring the original sectionInner() ---

// --- 3b. Graded drag-and-drop pilot: js/tile-builder.js, applied to Patterns' Medium tier ---
//
function renderChapterBody(t, group, prev, next) {
  const c = t.__ch || {};
  const dynamic = DYNAMIC_IDS.has(t.id);
  const staticCheck = {};
  const lessonHtml = t.lesson || `<p>${t.idea}</p>`;

  const road = [];
  const addRoad = (key, label, show) => { if (show) road.push(`<button class="hf-jump" type="button" data-target="${key}"><span class="dot"></span><span>${label}</span></button>`); };
  const intro = INTRO_FIG[t.id] ? `<figure class="figwrap intro">${INTRO_FIG[t.id]()}<figcaption class="figcap">${INTRO_CAP[t.id] || ''}</figcaption></figure>` : '';
  const model = t.model || STATIC_MODELS[t.id] || '';
  addRoad('goals', 'Goals', c.goals);
  addRoad('wonder', 'Notice', NOTICE_WONDER[t.id]);
  addRoad('discovery', 'Discover', c.discovery);
  addRoad('vocab', 'Vocabulary', c.vocab);
  addRoad('explain', 'Explanation', true);
  addRoad('visual', 'Visual model', intro || model);
  addRoad('explore', 'Explore', true);
  addRoad('examples', 'Examples', true);
  addRoad('practice', 'Practice', true);
  addRoad('assignment', 'Assignment', true);
  addRoad('retrieval', 'Retrieval', c.retrieval);
  addRoad('further', 'Go further', GO_FURTHER[t.id]);
  const roadmap = road.length ? `<div class="hf-roadmap" aria-label="Chapter sections">${road.join('')}</div>` : '';
  const visualParts = [intro, model ? `<div class="model">${model}</div>` : ''].filter(Boolean).join('');

  const S = [];
  if (c.hook) S.push(`<div class="hf-hook"><span class="hf-spark">&#10022;</span><span>${c.hook}</span></div>`);
  if (roadmap) S.push(roadmap);
  if (c.goals) S.push(`<section class="hf-sec goals" data-section="goals"><div class="hf-tag">&#127919; By the end you can</div><ul class="hf-goals">${c.goals.map(g => `<li>${g}</li>`).join('')}</ul></section>`);
  if (c.prereq) S.push(`<section class="hf-sec prereq" data-section="prereq"><div class="hf-tag">&#9989; Before you start</div><ul class="hf-list">${c.prereq.map(p => `<li>${p}</li>`).join('')}</ul></section>`);
  // Illustrative Mathematics' "Notice and Wonder" warm-up: an open scene with two low-stakes
  // prompts, placed BEFORE the directed Discover prediction so the learner looks before predicting.
  const nw = NOTICE_WONDER[t.id];
  if (nw) S.push(`<section class="hf-sec wonder" data-section="wonder"><div class="hf-tag">&#128064; Notice &amp; wonder</div><p class="hf-sub">Before any rules: just look. What do you notice? What do you wonder?</p><p class="nw-scene">${nw.scene}</p><button class="hf-reveal">Compare with a mathematician's eye</button><div class="hf-hidden"><div class="nw-grid"><div class="nw-col"><h5>You might notice&hellip;</h5><ul>${nw.notice.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="nw-col"><h5>You might wonder&hellip;</h5><ul>${nw.wonder.map(x => `<li>${x}</li>`).join('')}</ul></div></div><p class="nw-tail">Hold on to those wonderings &mdash; this chapter answers most of them.</p></div></section>`);
  if (c.discovery) S.push(`<section class="hf-sec discovery" data-section="discovery"><div class="hf-tag">&#128302; Discover &mdash; predict first</div><p>${c.discovery.prompt}</p><button class="hf-reveal">Reveal</button><div class="hf-hidden"><p>${c.discovery.answer}</p></div></section>`);
  // Vocabulary now renders BEFORE the explanation: new terms used in the Lesson prose are defined
  // here first, instead of a strictly-linear reader meeting the word before its formal definition.
  if (c.vocab) S.push(`<section class="hf-sec vocab" data-section="vocab"><div class="hf-tag">&#128218; Key words</div><dl class="hf-vocab">${c.vocab.map(v => `<div class="vrow"><dt>${v[0]}</dt><dd>${v[1]}</dd></div>`).join('')}</dl></section>`);
  // Math Mammoth-style explicit mental-calculation strategy, appended to the chapter reading.
  const mmtip = MENTAL_TIPS[t.id] ? `<div class="mmtip"><span class="mtag">&#9889; Mental maths strategy</span>${MENTAL_TIPS[t.id]}</div>` : '';
  S.push(`<section class="hf-sec explain" data-section="explain"><div class="hf-tag">&#128214; Read the chapter</div><p class="hf-sub">${t.idea}</p><div class="lesson">${lessonHtml}</div>${t.why ? `<div class="why">${t.why}</div>` : ''}${t.watchout ? `<div class="watchout"><span class="wtag">&#9888; Watch out</span>${t.watchout}</div>` : ''}${mmtip}</section>`);
  // Singapore-style Concrete → Pictorial → Abstract strip, for the four classic bar-model topics.
  const cpa = CPA_PANELS[t.id] ? `<div class="cpa-wrap"><div class="cap">Concrete &rarr; Pictorial &rarr; Abstract &mdash; three views of the same idea</div>${CPA_PANELS[t.id]}</div>` : '';
  if (visualParts || cpa) S.push(`<section class="hf-sec visual" data-section="visual"><div class="hf-tag">&#128202; Visual model</div><p class="hf-sub">Use the diagram before calculating. The visual should make the structure easier to see.</p>${visualParts}${cpa}</section>`);
  // GeoGebra/Desmos-style interactive: js/explore.js builds the widget for this topic id at runtime.
  S.push(`<section class="hf-sec explore" data-section="explore"><div class="hf-tag">&#127899;&#65039; Explore &mdash; play with the maths</div><p class="hf-sub">Predict what will happen first, then drag &mdash; the diagram responds instantly.</p><div id="explore-widget" class="explore-widget"></div></section>`);

  if (dynamic) {
    S.push(`<section class="hf-sec worked" data-section="examples"><div class="hf-tag">&#9998; Worked examples across scenarios</div><p class="hf-sub">Read these like a teacher modelling the method: one basic case, one mixed case, and one harder transfer case.</p><div id="dyn-worked">Loading&hellip;</div></section>`);
    S.push(`<section class="hf-sec practice" data-section="practice"><div class="hf-tag">&#9997;&#65039; Guided and independent practice</div><p class="hf-sub">Work up through Easy &rarr; Medium &rarr; Hard. Type an answer and press Mark; the full solution unlocks after each attempt.</p><div class="tabs" id="dyn-tabs"></div><div id="dyn-panes"></div></section>`);
    S.push(`<section class="hf-sec assignment" data-section="assignment"><div class="hf-tag">&#128221; Assignment work</div><p class="hf-sub">Do these on paper after the guided practice. They mix fluency, reasoning, application, challenge and reflection question types.</p><div class="assignment-grid" id="dyn-assignment"></div><div class="assignment-part"><h4>Part D - Explain and create</h4><ul><li>Write a short paragraph explaining the main idea of ${t.name} in your own words.</li><li>Create one new ${t.name} question, solve it, and show the checking step.</li><li>Describe one mistake a student might make and how to fix it.</li></ul></div></section>`);
  } else {
    const LEVELS = [['Easy', 'easy'], ['Medium', 'medium'], ['Hard', 'hard']];
    const tabs = LEVELS.map(([lbl, key], i) => `<button class="tab ${i === 0 ? 'on' : ''}" data-lv="${lbl}">${lbl}<span class="n">${(t[key] || []).length}</span></button>`).join('');
    const panes = LEVELS.map(([lbl, key], i) => {
      const cards = (t[key] || []).map((e, idx) => {
        const kkey = `${t.id}|${key}|${idx}`;
        // Almost every item's accept[] is derived straight from its displayed `ans` text (see
        // stripTags above). A handful of compound answers (e.g. "find the rule AND the 10th
        // term") need an accept phrasing a learner would actually type, distinct from the
        // English-sentence `ans` shown in the worked solution — those items carry an explicit
        // `accept` array (see the Round-4 patches in applyContentFixes) which overrides here.
        const accept = (e.accept || [e.ans]).map(stripTags);
        staticCheck[kkey] = accept;
        // Format hint: derived from the accept value itself (never the real magnitude — see
        // format-hint.mjs), shown next to the input so a learner isn't left guessing whether
        // "3n+2" or "the rule is 3n + 2" is the expected shape.
        const hint = formatHint(accept[0]);
        // Graded drag-and-drop: wherever the accept value has a recognised, format-ambiguous shape
        // (deriveTileSpec mirrors format-hint's own classifier, so "gets a hint" and "gets tiles"
        // stay consistent by construction), build the answer from tiles instead of free text. A
        // bare plain number or an unhintable word gets no spec back — those stay free-text-only,
        // since tiles would add friction with no real ambiguity to resolve. The tile widget writes
        // into the SAME <input>, so it's a drop-in alternative UI, not a different marking path — a
        // "prefer to type?" toggle swaps to the plain input for anyone who'd rather not use tiles.
        const tileSpec = deriveTileSpec(accept[0]);
        const useTiles = !!tileSpec;
        let tileWidget = '', tileToggle = '';
        if (useTiles) {
          tileWidget = `<div class="tile-builder" data-spec='${JSON.stringify(tileSpec)}'></div>`;
          tileToggle = `<button class="tb-toggle" type="button">&#8987; Prefer to type your answer?</button>`;
        }
        return `<div class="ex" data-key="${kkey}" data-tid="${t.id}">
          <div class="ex-top"><span class="num">${idx + 1}</span><div class="q">${e.q}</div></div>
          ${e.fig ? `<div class="figwrap">${e.fig}</div>` : ''}
          <div class="attempt">
            ${tileWidget}
            <input class="ans-input" type="text" placeholder="Write your answer here&hellip;" aria-label="Your answer"${useTiles ? ' hidden' : ''}>
            <button class="markbtn">&#10003; Mark answer</button>
            <button class="reveal locked">&#128274; Show solution</button>
          </div>
          ${tileToggle}
          ${hint ? `<p class="fhint">Format: e.g. <span class="fhint-ex">${hint}</span></p>` : ''}
          <div class="sol">
            <div class="your-answer"><span class="lbl">Your answer</span><span class="txt"></span></div>
            <div class="lead">Approach</div>
            <p class="approach">${t.approach}</p>
            <div class="lead">Working, step by step</div>
            <ol class="steps">${e.steps.map(st => `<li>${st}</li>`).join('')}</ol>
            <div class="answer"><span class="tag">Answer</span><span class="val">${e.ans}</span></div>
            <div class="checktip"><b>Check it:</b> ${t.check}</div>
          </div>
        </div>`;
      }).join('');
      return `<div class="pane ${i === 0 ? 'on' : ''}" data-lv="${lbl}">${cards}</div>`;
    }).join('');
    const workedSamples = [['Easy', 'Core skill', (t.easy || [])[0]], ['Medium', 'Mixed method', (t.medium || [])[0]], ['Hard', 'Challenge scenario', (t.hard || [])[0]]].filter(x => x[2]);
    if (workedSamples.length) {
      S.push(`<section class="hf-sec worked" data-section="examples"><div class="hf-tag">&#9998; Worked examples across scenarios</div>
        <p class="hf-sub">Read these like a teacher modelling the method: one basic case, one mixed case, and one harder transfer case.</p>
        <div class="example-grid">${workedSamples.map(([lv, label, e]) => `<article class="we-card ${lv.toLowerCase()}">
          <div class="we-card-head"><span class="level">${lv}</span><span>${label}</span></div>
          <div class="we-q">${e.q}</div>${e.fig ? `<div class="figwrap">${e.fig}</div>` : ''}
          <ol class="steps">${e.steps.map(s => `<li>${s}</li>`).join('')}</ol>
          <div class="answer"><span class="tag">Answer</span><span class="val">${e.ans}</span></div>
        </article>`).join('')}</div></section>`);
    }
    S.push(`<section class="hf-sec practice" data-section="practice"><div class="hf-tag">&#9997;&#65039; Guided and independent practice</div><p class="hf-sub">Work up through Easy &rarr; Medium &rarr; Hard. Type an answer and press Mark; the full solution unlocks after each attempt.</p><div class="tabs">${tabs}</div>${panes}</section>`);
    const assignmentItems = (items, start, count) => (items || []).slice(start, start + count).map(e => `<li>${e.q}</li>`).join('');
    const part = (title, items, type = 'ol') => items ? `<div class="assignment-part"><h4>${title}</h4><${type}>${items}</${type}></div>` : '';
    S.push(`<section class="hf-sec assignment" data-section="assignment"><div class="hf-tag">&#128221; Assignment work</div>
      <p class="hf-sub">Do these on paper after the guided practice. They mix fluency, reasoning, application, challenge and reflection question types.</p>
      <div class="assignment-grid">${[
        part('Part A - Fluency', assignmentItems(t.easy, 1, 4)),
        part('Part B - Method and reasoning', assignmentItems(t.medium, 1, 3)),
        part('Part C - Application and challenge', assignmentItems(t.hard, 1, 3)),
        part('Part D - Explain and create', `<li>Write a short paragraph explaining the main idea of ${t.name} in your own words.</li><li>Create one new ${t.name} question, solve it, and show the checking step.</li><li>Describe one mistake a student might make and how to fix it.</li>`, 'ul')
      ].join('')}</div></section>`);
  }

  if (c.mistake) S.push(`<section class="hf-sec mistake" data-section="misconception"><div class="hf-tag">&#128373;&#65039; Mistake detective</div><p class="hf-sub">Diagnose the misconception, then reveal the cause and intervention.</p><div class="mis-q">${c.mistake.wrong}</div><button class="hf-reveal">Reveal diagnosis</button><div class="hf-hidden"><div class="mis-grid"><div class="mis-item"><span>Cause</span><p>${c.mistake.error}</p></div><div class="mis-item"><span>Diagnostic question</span><p>What rule or representation would show why this answer cannot be right?</p></div><div class="mis-item"><span>Intervention</span><p>${c.mistake.fix}</p></div></div></div></section>`);
  if (c.realworld) S.push(`<section class="hf-sec realworld" data-section="realworld"><div class="hf-tag">&#127757; In the real world</div><p>${c.realworld}</p></section>`);
  if (c.reflect) S.push(`<section class="hf-sec reflect" data-section="reflect"><div class="hf-tag">&#129504; Reflect</div><ul class="hf-check">${c.reflect.map(r => `<li><label><input type="checkbox"> <span>${r}</span></label></li>`).join('')}</ul></section>`);
  if (c.retrieval) S.push(`<section class="hf-sec retrieval" data-section="retrieval"><div class="hf-tag">&#9889; Quick recall</div><p class="hf-sub">Answer in your head, then reveal.</p><ol class="hf-retr">${c.retrieval.map(qa => `<li><span class="rq">${qa[0]}</span> <button class="hf-reveal mini">Show</button><span class="hf-hidden ra">${qa[1]}</span></li>`).join('')}</ol></section>`);
  // NRICH-style low-threshold-high-ceiling investigation: everyone can start, no one can finish.
  const gf = GO_FURTHER[t.id];
  if (gf) S.push(`<section class="hf-sec further" data-section="further"><div class="hf-tag">&#128640; Go further &mdash; open investigation</div><p class="hf-sub">No single right answer here: everyone can start, and nobody can completely finish. Get stuck &mdash; that is the point.</p><p>${gf.prompt}</p><div class="gf-ext"><span class="gf-tag">Raise the ceiling</span>${gf.extension}</div></section>`);
  if (c.summary) S.push(`<section class="hf-sec summary" data-section="summary"><div class="hf-tag">&#127793; In a nutshell</div><ul class="hf-sum">${c.summary.map(s => `<li>${s}</li>`).join('')}</ul></section>`);
  S.push(`<div class="hf-next">${prev ? `<a class="hf-navlink prev" href="${prev.id}.html"><span class="dir">&larr; Previous</span><span class="nm">${prev.name}</span></a>` : '<span></span>'}${next ? `<a class="hf-navlink next" href="${next.id}.html"><span class="dir">Next &rarr;</span><span class="nm">${next.name}</span></a>` : '<span></span>'}</div>`);

  const practiceCount = (t.easy || []).length + (t.medium || []).length + (t.hard || []).length;
  const chapterStats = `<div class="chapter-meta">
    <div class="chapter-stat"><b>Chapter flow</b>Discover, explain, practise, reflect</div>
    <div class="chapter-stat"><b>3 worked scenarios</b>Easy, medium and hard methods</div>
    <div class="chapter-stat"><b>${practiceCount || 30} interactive questions</b>Guided to independent practice</div>
    <div class="chapter-stat"><b>Assignment set</b>Fluency, reasoning, application</div>
  </div>`;

  const html = `<section class="topic" id="${t.id}" style="--tcol:${group.color}">
  <div class="topic-head">
    <span class="topic-strand">${group.strand}</span>
    <div class="topic-titles"><h3>${t.name}</h3><span class="year">${t.year}</span></div>
    <span class="topic-prog" data-tid="${t.id}">0 / 30</span>
    <button class="bookmark-btn" type="button">&#9734; Bookmark this chapter</button>
  </div>
  ${chapterStats}
  ${S.join('\n  ')}
</section>`;
  return { html, checkMap: staticCheck };
}

// --- 5. Cover / Contents / About pages ---

function renderCoverPage() {
  return `<div class="cover">
  <div class="glyph-big">&#8721;</div>
  <p class="tag">Years 6&ndash;8 &middot; NZ Curriculum</p>
  <h1>Understand the <mark>why</mark>, then master the <mark>how</mark>.</h1>
  <p>A digital mathematics book covering the New Zealand Years 6&ndash;8 curriculum: 24 chapters across
  Number, Algebra, Geometry, Measurement, and Statistics &amp; Probability &mdash; each with a full
  explanation, worked examples, guided practice, and quick revision.</p>
  <div class="cover-actions">
    <a class="btn primary" href="contents.html">Start Reading</a>
    <a class="btn" href="practice.html">Practice Book</a>
    <a class="btn" href="progress.html">My Progress</a>
  </div>
  <div class="cover-links">
    <a href="contents.html">Table of Contents</a>
    <a href="about.html">About this book</a>
  </div>
</div>`;
}

function renderContentsPage(strands) {
  const groups = strands.map((g) => `<div class="toc-strand" style="--strand:${g.color}">
    <h3>${g.strand}</h3>
    <div class="toc-grid">${g.topics.map((t, i) => `<a class="toc-card" href="topics/${t.id}.html" data-tid="${t.id}" data-search="${(t.name + ' ' + t.idea).toLowerCase()}">
        <span class="toc-num">${i + 1}</span>
        <span><span class="toc-name">${t.name}</span><br><span class="toc-year">${t.year}</span></span>
      </a>`).join('')}</div>
  </div>`).join('\n');
  return `<h1 style="font-family:'Bricolage Grotesque';font-size:28px;margin:0 0 4px">Table of Contents</h1>
<p class="hero p" style="margin-bottom:14px">24 chapters, grouped by strand. A solid number means every question in that chapter has been answered.</p>
<div class="toc-search">
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
  <input id="toc-search-input" type="text" placeholder="Search a topic&hellip;" aria-label="Search topics">
</div>
${groups}
<p class="muted" id="toc-empty" style="display:none;color:var(--ink-soft)">No topics match that search.</p>
<script>
(function(){
  if(window.ProgressStore){
    document.querySelectorAll('.toc-card').forEach(function(a){
      var n = window.ProgressStore.topicAnsweredCount(a.dataset.tid);
      a.classList.toggle('done', n >= window.ProgressStore.QUESTIONS_PER_TOPIC);
    });
  }
  var input = document.getElementById('toc-search-input');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.toc-card'));
  var strandsEl = Array.prototype.slice.call(document.querySelectorAll('.toc-strand'));
  input.addEventListener('input', function(){
    var q = input.value.trim().toLowerCase();
    var anyVisible = false;
    cards.forEach(function(c){
      var show = !q || c.dataset.search.indexOf(q) !== -1;
      c.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    strandsEl.forEach(function(g){
      var any = Array.prototype.some.call(g.querySelectorAll('.toc-card'), function(c){ return c.style.display !== 'none'; });
      g.style.display = any ? '' : 'none';
    });
    document.getElementById('toc-empty').style.display = anyVisible ? 'none' : 'block';
  });
})();
</script>`;
}

function renderAboutPage() {
  return `<h1 style="font-family:'Bricolage Grotesque';font-size:28px;margin:0 0 14px">About The Maths Notebook</h1>
<div class="lesson" style="max-width:70ch">
  <p>The Maths Notebook is an interactive mathematics book covering the New Zealand Years 6&ndash;8
  mathematics curriculum. It is designed to help students understand mathematical concepts through
  simple explanations, worked examples, visual models, and interactive practice &mdash; concept-first,
  not just answers.</p>
  <p><b>Topics covered:</b> Whole Numbers, Fractions, Decimals, Percentages, Ratios and Proportions,
  Integers, Algebra, Equations, Geometry, Measurement, Statistics and Probability &mdash; 24 chapters
  in total, each with a full worked-example bank of 30 practice questions.</p>
  <p><b>How each chapter works:</b> a hook to spark curiosity, learning goals, a predict-first discovery
  prompt, the full explanation, key vocabulary, a visual model, worked examples across Easy/Medium/Hard,
  guided and independent practice with instant marking, an assignment set, a common-mistake diagnosis,
  a real-world connection, a reflection checklist, and quick-recall retrieval questions.</p>
  <p><b>Technology:</b> plain HTML5, CSS3 and modern JavaScript &mdash; no frameworks, no backend, no
  build step. Progress is saved only in your browser's local storage on this device.</p>
  <p><i>&ldquo;Understanding mathematics should feel rewarding, not intimidating.&rdquo;</i></p>
</div>`;
}

// --- 6. Build ---

function run() {
  const { CURRICULUM, CH, ORDER } = loadData();
  applyContentFixes(CURRICULUM, CH);
  const ORDER_IDX = {}; ORDER.forEach((o, i) => (ORDER_IDX[o.id] = i));

  fs.mkdirSync(TOPICS_DIR, { recursive: true });

  const tocStrands = [];
  let count = 0;

  for (const group of CURRICULUM) {
    const tocGroup = { strand: group.strand, color: group.color, topics: [] };
    for (const t of group.topics) {
      t.__ch = CH[t.id] || {};
      const idx = ORDER_IDX[t.id];
      const prev = idx > 0 ? ORDER[idx - 1] : null;
      const next = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
      const { html: body, checkMap } = renderChapterBody(t, group, prev, next);
      // js/tile-builder.js loads on every page (harmless — its bootstrap just finds nothing to
      // mount if a page has no `.tile-builder[data-spec]` elements) and AFTER topic-interactions.js
      // so its DOMContentLoaded bootstrap runs after restoreAnswers() has already set .ans-input's
      // value for any previously-answered question (see tile-builder.js's own comment on this).
      const scripts = DYNAMIC_IDS.has(t.id)
        ? ['js/quiz-engine.js', 'js/topic-interactions.js', 'js/explore.js', 'js/tile-builder.js']
        : ['js/topic-interactions.js', 'js/explore.js', 'js/tile-builder.js'];
      const html = pageShell({ title: t.name, active: t.id, root: '../', bodyHtml: body, extraScripts: scripts });
      // Static topics' answers get an accept[] derived from their authored `ans` text (see
      // stripTags/staticCheck above), merged into the same window.TOPIC_CHECK the dynamic topics'
      // quiz-engine.js populates, so mark-answer highlights correct/wrong everywhere, not just on
      // the 6 generator topics.
      let finalHtml = html.replace('</body>', `<script>window.TOPIC_CHECK=Object.assign(window.TOPIC_CHECK||{}, ${JSON.stringify(checkMap)});</script>\n</body>`);
      if (DYNAMIC_IDS.has(t.id)) {
        finalHtml = finalHtml.replace('</body>', `<script>window.QuizEngine && window.QuizEngine.renderDynamicTopic(${JSON.stringify(t.id)}, ${JSON.stringify(t.approach)}, ${JSON.stringify(t.check)});</script>\n</body>`);
      }
      fs.writeFileSync(path.join(TOPICS_DIR, `${t.id}.html`), finalHtml, 'utf-8');
      tocGroup.topics.push({ id: t.id, name: t.name, year: t.year, idea: t.idea.replace(/<[^>]+>/g, '') });
      count++;
    }
    tocStrands.push(tocGroup);
  }

  const tocJs = `/* js/toc-data.js — generated by tools/generate-book.mjs. Do not edit by hand. */\nwindow.TOC_STRANDS = ${JSON.stringify(tocStrands, null, 2)};\n`;
  fs.writeFileSync(path.join(ROOT, 'js', 'toc-data.js'), tocJs, 'utf-8');

  fs.writeFileSync(path.join(ROOT, 'index.html'),
    pageShell({ title: 'Cover', root: '', bodyHtml: renderCoverPage() }), 'utf-8');
  fs.writeFileSync(path.join(ROOT, 'contents.html'),
    pageShell({ title: 'Contents', root: '', bodyHtml: renderContentsPage(tocStrands) }), 'utf-8');
  fs.writeFileSync(path.join(ROOT, 'about.html'),
    pageShell({ title: 'About', root: '', bodyHtml: renderAboutPage() }), 'utf-8');

  console.log(`Generated ${count} chapter pages into ${TOPICS_DIR}`);
  console.log(`Wrote js/toc-data.js (${tocStrands.length} strands)`);
  console.log('Wrote index.html, contents.html, about.html');
}

run();
