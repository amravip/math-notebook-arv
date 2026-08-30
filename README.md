# 📚 The Maths Notebook

An interactive mathematics notebook covering the New Zealand Years 6–8 mathematics curriculum.

The notebook is designed to help students understand mathematical concepts through simple explanations, worked examples, visual learning, and interactive practice.

The book is a genuine multi-page static site: a cover page, table of contents, 24 chapter pages (one
per topic), a Practice Book, a Progress page and an About page — plain HTML/CSS/JavaScript, no
frameworks, no backend, no build step. Runs entirely in the browser; progress saves to this device only.

## Running locally

```bash
node tools/dev-server.mjs        # http://127.0.0.1:8000/
```

No npm install needed — the dev server is a small dependency-free Node script.

## Project structure

```
index.html, contents.html, practice.html, progress.html, about.html   (top-level pages)
topics/<id>.html          24 chapter pages, one per curriculum topic
css/styles.css            shared styles
js/
  toc-data.js              generated topic index (do not hand-edit)
  toc-art.js               generated cover art + accent per topic (do not hand-edit)
  progress-store.js        localStorage progress (XP, streak, badges, bookmarks, answers)
  nav.js                   shared sidebar (search, active-page highlight)
  topic-interactions.js    mark-answer / reveal / tabs / collapse / chapter navigator
  explore.js               the "Explore" widget and its challenges, one per chapter
  quiz-engine.js           seeded question generators + SVG figures, for the 6 "dynamic" chapters
  tile-builder.js          drag-and-drop answer tiles
  practice-book.js         Practice Book question generators (tables/squares/mental)
_source/                  archived copy of the original single-page prototype
tools/
  generate-book.mjs        regenerates all 24 chapter pages + cover/contents/about from _source/
  validate-book.mjs        structural check over the generated output
  dev-server.mjs           local static server
  svg-kit.mjs              drawing primitives + palette shared by the lesson modules
  topic-art.mjs            cover art and accent colour for each chapter
  lesson-content.mjs       combines the four strand modules into one lesson map
  number-lessons.mjs       \
  algebra-lessons.mjs       |  "Read the chapter" content and its inline
  geometry-lessons.mjs      |  explainer figures, one module per strand
  measure-stats-lessons.mjs/
  enrichment-content.mjs   Notice & Wonder, Go Further, mental-maths tips, CPA panels
  format-hint.mjs          the answer-format hint shown on every practice item
  tile-spec.mjs            derives the tile-builder layout for a question
tests/                    node:test suites over the real runtime files
```

Six chapters (Coordinates & Graphs, Angles, Shapes, Transformations, Pythagoras, Circles) generate
fresh randomised practice questions client-side each time their stored seed changes (i.e. after
Reset); the other 18 use a fixed, pre-written question bank baked directly into their page.

To regenerate the 24 chapter pages (e.g. after editing `_source/original-single-page.html`):

```bash
node tools/generate-book.mjs
node tools/validate-book.mjs
```

`validate-book.mjs` is the guard on generated output: it checks the document outline (one `<h1>`
per page, no skipped levels), that no chapter emits an HTML entity the browser would print
verbatim, that every topic has cover art, and that every lesson figure is well-formed and drawn
inside its own viewBox — a figure whose coordinates fall outside it is silently clipped on the page.

Tests run on Node's built-in runner, against the real files that ship to the browser:

```bash
npm test
```

## Features

- 📖 Covers the New Zealand Years 6–8 mathematics curriculum
- 🖼️ Every chapter illustrated — inline explainer diagrams drawn to show the mechanism, not decorate the page
- 🎯 An Explore widget per chapter, each setting challenges to solve with it
- ✅ Interactive practice with instant checking and step-by-step worked solutions
- 📚 Concept-first learning approach
- 📊 Progress tracking — XP, streaks, badges and bookmarks, saved on the device
- ♿ One heading outline per page, a skip link, and reduced-motion support
- 📱 Responsive design for desktop and mobile
- ⚡ Fast, lightweight and browser-based

## Topics Covered

- Whole Numbers
- Fractions
- Decimals
- Percentages
- Ratios and Proportions
- Integers
- Algebra
- Equations
- Geometry
- Measurement
- Statistics
- Probability

## Current Status

This project is an evolving interactive mathematics notebook.

The current focus is on creating high-quality learning material that is simple, engaging, and easy for students to use.

Future versions may introduce additional interactive features and improvements while keeping the notebook lightweight and easy to access.

---

*"Understanding mathematics should feel rewarding, not intimidating."*