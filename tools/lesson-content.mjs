// tools/lesson-content.mjs
//
// The "Read the chapter" content for all 24 topics, assembled from one module per strand. This file
// holds no prose of its own — it exists so that generate-book.mjs (and anything else that wants the
// book's lesson text) has a single map to import, exactly as it did when all the content lived here.
//
// Applied in generate-book.mjs's applyContentFixes(): `t.lesson = LESSON_EXPANSIONS[t.id] || t.lesson`.
//
// The content was split by strand once it stopped being a list of paragraphs and became illustrated
// lessons: each module carries its own figure builders, and one 4000-line file of SVG geometry plus
// prose was no longer reviewable. Every module follows the same shape — a plain-language opening,
// sub-headed groups (.les-h), inline explainer diagrams (.les-fig), one-idea-per-bullet .def-list
// items with worked examples, a numbered method (.les-steps), a .kbox summary and .rw-examples
// real-world cards. Shared drawing primitives live in svg-kit.mjs.
//
// Adding a topic means adding it to the module for its strand, not here.

import { GEOMETRY_LESSONS } from './geometry-lessons.mjs';
import { NUMBER_LESSONS } from './number-lessons.mjs';
import { ALGEBRA_LESSONS } from './algebra-lessons.mjs';
import { MEASURE_STATS_LESSONS } from './measure-stats-lessons.mjs';

export const LESSON_EXPANSIONS = {
  ...NUMBER_LESSONS,
  ...ALGEBRA_LESSONS,
  ...GEOMETRY_LESSONS,
  ...MEASURE_STATS_LESSONS,
};
