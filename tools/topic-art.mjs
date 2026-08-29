// tools/topic-art.mjs
//
// Per-topic cover art + accent colour for the Table of Contents cards. Each entry is a small inline
// SVG that *depicts* the mathematics of its chapter (base-ten blocks for place value, a balance for
// equations, a right-angled triangle for Pythagoras...) rather than a generic decorative icon, so a
// reader scanning contents.html can recognise a chapter by its picture alone.
//
// Drawing contract for every SVG here:
//   * viewBox "0 0 64 44" (a 16:11 banner), no width/height - the card CSS sizes it.
//   * Colour comes only from `currentColor`; the card sets `color: var(--c)` to the topic accent.
//     Softer areas use fill-opacity/stroke-opacity, never a hard-coded colour, so one accent per
//     topic drives the whole illustration.
//   * Strokes: width 2, round cap/join (set once on the root <svg>).
//   * A "hollow" shape that must knock out to the card surface reads the banner tint via
//     style="fill:var(--c-tint2,#fff)" - a *style* attribute, never fill="var(...)": Chrome does not
//     resolve var() in an SVG presentation attribute and silently drops the shape instead.
// Keep to those rules when adding art, or a new card will not match the rest of the grid.

const A = (id, accent, art) => [id, { accent, art }];

// Accents are deliberately spread around the wheel so two neighbouring cards never read as the same
// colour, and each is dark enough (~L45-55) to carry white badge text and to tint legibly on paper.
const ART = new Map([
  // ---- Number ----
  A('place-value', '#4459C4', `
    <rect x="5" y="14" width="18" height="18" rx="1.5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>
    <path d="M11 14v18M17 14v18M5 20h18M5 26h18" stroke-opacity=".45" stroke-width="1.2"/>
    <rect x="31" y="14" width="6" height="18" rx="1.5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>
    <path d="M31 20h6M31 26h6" stroke-opacity=".45" stroke-width="1.2"/>
    <rect x="45" y="26" width="6" height="6" rx="1.5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>`),

  A('operations', '#C2571F', `
    <rect x="13" y="7" width="17" height="15" rx="4" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <rect x="34" y="7" width="17" height="15" rx="4" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <rect x="13" y="24" width="17" height="15" rx="4" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <rect x="34" y="24" width="17" height="15" rx="4" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <path d="M21.5 10.5v8M17.5 14.5h8"/>
    <path d="M38.5 14.5h8"/>
    <path d="M18.8 28.3l5.4 5.4M24.2 28.3l-5.4 5.4"/>
    <path d="M38.5 31.5h8"/>
    <circle cx="42.5" cy="28" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="42.5" cy="35" r="1.4" fill="currentColor" stroke="none"/>`),

  A('factors', '#2E8B57', `
    <path d="M32 14v4l-13 6M32 18l13 6" stroke-opacity=".55"/>
    <path d="M19 31v2l-6 3M19 33l6 3" stroke-opacity=".55"/>
    <circle cx="32" cy="9" r="5" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>
    <circle cx="19" cy="26" r="5" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>
    <circle cx="45" cy="26" r="5" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="13" cy="39" r="4.5" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="25" cy="39" r="4.5" fill="currentColor" fill-opacity=".85" stroke="none"/>`),

  A('fractions', '#C0417C', `
    <circle cx="32" cy="22" r="15" style="fill:var(--c-tint2,#fff)" stroke="none"/>
    <path d="M32 22L32 7A15 15 0 1 1 17 22Z" fill="currentColor" fill-opacity=".78" stroke="none"/>
    <path d="M32 7v30M17 22h30" style="stroke:var(--c-tint2,#fff)" stroke-width="1.8"/>
    <circle cx="32" cy="22" r="15" fill="none" stroke="currentColor"/>`),

  A('decimals', '#1C87B8', `
    <rect x="13" y="5" width="14" height="16" rx="3.5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>
    <rect x="37" y="5" width="14" height="16" rx="3.5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>
    <circle cx="32" cy="18" r="3.2" fill="currentColor" stroke="none"/>
    <path d="M6 33h52" stroke-opacity=".55"/>
    <path d="M10 30v6M32 28v8M54 30v6M21 31v4M43 31v4" stroke-width="1.6" stroke-opacity=".5"/>
    <path d="M32 39.5l-3.4 4.5h6.8z" fill="currentColor" stroke="none"/>`),

  A('percentages', '#B5820F', `
    <circle cx="18" cy="13" r="7" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.4"/>
    <circle cx="46" cy="31" r="7" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.4"/>
    <path d="M49 6L15 38" stroke-width="2.8"/>`),

  A('ratios', '#6B4FC0', `
    <circle cx="15" cy="14" r="5.5" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <circle cx="15" cy="30" r="5.5" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <circle cx="32" cy="17" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="32" cy="27" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="49" cy="8" r="5.5" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="49" cy="22" r="5.5" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="49" cy="36" r="5.5" fill="currentColor" fill-opacity=".85" stroke="none"/>`),

  A('integers', '#1E9A8A', `
    <path d="M6 26h52M6 26l5-4M6 26l5 4M58 26l-5-4M58 26l-5 4"/>
    <path d="M16 22v8M24 23v6M40 23v6M48 22v8" stroke-width="1.6" stroke-opacity=".5"/>
    <path d="M32 18v16" stroke-opacity=".75"/>
    <circle cx="16" cy="26" r="3.4" fill="currentColor" stroke="none"/>
    <circle cx="48" cy="26" r="3.4" fill="currentColor" stroke="none"/>
    <path d="M12 11h8" stroke-opacity=".8"/>
    <path d="M44 11h8M48 7v8" stroke-opacity=".8"/>`),

  A('powers', '#C0392B', `
    <rect x="5" y="13" width="22" height="22" rx="2" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>
    <path d="M12.3 13v22M19.7 13v22M5 20.3h22M5 27.7h22" stroke-opacity=".45" stroke-width="1.2"/>
    <path d="M35 29l4 7 6-22h14"/>`),

  // ---- Algebra ----
  A('patterns', '#7A3FB0', `
    <circle cx="10" cy="36" r="3.2" fill="currentColor" stroke="none"/>
    <circle cx="28" cy="25" r="3.2" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="23" cy="36" r="3.2" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="33" cy="36" r="3.2" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <circle cx="51" cy="14" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>
    <circle cx="46" cy="25" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>
    <circle cx="56" cy="25" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>
    <circle cx="41" cy="36" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>
    <circle cx="51" cy="36" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>
    <circle cx="61" cy="36" r="3.2" fill="currentColor" fill-opacity=".7" stroke="none"/>`),

  A('expressions', '#2F6FC4', `
    <rect x="4" y="16" width="26" height="12" rx="2.5" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <text x="17" y="26" font-size="10" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none">x</text>
    <path d="M36 22h7M39.5 18.5v7"/>
    <rect x="48" y="16" width="12" height="12" rx="2.5" fill="currentColor" fill-opacity=".85" stroke="none"/>`),

  A('equations', '#B7791F', `
    <path d="M32 12v22M12 12h40"/>
    <circle cx="32" cy="11" r="2.6" fill="currentColor" stroke="none"/>
    <path d="M22 34h20l-10 5z" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <path d="M12 12v5M52 12v5"/>
    <path d="M4 17q8 11 16 0z" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <path d="M44 17q8 11 16 0z" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>`),

  A('inequalities', '#2E9E6B', `
    <path d="M16 8L7 14l9 6" stroke-opacity=".5"/>
    <path d="M6 31h52M58 31l-5-4M58 31l-5 4"/>
    <path d="M14 28v6M24 28v6M44 28v6M54 28v6" stroke-width="1.6" stroke-opacity=".45"/>
    <path d="M34 31h21" stroke-width="4.5" stroke-opacity=".45"/>
    <circle cx="34" cy="31" r="4.5" style="fill:var(--c-tint2,#fff)" stroke="currentColor"/>`),

  A('graphs', '#C2417A', `
    <path d="M13 7v31h45" stroke-opacity=".55"/>
    <path d="M13 7l-3 4M13 7l3 4M58 38l-4-3M58 38l-4 3" stroke-opacity=".55" stroke-width="1.6"/>
    <path d="M17 34l36-22"/>
    <circle cx="21" cy="31.6" r="2.8" fill="currentColor" stroke="none"/>
    <circle cx="35" cy="23" r="2.8" fill="currentColor" stroke="none"/>
    <circle cx="49" cy="14.5" r="2.8" fill="currentColor" stroke="none"/>`),

  // ---- Geometry ----
  A('angles', '#1E8A8A', `
    <path d="M12 36h18a18 18 0 0 0 12.3-13.2z" fill="currentColor" fill-opacity=".2" stroke="none"/>
    <path d="M12 36h46M12 36L41 5"/>
    <path d="M30 36a18 18 0 0 0 12.3-13.2" stroke-width="1.7"/>
    <circle cx="12" cy="36" r="2.6" fill="currentColor" stroke="none"/>`),

  A('shapes', '#5B54C6', `
    <path d="M4 37h15l-7.5-17z" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>
    <rect x="25" y="21" width="16" height="16" rx="1.5" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>
    <path d="M54 15l9.5 6.9-3.6 11.2H48.1L44.5 21.9z" fill="currentColor" fill-opacity=".18" stroke="currentColor"/>`),

  A('transformations', '#C26A1E', `
    <path d="M10 34h16V16z" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>
    <path d="M54 34H38V16z" fill="currentColor" fill-opacity=".5" stroke="currentColor"/>
    <path d="M32 6v32" stroke-dasharray="4 3.5" stroke-opacity=".6"/>`),

  A('pythagoras', '#3B8F3B', `
    <rect x="30" y="20" width="16" height="16" fill="currentColor" fill-opacity=".28" stroke="currentColor" stroke-width="1.5"/>
    <rect x="18" y="8" width="12" height="12" fill="currentColor" fill-opacity=".28" stroke="currentColor" stroke-width="1.5"/>
    <path d="M30 20H46L30 8Z" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
    <path d="M30 16h4v4" stroke-width="1.5" stroke-opacity=".75"/>`),

  A('circles', '#B5406C', `
    <circle cx="30" cy="22" r="16" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
    <path d="M30 6a16 16 0 0 1 16 16" stroke-width="3"/>
    <path d="M30 22l11.3 11.3"/>
    <path d="M14 22h32" stroke-dasharray="4 3.5" stroke-opacity=".5" stroke-width="1.6"/>
    <circle cx="30" cy="22" r="2.6" fill="currentColor" stroke="none"/>`),

  // ---- Measurement ----
  A('perimeter-area', '#C9791A', `
    <rect x="7" y="10" width="50" height="28" rx="3" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.6"/>
    <path d="M19 10v28M31 10v28M43 10v28M7 19h50M7 29h50" stroke-opacity=".4" stroke-width="1.2"/>`),

  A('volume', '#4A63C8', `
    <path d="M40 36l10-8V10l-10 8z" fill="currentColor" fill-opacity=".12" stroke="none"/>
    <path d="M14 18h26v18H14z" fill="currentColor" fill-opacity=".22" stroke="currentColor"/>
    <path d="M14 18l10-8h26l-10 8z" fill="currentColor" fill-opacity=".38" stroke="currentColor"/>
    <path d="M40 36l10-8V10" stroke="currentColor"/>`),

  A('conversions', '#1E9490', `
    <path d="M8 10h48M8 10l4-3.5M8 10l4 3.5M56 10l-4-3.5M56 10l4 3.5" stroke-opacity=".6"/>
    <rect x="6" y="19" width="52" height="16" rx="3" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <path d="M14 19v8M22 19v5M30 19v8M38 19v5M46 19v8" stroke-width="1.6" stroke-opacity=".55"/>`),

  // ---- Statistics & Probability ----
  A('statistics', '#B5405C', `
    <rect x="9" y="26" width="9" height="12" rx="2" fill="currentColor" fill-opacity=".35" stroke="none"/>
    <rect x="23" y="16" width="9" height="22" rx="2" fill="currentColor" fill-opacity=".6" stroke="none"/>
    <rect x="37" y="22" width="9" height="16" rx="2" fill="currentColor" fill-opacity=".45" stroke="none"/>
    <rect x="51" y="10" width="9" height="28" rx="2" fill="currentColor" fill-opacity=".85" stroke="none"/>
    <path d="M6 38h52" stroke-opacity=".5"/>
    <path d="M6 21h52" stroke-dasharray="4 3.5" stroke-width="1.6"/>`),

  A('probability', '#5E4FBE', `
    <rect x="6" y="13" width="25" height="25" rx="5" fill="currentColor" fill-opacity=".16" stroke="currentColor"/>
    <circle cx="13" cy="20" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="24" cy="20" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="18.5" cy="25.5" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="13" cy="31" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="24" cy="31" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="47" cy="25" r="12" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
    <path d="M47 25V13M47 25l10.4 6M47 25L36.6 31" stroke-opacity=".45" stroke-width="1.4"/>
    <path d="M47 25l8-6"/>
    <circle cx="47" cy="25" r="2.4" fill="currentColor" stroke="none"/>`),
]);

// Fallback so a newly added topic still renders a card instead of a hole in the grid.
const FALLBACK = {
  accent: '#5A6178',
  art: `<circle cx="32" cy="22" r="15" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
    <path d="M26 17a6 6 0 1 1 6 8v3"/>
    <circle cx="32" cy="33" r="1.8" fill="currentColor" stroke="none"/>`,
};

export function topicArt(id) {
  const { accent, art } = ART.get(id) || FALLBACK;
  return {
    accent,
    svg: `<svg class="toc-art-svg" viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${art.trim()}</svg>`,
  };
}

// The five custom properties every card-shaped surface needs, derived from one accent: the card
// surface, the banner's two gradient stops and the border. Emitted inline (contents.html cards,
// js/toc-art.js) so css/styles.css stays colour-agnostic and one ruleset serves every card.
export function cardVars(accent) {
  return `--c:${accent};--c-bg:${lighten(accent, 0.955)};--c-tint:${lighten(accent, 0.9)};`
    + `--c-tint2:${lighten(accent, 0.975)};--c-line:${lighten(accent, 0.78)}`;
}

// Mix `hex` toward white by `amount` (0 = the colour itself, 1 = white). Every tinted surface on a
// card - background, border, banner - is derived from the single accent above, so re-colouring a
// topic is a one-line edit.
export function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, '0'))
    .join('');
}

// Mix `hex` toward black by `amount`. Only needed for the chapter hook banner's gradient, which
// needs a deeper shade of the same accent to read as one colour rather than two.
export function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => Math.round(v * (1 - amount)).toString(16).padStart(2, '0'))
    .join('');
}
