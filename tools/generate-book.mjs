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
const INTRO_FIG = {
  graphs: quadrantChart, angles: () => straightAngle(125), shapes: polyRow,
  transformations: () => coordPlane(6, [{ x: -3, y: 1, label: 'A' }, { x: 1, y: 1, label: "A'", hollow: true }], { arrows: [{ x1: -3, y1: 1, x2: 1, y2: 1 }] }),
  pythagoras: () => rightTri('a', 'b', 'c'), circles: () => circleFig('r', 'r')
};
const INTRO_CAP = {
  graphs: 'The axes split the plane into four quadrants. A point&rsquo;s signs (x, y) decide which one it lands in.',
  angles: 'Angles on a straight line always add to 180&deg;; angles around a point add to 360&deg;.',
  shapes: 'Polygons are named by their number of sides. Interior angles sum to (n &minus; 2) &times; 180&deg;.',
  transformations: 'A translation slides every point by the same amount &mdash; here (x, y) each shift right by 4.',
  pythagoras: 'In a right-angled triangle, a&sup2; + b&sup2; = c&sup2;, where c is the hypotenuse (opposite the right angle).',
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
function stripTags(html) { return String(html).replace(/<[^>]+>/g, '').trim(); }

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

function renderChapterBody(t, group, prev, next) {
  const c = t.__ch || {};
  const dynamic = DYNAMIC_IDS.has(t.id);
  const staticCheck = {};
  const lessonHtml = t.lesson || `<p>${t.idea}</p>`;

  const road = [];
  const addRoad = (key, label, show) => { if (show) road.push(`<button class="hf-jump" type="button" data-target="${key}"><span class="dot"></span><span>${label}</span></button>`); };
  const intro = INTRO_FIG[t.id] ? `<figure class="figwrap intro">${INTRO_FIG[t.id]()}<figcaption class="figcap">${INTRO_CAP[t.id] || ''}</figcaption></figure>` : '';
  addRoad('goals', 'Goals', c.goals);
  addRoad('discovery', 'Discover', c.discovery);
  addRoad('explain', 'Explanation', true);
  addRoad('vocab', 'Vocabulary', c.vocab);
  addRoad('visual', 'Visual model', intro || t.model);
  addRoad('examples', 'Examples', true);
  addRoad('practice', 'Practice', true);
  addRoad('assignment', 'Assignment', true);
  addRoad('retrieval', 'Retrieval', c.retrieval);
  const roadmap = road.length ? `<div class="hf-roadmap" aria-label="Chapter sections">${road.join('')}</div>` : '';
  const visualParts = [intro, t.model ? `<div class="model">${t.model}</div>` : ''].filter(Boolean).join('');

  const S = [];
  if (c.hook) S.push(`<div class="hf-hook"><span class="hf-spark">&#10022;</span><span>${c.hook}</span></div>`);
  if (roadmap) S.push(roadmap);
  if (c.goals) S.push(`<section class="hf-sec goals" data-section="goals"><div class="hf-tag">&#127919; By the end you can</div><ul class="hf-goals">${c.goals.map(g => `<li>${g}</li>`).join('')}</ul></section>`);
  if (c.prereq) S.push(`<section class="hf-sec prereq" data-section="prereq"><div class="hf-tag">&#9989; Before you start</div><ul class="hf-list">${c.prereq.map(p => `<li>${p}</li>`).join('')}</ul></section>`);
  if (c.discovery) S.push(`<section class="hf-sec discovery" data-section="discovery"><div class="hf-tag">&#128302; Discover &mdash; predict first</div><p>${c.discovery.prompt}</p><button class="hf-reveal">Reveal</button><div class="hf-hidden"><p>${c.discovery.answer}</p></div></section>`);
  S.push(`<section class="hf-sec explain" data-section="explain"><div class="hf-tag">&#128214; Read the chapter</div><p class="hf-sub">${t.idea}</p><div class="lesson">${lessonHtml}</div>${t.why ? `<div class="why">${t.why}</div>` : ''}${t.watchout ? `<div class="watchout"><span class="wtag">&#9888; Watch out</span>${t.watchout}</div>` : ''}</section>`);
  if (c.vocab) S.push(`<section class="hf-sec vocab" data-section="vocab"><div class="hf-tag">&#128218; Key words</div><dl class="hf-vocab">${c.vocab.map(v => `<div class="vrow"><dt>${v[0]}</dt><dd>${v[1]}</dd></div>`).join('')}</dl></section>`);
  if (visualParts) S.push(`<section class="hf-sec visual" data-section="visual"><div class="hf-tag">&#128202; Visual model</div><p class="hf-sub">Use the diagram before calculating. The visual should make the structure easier to see.</p>${visualParts}</section>`);

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
        staticCheck[kkey] = [stripTags(e.ans)];
        return `<div class="ex" data-key="${kkey}" data-tid="${t.id}">
          <div class="ex-top"><span class="num">${idx + 1}</span><div class="q">${e.q}</div></div>
          ${e.fig ? `<div class="figwrap">${e.fig}</div>` : ''}
          <div class="attempt">
            <input class="ans-input" type="text" placeholder="Write your answer here&hellip;" aria-label="Your answer">
            <button class="markbtn">&#10003; Mark answer</button>
            <button class="reveal locked">&#128274; Show solution</button>
          </div>
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
      const scripts = DYNAMIC_IDS.has(t.id)
        ? ['js/quiz-engine.js', 'js/topic-interactions.js']
        : ['js/topic-interactions.js'];
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
