// tools/format-hint.mjs
//
// Derives a short "Format: e.g. ..." hint from an authored accept[] value, so a learner sees the
// SHAPE of an expected answer without ever seeing the real one. Every placeholder below is a
// fixed constant, never derived from the real answer's magnitude — the only real information ever
// reflected back is a structural fact (which variable letter is used, whether a $ sign or a colon
// belongs), never a number that could coincide with the actual answer.
//
// This file is the Node/build-time copy, used by generate-book.mjs for the 18 static topics (whose
// accept[] is known at build time). js/quiz-engine.js carries a second, ES5 copy of the same two
// functions for the 6 dynamic topics (whose accept[] is only known at runtime, after the seeded
// generator has run) — see tests/format-hint.test.mjs, which checks the two copies agree on a
// shared fixture list so they can't silently drift apart.

// Parses a SIMPLE linear expression "±A·letter ±B" (degree ≤ 1, one variable) into
// {coeff, cons, letter}, or null if the string isn't shaped like one. Kept in lock-step with the
// identically-named function in js/topic-interactions.js (same algorithm, verified by the shared
// fixture test) — deliberately not a full CAS, see that file's comment for the exact scope.
export function parseLinearExpr(raw) {
  let s = String(raw).toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '');
  if (!s || /[²³]/.test(s)) return null;
  if (s[0] !== '+' && s[0] !== '-') s = '+' + s;
  const terms = s.match(/[+-][^+-]+/g);
  if (!terms) return null;
  let coeff = 0, cons = 0, letter = null;
  for (const t of terms) {
    const sign = t[0] === '-' ? -1 : 1, body = t.slice(1);
    const mv = body.match(/^(\d*\.?\d*)([a-z])$/);
    if (mv) {
      if (letter && letter !== mv[2]) return null;
      letter = mv[2];
      coeff += sign * (mv[1] === '' ? 1 : parseFloat(mv[1]));
      continue;
    }
    const mn = body.match(/^\d*\.?\d+$/);
    if (mn) { cons += sign * parseFloat(body); continue; }
    return null;
  }
  return { coeff, cons, letter, termCount: terms.length };
}

// A small rotation of visually-distinct fixed constants, so two compound parts that hit the SAME
// classifier (e.g. two currency values, "$15 and $25") don't render an identical placeholder that
// looks like it's claiming the two real values are equal. `index` cycles through this list; the
// single-value call sites (index 0) always see the first, original constant, so no non-compound
// hint's wording changes from before this was added.
const N = [12, 9, 15, 6];

// Returns a hint string (no leading "e.g."/"Format:" — callers add that framing) or null if the
// accept value's shape doesn't warrant one (a bare plain number needs no format hint; the generic
// "Write your answer here…" placeholder already covers it). `index` (default 0) is only used
// internally when recursing over a compound answer's parts.
export function formatHint(acceptRaw, index = 0) {
  if (!acceptRaw) return null;
  const raw = String(acceptRaw).trim().replace(/[−–—]/g, '-');   // normalise minus/en/em dash to ASCII "-"
  const n = N[index % N.length];

  // Coordinate pairs contain an internal comma ("(3, 4)") that must NOT be treated as a compound
  // separator — checked first, before any compound splitting, so it's never torn in two.
  if (/^\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)$/.test(raw)) return '(1, 2)';

  // Compound "A and B" / "A; B" / "A, B" (matching the marking engine's own normParts separators,
  // so a comma-joined answer like "P = 16 cm, A = 16 cm²" is recognised as two parts, not one).
  // Hint each part with the SAME index only if it needs no numeric distinction from its sibling
  // (algebra/equation parts already differ by their own letter); numeric-only leaf hints (currency,
  // unit, fraction, ratio) get a distinct index per position so two same-shaped parts don't render
  // an identical, misleadingly-equal placeholder. If EVERY part is a bare plain number (e.g. "18
  // and 27", "9 and −9") skip the hint entirely — a plain number pair has no format ambiguity
  // beyond the separator, which the word "and"/"," already shows.
  const compoundParts = raw.split(/\s+and\s+|[,;]\s*/i);
  if (compoundParts.length > 1) {
    const hints = compoundParts.map((p, i) => formatHint(p, i));
    if (hints.every((h) => !h)) return null;   // no part has real structure (e.g. "18 and 27") -> skip
    // A still-unhinted part gets a generic placeholder ONLY if it's itself purely numeric — a word
    // answer like "not prime" (from "10 factors, not prime") must never be replaced by a number,
    // since that would misrepresent the answer's TYPE, not just its magnitude. If any part is both
    // unhinted AND non-numeric, bail the whole hint rather than show a misleading substitution.
    const filled = hints.map((h, i) => h || (/^-?\d+(\.\d+)?$/.test(compoundParts[i].trim()) ? String(N[i % N.length]) : null));
    if (filled.some((h) => h === null)) return null;
    return filled.join(' and ');
  }

  // Equation-shaped parts already distinguish themselves by their own letter/label (P vs A, x vs
  // y), so unlike currency/unit they don't need index-varied numbers to avoid looking "equal" —
  // always 7, matching the single (non-compound) case this was originally validated against.
  let m;
  if ((m = raw.match(/^([a-z]{1,3})\s*=\s*-?\d/i))) return `${m[1]} = 7`;                       // equation (incl. short labels like SA, HCF)
  if (/^\d+(\.\d+)?\s*:\s*\d+(\.\d+)?$/.test(raw)) return '5 : 2';                              // ratio
  if (/^\d+\s+\d+\/\d+$/.test(raw)) return '2 1/3';                                             // mixed number
  if (/^\d+\/\d+$/.test(raw)) return '3/4';                                                     // fraction
  if (/^\$\d/.test(raw)) return `$${n}`;                                                        // currency

  // termCount >= 2 excludes bare single-letter/single-unit answers (a multiple-choice-style label
  // like "B", or a unit-suffixed value like "−10 m") from being mistaken for algebra — every
  // genuine algebraic-expression accept in this curriculum has both a coefficient AND a constant
  // term (verified against the live data), so a lone term is never actually the "expression" shape.
  const lin = parseLinearExpr(raw);
  if (lin && lin.letter && lin.termCount >= 2) {
    const coeffPart = (lin.coeff < 0 ? `−4${lin.letter}` : `4${lin.letter}`);
    const consPart = lin.cons < 0 ? ' − 1' : ' + 1';
    return coeffPart + consPart;                                                                // linear expression
  }

  // Preserve whichever spacing the original used (m[2]) — "16th" has none, "45 km/h" has one — so
  // an ordinal doesn't grow a spurious space ("12 th") that a unit-suffixed value wouldn't have.
  if ((m = raw.match(/^-?\d+(\.\d+)?(\s*)([a-zA-Z°²³/]+)$/))) return `${n}${m[2]}${m[3]}`;        // number + unit

  // A word LABEL followed by a number ("mode 7", "mean 6") — distinct from "number + unit" above
  // (label comes first here) and common in statistics answers. The marking engine's own normParts
  // strips bare-letter tokens as filler, so "mode 7, range 5" and "7, 5" mark identically — but a
  // learner has no way to know that without a hint. Keep the real word (it's a structural label,
  // like the equation letter above, not the answer's value) and vary only the number.
  if ((m = raw.match(/^([a-z]+)\s+-?\d+(\.\d+)?$/i))) return `${m[1]} ${n}`;                     // label + number
  return null;   // bare plain number or a bare word answer -> the generic placeholder is enough
}
