// tools/validate-book.mjs
// Dependency-free structural check over the generated site: confirms all 24 topic pages exist, every
// prev/next link resolves, dynamic-topic placeholders are present, and no unresolved template
// artifacts (undefined/[object Object]/NaN) leaked into the output. Run: node tools/validate-book.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOPICS_DIR = path.join(ROOT, 'topics');
const DYNAMIC_IDS = new Set(['graphs', 'angles', 'shapes', 'transformations', 'pythagoras', 'circles']);

const errors = [];
const fail = (f, m) => errors.push(`[${f}] ${m}`);

// Named entities this book is allowed to emit. An entity that is not a real HTML5 character
// reference does not error — the browser just prints it verbatim, so "&frac36;" shipped as literal
// text in the middle of a worked example. Note HTML5 defines only a fixed set of vulgar fractions
// (no thirds-of-sixths etc.), so any other fraction must be written as .frac markup instead.
const ALLOWED_ENTITIES = new Set([
  'Sigma', 'amp', 'asymp', 'deg', 'divide', 'frasl', 'ge', 'gt', 'hellip', 'larr', 'ldquo', 'le',
  'lt', 'mdash', 'middot', 'minus', 'nbsp', 'ndash', 'pi', 'prime', 'radic', 'rarr', 'rdquo',
  'quot', 'rsquo', 'sum', 'sup1', 'sup2', 'sup3', 'times',
  // the complete HTML5 vulgar-fraction set
  'frac12', 'frac13', 'frac14', 'frac15', 'frac16', 'frac18', 'frac23', 'frac25', 'frac34',
  'frac35', 'frac38', 'frac45', 'frac56', 'frac58', 'frac78',
]);

function checkEntities(file, html) {
  const bad = new Set();
  for (const m of html.matchAll(/&([a-zA-Z][a-zA-Z0-9]*);/g)) {
    if (!ALLOWED_ENTITIES.has(m[1])) bad.add(m[1]);
  }
  if (bad.size) fail(file, `unknown HTML entity, will render as literal text: ${[...bad].map((b) => `&${b};`).join(', ')}`);
}

// Every page is one document outline: a single <h1> naming it, then levels that step down one at
// a time. Screen-reader users navigate a long chapter by heading, and a skipped level (or a second
// <h1>) reads as a missing section. The generator emits headings from a dozen places, so this is
// checked rather than trusted.
function checkHeadings(file, html) {
  const levels = [...html.matchAll(/<h([1-6])[ >]/g)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) fail(file, `page has ${h1s} <h1> headings, expected exactly 1`);
  let prev = 0;
  for (const l of levels) {
    if (prev && l > prev + 1) { fail(file, `heading level jumps from h${prev} to h${l}`); break; }
    prev = l;
  }
}

function run() {
  const tocPath = path.join(ROOT, 'js', 'toc-data.js');
  if (!fs.existsSync(tocPath)) { fail('js/toc-data.js', 'missing — run tools/generate-book.mjs first'); report(); return; }
  const tocSrc = fs.readFileSync(tocPath, 'utf-8');
  const match = tocSrc.match(/window\.TOC_STRANDS\s*=\s*(\[[\s\S]*\]);/);
  if (!match) { fail('js/toc-data.js', 'could not parse TOC_STRANDS'); report(); return; }
  const strands = JSON.parse(match[1]);
  const allTopics = strands.flatMap((s) => s.topics);
  console.log(`Found ${allTopics.length} topics across ${strands.length} strands.`);

  allTopics.forEach((t, i) => {
    const file = path.join(TOPICS_DIR, `${t.id}.html`);
    if (!fs.existsSync(file)) { fail(`${t.id}.html`, 'file missing'); return; }
    const html = fs.readFileSync(file, 'utf-8');

    // Look for leaked JS values in interpolation-shaped contexts, not the English word "undefined"
    // in genuine prose (e.g. "a vertical line has an undefined gradient").
    if (/>\s*undefined\s*<|"undefined"|\[object Object\]|>\s*NaN\s*<|:\s*NaN\b/.test(html)) {
      fail(`${t.id}.html`, 'contains a template artifact (undefined/[object Object]/NaN)');
    }
    checkEntities(`${t.id}.html`, html);
    checkHeadings(`${t.id}.html`, html);
    if (!html.includes(`id="${t.id}"`)) fail(`${t.id}.html`, 'missing topic section id');
    if (!html.includes('js/topic-interactions.js')) fail(`${t.id}.html`, 'missing topic-interactions.js include');

    if (DYNAMIC_IDS.has(t.id)) {
      for (const ph of ['dyn-worked', 'dyn-tabs', 'dyn-panes', 'dyn-assignment']) {
        if (!html.includes(`id="${ph}"`)) fail(`${t.id}.html`, `missing dynamic placeholder #${ph}`);
      }
      if (!html.includes('js/quiz-engine.js')) fail(`${t.id}.html`, 'dynamic topic missing quiz-engine.js include');
      if (!html.includes('renderDynamicTopic')) fail(`${t.id}.html`, 'missing renderDynamicTopic() call');
    } else {
      const exCount = (html.match(/class="ex" data-key=/g) || []).length;
      if (exCount !== 30) fail(`${t.id}.html`, `expected 30 static exercises, found ${exCount}`);
    }

    if (i > 0) {
      const prev = allTopics[i - 1];
      if (!html.includes(`href="${prev.id}.html"`)) fail(`${t.id}.html`, `missing Previous link to ${prev.id}.html`);
    }
    if (i < allTopics.length - 1) {
      const next = allTopics[i + 1];
      if (!html.includes(`href="${next.id}.html"`)) fail(`${t.id}.html`, `missing Next link to ${next.id}.html`);
    }
  });

  // Cross-check every generated file is listed in the TOC (no orphans) and vice versa.
  const tocIds = new Set(allTopics.map((t) => t.id));
  fs.readdirSync(TOPICS_DIR).filter((f) => f.endsWith('.html')).forEach((f) => {
    const id = f.replace(/\.html$/, '');
    if (!tocIds.has(id)) fail(f, 'generated file not listed in toc-data.js');
  });

  // progress.html builds its bookmark cards at runtime from js/toc-art.js. A topic missing there
  // still renders — as a colourless card with an empty banner — so nothing else would catch it.
  const artPath = path.join(ROOT, 'js', 'toc-art.js');
  if (!fs.existsSync(artPath)) fail('js/toc-art.js', 'missing — run tools/generate-book.mjs first');
  else {
    const artSrc = fs.readFileSync(artPath, 'utf-8');
    // The file is one `window.TOPIC_ART = { ... };` assignment, so the object is everything from
    // the first brace to the last — sliced rather than matched, because the SVG payloads inside
    // are full of characters a regex would have to tiptoe around.
    const open = artSrc.indexOf('{'), close = artSrc.lastIndexOf('}');
    if (!artSrc.includes('window.TOPIC_ART') || open === -1 || close < open) {
      fail('js/toc-art.js', 'could not parse TOPIC_ART');
    } else {
      const art = JSON.parse(artSrc.slice(open, close + 1));
      tocIds.forEach((id) => {
        const e = art[id];
        if (!e) fail('js/toc-art.js', `no cover art for topic "${id}"`);
        else if (!e.vars || !e.blurb || !e.svg) fail('js/toc-art.js', `incomplete entry for topic "${id}"`);
      });
      Object.keys(art).forEach((id) => {
        if (!tocIds.has(id)) fail('js/toc-art.js', `art for "${id}", which is not a topic`);
      });
    }
  }

  // The shell pages are generated too, so hold them to the same entity rule. practice.html and
  // progress.html are hand-maintained rather than generated, but they share the layout and the
  // stylesheet, so they are held to the same outline rule.
  ['index.html', 'contents.html', 'about.html', 'practice.html', 'progress.html'].forEach((f) => {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) return;
    const html = fs.readFileSync(p, 'utf-8');
    checkEntities(f, html);
    checkHeadings(f, html);
  });

  report();
}

function report() {
  if (errors.length) {
    console.log(`\n${errors.length} ERROR(s):`);
    errors.forEach((e) => console.log('  x ' + e));
    process.exit(1);
  }
  console.log('\nAll generated pages valid. ✓');
}

run();
