/* js/explore.js
   The "Explore — play with the maths" widgets, one per chapter. Two kinds, both zero-dependency:

   - slider widgets (GeoGebra / Desmos / CK-12 PLIX style): drag a slider, the diagram and the
     numbers respond instantly, so the learner FEELS the relationship before naming it.
   - card sorts (Desmos Classroom style): click a card, click a bucket, then Check — used for the
     classification topics (order of operations, primes, triangle types).

   Every chapter also carries a short list of CHALLENGES — goals to hit with the widget. A slider
   widget's goals are checked live against the same values render() sees; a card sort's are
   checked when Check is pressed, against a summary of where the cards landed. Solving one is
   remembered and worth a little XP, so a returning reader resumes at the next goal, not the first.

   The generator emits an empty #explore-widget on every chapter page; this file looks up
   window.CURRENT_TOPIC_ID and builds the matching widget. If a topic ever has no spec the whole
   section is removed rather than left empty. */
(function () {
  'use strict';

  /* ---------- tiny helpers ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function svg(w, h, inner, label) {
    return '<svg class="viz" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" role="img" aria-label="' + label + '">' + inner + '</svg>';
  }
  function cap(t) { return '<div class="ex-cap">' + t + '</div>'; }
  // Stacked-fraction markup, matching what tools/generate-book.mjs emits, so widget captions pick up
  // the same .frac styling as the rest of the chapter instead of a flat "3/4".
  function frac(n, d) {
    return '<span class="frac"><span class="n">' + n + '</span><span class="d">' + d + '</span></span>';
  }
  function note(t) { return '<div class="ex-note">' + t + '</div>'; }
  var INK = '#20263F', SOFT = '#5A6178', BRAND = '#3B4CA8', TINT = '#C7D0F2', MARI = '#FFC24B',
    MARI_BG = '#FCE7B8', GOOD = '#238B62', GOOD_BG = '#CDEBD9', BAD = '#C93F4C';
  function txt(x, y, s, anchor, size, fill, bold) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="Space Mono" font-size="' + (size || 12) + '" ' + (bold ? 'font-weight="700" ' : '') + 'fill="' + (fill || INK) + '">' + s + '</text>';
  }
  function cellRow(n, shaded, w, h, colOn, colOff) {
    var cw = w / n, out = '';
    for (var i = 0; i < n; i++) {
      out += '<rect x="' + (i * cw + 1) + '" y="1" width="' + (cw - 2) + '" height="' + h + '" rx="3" fill="' + (i < shaded ? colOn : colOff) + '" stroke="#8A90A8"/>';
    }
    return out;
  }

  // One mystery sequence per page load, so the patterns widget can also rehearse the harder
  // direction — inferring a rule FROM terms, not just generating terms from a rule.
  var patTarget = { d: 2 + Math.floor(Math.random() * 6), c: 1 + Math.floor(Math.random() * 7) };

  // Metric rungs for the conversions widget, ordered largest unit first. `per` is how many of that
  // unit make one metre, so a metre value converts with a single multiply.
  var CONV_UNITS = [
    { name: 'km', per: 0.001 }, { name: 'm', per: 1 },
    { name: 'cm', per: 100 }, { name: 'mm', per: 1000 }
  ];
  // Whole numbers get thousands separators; kilometres keep up to 3 decimals without trailing zeros.
  function convNum(x) {
    return (Math.round(x * 1000) / 1000).toLocaleString('en-NZ', { maximumFractionDigits: 3 });
  }

  /* ---------- the 24 specs ---------- */
  var EXPLORES = {

    'place-value': {
      kind: 'slider', intro: 'Build a number digit by digit, then see where it rounds to on the number line.',
      sliders: [
        { id: 'th', label: 'Thousands', min: 0, max: 9, step: 1, val: 4 },
        { id: 'h', label: 'Hundreds', min: 0, max: 9, step: 1, val: 3 },
        { id: 't', label: 'Tens', min: 0, max: 9, step: 1, val: 7 },
        { id: 'o', label: 'Ones', min: 0, max: 9, step: 1, val: 6 },
        { id: 'rp', label: 'Round to nearest', min: 1, max: 3, step: 1, val: 2, fmt: function (x) { return [10, 100, 1000][x - 1]; } }
      ],
      render: function (v) {
        var n = 1000 * v.th + 100 * v.h + 10 * v.t + v.o;
        var p = [10, 100, 1000][v.rp - 1];
        var lower = Math.floor(n / p) * p, upper = lower + p, rounded = (n - lower >= p / 2) ? upper : lower;
        var x0 = 40, x1 = 288, XN = x0 + (n - lower) / p * (x1 - x0);
        var g = '<line x1="' + x0 + '" y1="34" x2="' + x1 + '" y2="34" stroke="' + SOFT + '" stroke-width="1.5"/>';
        g += '<line x1="' + ((x0 + x1) / 2) + '" y1="29" x2="' + ((x0 + x1) / 2) + '" y2="39" stroke="' + SOFT + '" stroke-dasharray="2 2"/>';
        [[x0, lower], [x1, upper]].forEach(function (a) {
          var isR = a[1] === rounded;
          g += '<line x1="' + a[0] + '" y1="27" x2="' + a[0] + '" y2="41" stroke="' + (isR ? BRAND : SOFT) + '" stroke-width="' + (isR ? 2.5 : 1) + '"/>';
          g += txt(a[0], 55, a[1].toLocaleString('en-NZ'), 'middle', 11, isR ? BRAND : SOFT, isR);
        });
        g += '<circle cx="' + XN.toFixed(1) + '" cy="34" r="5" fill="' + MARI + '" stroke="' + INK + '"/>' + txt(XN.toFixed(1), 19, n.toLocaleString('en-NZ'), 'middle', 11, INK, true);
        return '<div class="ex-num">' + n.toLocaleString('en-NZ') + '</div>' +
          cap(v.th + '&times;1000 + ' + v.h + '&times;100 + ' + v.t + '&times;10 + ' + v.o + ' = ' + n) +
          svg(320, 64, g, 'number line showing ' + n + ' between ' + lower + ' and ' + upper) +
          cap('Rounded to the nearest ' + p + ': <b>' + rounded.toLocaleString('en-NZ') + '</b>') +
          note('Look only at the digit just right of the place you&rsquo;re keeping — 5 or more rounds up. Watch a value like 9,996 carry all the way when it rounds.');
      }
    },

    operations: {
      kind: 'sort', intro: 'BEDMAS in action: what happens FIRST in each calculation? Click a card, then click its group.',
      buckets: ['&times; or &divide; first', 'Brackets first', 'Left to right only'],
      cards: [
        { t: '6 + 4 &times; 3', b: 0 }, { t: '8 + 12 &divide; 4', b: 0 },
        { t: '(6 + 4) &times; 3', b: 1 }, { t: '(9 &minus; 5) &times; 2', b: 1 },
        { t: '10 &minus; 3 + 2', b: 2 }, { t: '20 &divide; 5 &times; 2', b: 2 }
      ]
    },

    factors: {
      kind: 'sort', intro: 'Prime or composite? A prime has exactly two factors. Click a card, then click its group.',
      buckets: ['Prime', 'Composite'],
      cards: [
        { t: '17', b: 0 }, { t: '29', b: 0 }, { t: '2', b: 0 }, { t: '41', b: 0 },
        { t: '21', b: 1 }, { t: '9', b: 1 }, { t: '39', b: 1 }, { t: '33', b: 1 }
      ]
    },

    // Two bars, not one. Equivalence and comparison are both claims about how two fractions relate,
    // and a single bar can only ever show one of them at a time — the learner has to remember the
    // previous picture. Side by side, at the same total width, "equivalent" becomes something you
    // can see (the shaded edges line up) rather than something you are told.
    fractions: {
      kind: 'slider', intro: 'Two bars, one whole each. Make them equivalent, then compare them &mdash; watch where the shaded edges land.',
      sliders: [
        { id: 'n1', label: 'Top A', min: 0, max: 12, step: 1, val: 3 },
        { id: 'd1', label: 'Bottom A', min: 2, max: 12, step: 1, val: 4 },
        { id: 'n2', label: 'Top B', min: 0, max: 12, step: 1, val: 2 },
        { id: 'd2', label: 'Bottom B', min: 2, max: 12, step: 1, val: 3 }
      ],
      render: function (v) {
        var W = 300, BH = 30;
        var a = { n: Math.min(v.n1, v.d1), d: v.d1 }, b = { n: Math.min(v.n2, v.d2), d: v.d2 };
        a.val = a.n / a.d; b.val = b.n / b.d;

        function bar(f, y, colOn) {
          var g = '<g transform="translate(0,' + y + ')">' + cellRow(f.d, f.n, W, BH, colOn, '#fff') + '</g>';
          // A dashed drop-line at the shaded edge turns "which is bigger" into a direct read-off.
          var x = f.val * W;
          g += '<line x1="' + x + '" y1="' + (y - 4) + '" x2="' + x + '" y2="' + (y + BH + 4) + '" stroke="' + INK + '" stroke-width="1.5" stroke-dasharray="3 2.5"/>';
          return g;
        }
        var g = txt(0, 12, 'A', 'start', 12, SOFT, true) + bar(a, 18, MARI)
          + txt(0, 76, 'B', 'start', 12, SOFT, true) + bar(b, 82, TINT);

        var same = Math.abs(a.val - b.val) < 1e-9;
        var verdict = same
          ? (a.d === b.d && a.n === b.n ? 'the same fraction' : 'equivalent &mdash; the shaded edges line up')
          : (a.val > b.val ? 'A is bigger' : 'B is bigger');
        var ga = gcd(a.n, a.d), simp = (a.n > 0 && ga > 1) ? ' (simplifies to ' + frac(a.n / ga, a.d / ga) + ')' : '';

        return svg(W + 2, 124, g, 'Two fraction bars compared at the same width') +
          cap(frac(a.n, a.d) + ' = ' + a.val.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + simp
            + ' &nbsp;&middot;&nbsp; ' + frac(b.n, b.d) + ' = ' + b.val.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
            + ' &nbsp;&rarr;&nbsp; <b>' + verdict + '</b>') +
          note('Scale a fraction&rsquo;s top and bottom by the same number &mdash; try 1/2 against 2/4, then 3/6 &mdash; and the bar splits into more pieces but the shaded edge does not move. Different numbers, same amount.');
      }
    },

    decimals: {
      kind: 'slider', intro: 'Multiplying decimals is an area: tenths across &times; tenths down make hundredths. Shade and count.',
      sliders: [
        { id: 'a', label: 'First factor', min: 1, max: 9, step: 1, val: 6, fmt: function (x) { return '0.' + x; } },
        { id: 'b', label: 'Second factor', min: 1, max: 9, step: 1, val: 7, fmt: function (x) { return '0.' + x; } }
      ],
      render: function (v) {
        var s = 15, g = '';
        for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) {
          var on = c < v.a && r < v.b;
          g += '<rect x="' + (c * s + 1) + '" y="' + (r * s + 1) + '" width="' + (s - 2) + '" height="' + (s - 2) + '" rx="1.5" fill="' + (on ? BRAND : '#fff') + '" fill-opacity="' + (on ? '.5' : '1') + '" stroke="#B6C0D8"/>';
        }
        var prod = v.a * v.b;
        return svg(152, 152, g, v.a + ' columns by ' + v.b + ' rows shaded, ' + prod + ' of 100 cells') +
          cap('0.' + v.a + ' &times; 0.' + v.b + ': shade ' + v.a + ' columns &times; ' + v.b + ' rows = <b>' + prod + '</b> of 100 = <b>' + (prod / 100).toFixed(2) + '</b>') +
          note('Each factor is in tenths, so the shaded area is in hundredths — that is why the answer has 1 + 1 = 2 decimal places (' + v.a + ' &times; ' + v.b + ' = ' + prod + ', then &divide; 100).');
      }
    },

    percentages: {
      kind: 'slider', intro: 'One number, three costumes: percent, fraction, decimal — plus a hundred-grid.',
      sliders: [{ id: 'p', label: 'Percent', min: 0, max: 100, step: 1, val: 25 }],
      render: function (v) {
        var g = '', s = 15;
        for (var i = 0; i < 100; i++) {
          var r = Math.floor(i / 10), c = i % 10;
          g += '<rect x="' + (c * s + 1) + '" y="' + (r * s + 1) + '" width="' + (s - 2) + '" height="' + (s - 2) + '" rx="2" fill="' + (i < v.p ? GOOD_BG : '#fff') + '" stroke="#B6C0D8"/>';
        }
        return svg(152, 152, g, v.p + ' of 100 squares shaded') +
          cap(v.p + '% = ' + v.p + '&frasl;100 = ' + (v.p / 100).toFixed(2)) +
          note(v.p === 50 ? 'Half the grid — 50% is the fraction &frac12; in disguise.' : 'Every percentage is just a count out of this same 100-square grid.');
      }
    },

    ratios: {
      kind: 'slider', intro: 'Set a ratio and watch the bar model split the whole into parts.',
      sliders: [
        { id: 'a', label: 'First part', min: 1, max: 6, step: 1, val: 2 },
        { id: 'b', label: 'Second part', min: 1, max: 6, step: 1, val: 3 }
      ],
      render: function (v) {
        var total = v.a + v.b, cw = 300 / total, g = '';
        for (var i = 0; i < total; i++) {
          g += '<rect x="' + (i * cw + 1) + '" y="1" width="' + (cw - 2) + '" height="38" rx="3" fill="' + (i < v.a ? TINT : MARI_BG) + '" stroke="#8A90A8"/>';
        }
        var gg = gcd(v.a, v.b);
        return svg(302, 42, g, 'bar of ' + v.a + ' blue and ' + v.b + ' yellow parts') +
          cap(v.a + ' : ' + v.b + ' &mdash; ' + total + ' parts; first = ' + v.a + '&frasl;' + total + ' of the whole' + (gg > 1 ? ' (simplifies to ' + (v.a / gg) + ' : ' + (v.b / gg) + ')' : '')) +
          note('Sharing $' + (total * 4) + ' this way? One part = $4, so the shares are $' + (v.a * 4) + ' and $' + (v.b * 4) + '.');
      }
    },

    integers: {
      kind: 'slider', intro: 'Adding and subtracting are movement. Try subtracting a negative and watch which way you walk.',
      sliders: [
        { id: 's', label: 'Start at', min: -10, max: 10, step: 1, val: 5 },
        { id: 'op', label: 'Operation', min: 0, max: 1, step: 1, val: 1, fmt: function (i) { return i ? 'subtract' : 'add'; } },
        { id: 'n', label: 'Number', min: -10, max: 10, step: 1, val: -3 }
      ],
      render: function (v) {
        var eff = v.op ? -v.n : v.n, r = v.s + eff, W = 320, X = function (n) { return 160 + n * 7.6; };
        var nstr = v.n < 0 ? '(&minus;' + (-v.n) + ')' : '' + v.n, effstr = eff < 0 ? '(&minus;' + (-eff) + ')' : '' + eff;
        var g = '<line x1="' + X(-20) + '" y1="30" x2="' + X(20) + '" y2="30" stroke="' + SOFT + '" stroke-width="1.5"/>';
        for (var i = -20; i <= 20; i += 5) g += '<line x1="' + X(i) + '" y1="25" x2="' + X(i) + '" y2="35" stroke="' + SOFT + '"/>' + txt(X(i), 50, i, 'middle', 10, SOFT);
        g += '<defs><marker id="exArr" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="' + BRAND + '"/></marker></defs>';
        if (eff !== 0) g += '<path d="M' + X(v.s) + ',18 Q' + ((X(v.s) + X(r)) / 2) + ',2 ' + X(r) + ',18" fill="none" stroke="' + BRAND + '" stroke-width="2" marker-end="url(#exArr)"/>';
        g += '<circle cx="' + X(v.s) + '" cy="30" r="5" fill="' + MARI + '" stroke="' + INK + '"/><circle cx="' + X(r) + '" cy="30" r="5" fill="' + BRAND + '"/>';
        var expr = v.op ? v.s + ' &minus; ' + nstr + ' = ' + v.s + ' + ' + effstr + ' = ' + r : v.s + ' + ' + nstr + ' = ' + r;
        return svg(W, 56, g, 'number line jump from ' + v.s + ' to ' + r) + cap(expr) +
          note(v.op && v.n < 0 ? 'Subtracting a negative ADDS — the two minus signs make a plus, so you walk right.' : eff === 0 ? 'A move of zero goes nowhere.' : eff < 0 ? 'This walks left along the line.' : 'This walks right along the line.');
      }
    },

    powers: {
      kind: 'slider', intro: 'An exponent counts factors, not multiplications-by. Watch the expansion.',
      sliders: [
        { id: 'b', label: 'Base', min: 2, max: 6, step: 1, val: 2 },
        { id: 'e', label: 'Exponent', min: 0, max: 5, step: 1, val: 3 }
      ],
      render: function (v) {
        var val = Math.pow(v.b, v.e);
        var expand = v.e === 0 ? '(empty product)' : Array(v.e).fill(v.b).join(' &times; ');
        return '<div class="ex-num">' + v.b + '<sup>' + v.e + '</sup> = ' + val.toLocaleString('en-NZ') + '</div>' +
          cap(v.b + '<sup>' + v.e + '</sup> = ' + expand + (v.e === 0 ? ' = 1' : '')) +
          note(v.e === 0 ? 'Anything to the power 0 is 1 — the pattern &divide;' + v.b + ' each step forces it.' : 'Compare with ' + v.b + ' &times; ' + v.e + ' = ' + (v.b * v.e) + ' — powers grow far faster.');
      }
    },

    patterns: {
      kind: 'slider', intro: 'Build an nth-term rule and jump straight to any term.',
      sliders: [
        { id: 'd', label: 'Common difference', min: 1, max: 9, step: 1, val: 4 },
        { id: 'c', label: 'Adjustment (+)', min: 0, max: 9, step: 1, val: 6 },
        { id: 'n', label: 'Jump to term n', min: 1, max: 50, step: 1, val: 20 }
      ],
      render: function (v) {
        var terms = [1, 2, 3, 4, 5].map(function (n) { return v.d * n + v.c; });
        var mystery = [1, 2, 3, 4, 5].map(function (n) { return patTarget.d * n + patTarget.c; });
        var matched = v.d === patTarget.d && v.c === patTarget.c;
        return '<div class="ex-num">' + v.d + 'n + ' + v.c + '</div>' +
          cap('Your terms 1&ndash;5: ' + terms.join(', ') + ', &hellip;') +
          cap('Term ' + v.n + ' = ' + v.d + '&times;' + v.n + ' + ' + v.c + ' = <b>' + (v.d * v.n + v.c) + '</b>') +
          cap('&#128269; Mystery sequence: <b>' + mystery.slice(0, 4).join(', ') + ', &hellip;</b> &mdash; set the sliders to generate it.') +
          note(matched ? '&#9989; Matched! The mystery rule is ' + patTarget.d + 'n + ' + patTarget.c + '. (Find the constant gap for d, then adjust to fit term 1.)' : 'Work backwards: the constant gap between mystery terms is d; then find the adjustment that fixes term 1.');
      }
    },

    expressions: {
      kind: 'slider', intro: 'An expression is a machine: feed it x, it returns a value.',
      sliders: [
        { id: 'a', label: 'Coefficient a', min: 1, max: 9, step: 1, val: 3 },
        { id: 'b', label: 'Constant b', min: 0, max: 9, step: 1, val: 2 },
        { id: 'x', label: 'Input x', min: 0, max: 10, step: 1, val: 4 }
      ],
      render: function (v) {
        return '<div class="ex-num">' + v.a + 'x + ' + v.b + '</div>' +
          cap('At x = ' + v.x + ':&nbsp; ' + v.a + '&times;' + v.x + ' + ' + v.b + ' = <b>' + (v.a * v.x + v.b) + '</b>') +
          note('Taxi-fare reading: $' + v.b + ' flagfall plus $' + v.a + ' per km, for a ' + v.x + ' km trip.');
      }
    },

    equations: {
      kind: 'slider', intro: 'Find the x that balances the scale: x + 4 = 10.',
      sliders: [{ id: 'x', label: 'Try x =', min: 0, max: 12, step: 1, val: 2 }],
      render: function (v) {
        var L = v.x + 4, R = 10, diff = L - R;
        var ang = Math.max(-12, Math.min(12, diff * 3));
        var g = '<g transform="rotate(' + ang + ' 130 30)">' +
          '<line x1="30" y1="30" x2="230" y2="30" stroke="' + INK + '" stroke-width="3"/>' +
          '<rect x="18" y="8" width="52" height="20" rx="5" fill="' + MARI_BG + '" stroke="' + INK + '"/>' + txt(44, 22, 'x + 4', 'middle', 11, INK, true) +
          '<rect x="190" y="8" width="52" height="20" rx="5" fill="' + GOOD_BG + '" stroke="' + INK + '"/>' + txt(216, 22, '10', 'middle', 11, INK, true) +
          '</g>' +
          '<polygon points="130,30 118,62 142,62" fill="' + SOFT + '"/>';
        var verdict = diff === 0 ? '&#9878;&#65039; <b>Balanced!</b> x = ' + v.x + ' solves x + 4 = 10.'
          : diff > 0 ? 'Tips left — ' + L + ' &gt; ' + R + ', so x is too big.'
            : 'Tips right — ' + L + ' &lt; ' + R + ', so x is too small.';
        return svg(260, 66, g, 'balance scale comparing x plus 4 with 10') +
          cap('Left pan: ' + v.x + ' + 4 = ' + L + ' &nbsp;|&nbsp; right pan: 10') + note(verdict);
      }
    },

    inequalities: {
      kind: 'slider', intro: 'Change the sign and the test value: watch the solution region and the boundary circle respond.',
      sliders: [
        { id: 'sym', label: 'Sign', min: 0, max: 3, step: 1, val: 0, fmt: function (i) { return ['<', '≤', '>', '≥'][i]; } },
        { id: 'x', label: 'Test x =', min: -5, max: 10, step: 1, val: 3 }
      ],
      render: function (v) {
        var syms = ['&lt;', '&le;', '&gt;', '&ge;'], sym = syms[v.sym], B = 7;
        var lt = (v.sym === 0 || v.sym === 1), incl = (v.sym === 1 || v.sym === 3);
        var ok = v.sym === 0 ? v.x < B : v.sym === 1 ? v.x <= B : v.sym === 2 ? v.x > B : v.x >= B;
        var X = function (n) { return 160 + n * 9; };
        var rx0 = lt ? X(-6) : X(B), rx1 = lt ? X(B) : X(11);
        var g = '<rect x="' + rx0 + '" y="24" width="' + (rx1 - rx0) + '" height="12" fill="' + GOOD_BG + '"/>' +
          '<line x1="' + X(-6) + '" y1="30" x2="' + X(11) + '" y2="30" stroke="' + SOFT + '" stroke-width="1.5"/>';
        for (var i = -5; i <= 10; i += 5) g += '<line x1="' + X(i) + '" y1="25" x2="' + X(i) + '" y2="35" stroke="' + SOFT + '"/>' + txt(X(i), 50, i, 'middle', 10, SOFT);
        g += '<circle cx="' + X(B) + '" cy="30" r="5.5" fill="' + (incl ? BRAND : '#fff') + '" stroke="' + BRAND + '" stroke-width="2"/>';
        g += '<circle cx="' + X(v.x) + '" cy="30" r="5" fill="' + (ok ? GOOD : BAD) + '"/>';
        return svg(320, 56, g, 'number line with the region for x ' + sym + ' 7 shaded') +
          cap('Solve x + 2 ' + sym + ' 9 &rarr; x ' + sym + ' 7. Testing x = ' + v.x + ': ' + (v.x + 2) + ' ' + sym + ' 9 is ' + (ok ? '<b>true &#10003;</b>' : 'false &#10007;')) +
          note((incl ? 'A filled circle' : 'An open circle') + ' at 7 means the boundary is ' + (incl ? 'included — x can equal 7.' : 'excluded — x cannot equal 7.'));
      }
    },

    graphs: {
      kind: 'slider', intro: 'The two numbers that pin down any line: drag m (steepness) and c (start height).',
      sliders: [
        { id: 'm', label: 'Gradient m', min: -3, max: 3, step: 1, val: 2 },
        { id: 'c', label: 'Intercept c', min: -5, max: 5, step: 1, val: 1 }
      ],
      render: function (v) {
        var S = 230, p = 15, u = (S - 2 * p) / 10, cx = S / 2, cy = S / 2;
        var X = function (x) { return cx + x * u; }, Y = function (y) { return cy - y * u; };
        var g = '';
        for (var i = -5; i <= 5; i++) g += '<line x1="' + X(i) + '" y1="' + p + '" x2="' + X(i) + '" y2="' + (S - p) + '" stroke="#E4E8F2"/><line x1="' + p + '" y1="' + Y(i) + '" x2="' + (S - p) + '" y2="' + Y(i) + '" stroke="#E4E8F2"/>';
        g += '<line x1="' + p + '" y1="' + cy + '" x2="' + (S - p) + '" y2="' + cy + '" stroke="' + SOFT + '" stroke-width="1.5"/><line x1="' + cx + '" y1="' + p + '" x2="' + cx + '" y2="' + (S - p) + '" stroke="' + SOFT + '" stroke-width="1.5"/>';
        g += '<line x1="' + X(-5) + '" y1="' + Y(v.m * -5 + v.c) + '" x2="' + X(5) + '" y2="' + Y(v.m * 5 + v.c) + '" stroke="' + BRAND + '" stroke-width="2.5"/>';
        g += '<circle cx="' + X(0) + '" cy="' + Y(v.c) + '" r="5" fill="' + MARI + '" stroke="' + INK + '"/>';
        var eq = 'y = ' + (v.m === 1 ? '' : v.m === -1 ? '&minus;' : v.m) + 'x ' + (v.c >= 0 ? '+ ' + v.c : '&minus; ' + (-v.c));
        if (v.m === 0) eq = 'y = ' + v.c;
        return svg(S, S, g, 'line with gradient ' + v.m + ' and intercept ' + v.c) +
          cap(eq) + note(v.m === 0 ? 'Gradient 0: a flat line — y never changes.' : 'From the orange dot, every 1 step right climbs ' + v.m + ' — try m negative.');
      }
    },

    angles: {
      kind: 'slider', intro: 'Pick a scene: two angles on a straight line, or a transversal cutting parallel lines.',
      sliders: [
        { id: 'm', label: 'Scene', min: 0, max: 1, step: 1, val: 0, fmt: function (i) { return i ? 'parallel lines' : 'straight line'; } },
        { id: 'a', label: 'Angle', min: 15, max: 165, step: 5, val: 60 }
      ],
      render: function (v) {
        if (v.m === 1) {
          var y1 = 60, y2 = 96, sep = y2 - y1, cx = 130, rad = v.a * Math.PI / 180;
          var dx = sep / Math.tan(rad), Tx = cx - dx / 2, Bx = cx + dx / 2;
          var vx = Bx - Tx, L = Math.sqrt(vx * vx + sep * sep), ux = vx / L, uy = sep / L, ext = 30;
          var g = '<line x1="20" y1="' + y1 + '" x2="240" y2="' + y1 + '" stroke="' + SOFT + '" stroke-width="1.5"/>' +
            '<line x1="20" y1="' + y2 + '" x2="240" y2="' + y2 + '" stroke="' + SOFT + '" stroke-width="1.5"/>';
          g += '<line x1="' + (Tx - ux * ext).toFixed(1) + '" y1="' + (y1 - uy * ext).toFixed(1) + '" x2="' + (Bx + ux * ext).toFixed(1) + '" y2="' + (y2 + uy * ext).toFixed(1) + '" stroke="' + BRAND + '" stroke-width="2"/>';
          g += '<circle cx="' + Tx.toFixed(1) + '" cy="' + y1 + '" r="3" fill="' + INK + '"/><circle cx="' + Bx.toFixed(1) + '" cy="' + y2 + '" r="3" fill="' + INK + '"/>';
          var bx = 1 + ux, by = uy, bl = Math.sqrt(bx * bx + by * by);
          g += txt((Tx + bx / bl * 26).toFixed(1), (y1 + by / bl * 26 + 4).toFixed(1), v.a + '&deg;', 'middle', 12, BAD, true);
          g += txt((Bx + bx / bl * 26).toFixed(1), (y2 + by / bl * 26 + 4).toFixed(1), v.a + '&deg;', 'middle', 12, BRAND, true);
          return svg(260, 132, g, 'a transversal crossing two parallel lines, both corresponding angles ' + v.a + ' degrees') +
            cap('Both marked angles are ' + v.a + '&deg; &mdash; corresponding (F) angles between parallel lines are equal.') +
            note('Slide the angle: the two stay locked together, because the parallel lines never change direction.');
        }
        var W = 260, ox = W / 2, oy = 92, len = 100, rd = v.a * Math.PI / 180;
        var g2 = '<line x1="' + (ox - len) + '" y1="' + oy + '" x2="' + (ox + len) + '" y2="' + oy + '" stroke="' + SOFT + '" stroke-width="2"/>';
        g2 += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + len * Math.cos(rd)).toFixed(1) + '" y2="' + (oy - len * Math.sin(rd)).toFixed(1) + '" stroke="' + BRAND + '" stroke-width="2.5"/>';
        g2 += '<circle cx="' + ox + '" cy="' + oy + '" r="3.5" fill="' + INK + '"/>';
        var la = (v.a / 2) * Math.PI / 180, lb = ((180 + v.a) / 2) * Math.PI / 180;
        g2 += txt((ox + 52 * Math.cos(la)).toFixed(1), (oy - 52 * Math.sin(la) + 4).toFixed(1), v.a + '&deg;', 'middle', 13, BAD, true);
        g2 += txt((ox + 52 * Math.cos(lb)).toFixed(1), (oy - 52 * Math.sin(lb) + 4).toFixed(1), (180 - v.a) + '&deg;', 'middle', 13, BRAND, true);
        return svg(W, 104, g2, 'two angles on a straight line: ' + v.a + ' and ' + (180 - v.a) + ' degrees') +
          cap(v.a + '&deg; + ' + (180 - v.a) + '&deg; = 180&deg; — always') +
          note('One grows exactly as fast as the other shrinks: they are supplementary.');
      }
    },

    shapes: {
      kind: 'sort', intro: 'Classify each triangle by its three side lengths. Click a card, then click its group.',
      buckets: ['Equilateral<br><small>(all sides equal)</small>', 'Isosceles<br><small>(two sides equal)</small>', 'Scalene<br><small>(no sides equal)</small>'],
      cards: [
        { t: '6, 6, 6', b: 0 }, { t: '4, 4, 4', b: 0 },
        { t: '5, 5, 8', b: 1 }, { t: '7, 10, 7', b: 1 },
        { t: '3, 7, 9', b: 2 }, { t: '6, 8, 11', b: 2 }
      ]
    },

    transformations: {
      kind: 'slider', intro: 'Move a point, pick a transformation, and watch its image — rigid motions never change size or shape.',
      sliders: [
        { id: 'x', label: 'Point x', min: -5, max: 5, step: 1, val: 3 },
        { id: 'y', label: 'Point y', min: -5, max: 5, step: 1, val: 2 },
        { id: 'tf', label: 'Transformation', min: 0, max: 4, step: 1, val: 0, fmt: function (i) { return ['reflect x-axis', 'reflect y-axis', 'rotate 180°', 'rotate 90° cw', 'rotate 90° ccw'][i]; } }
      ],
      render: function (v) {
        var names = ['reflect in the x-axis', 'reflect in the y-axis', 'rotate 180&deg;', 'rotate 90&deg; clockwise', 'rotate 90&deg; anticlockwise'];
        var rules = ['(x, y) &rarr; (x, &minus;y)', '(x, y) &rarr; (&minus;x, y)', '(x, y) &rarr; (&minus;x, &minus;y)', '(x, y) &rarr; (y, &minus;x)', '(x, y) &rarr; (&minus;y, x)'];
        var nx, ny;
        switch (v.tf) { case 0: nx = v.x; ny = -v.y; break; case 1: nx = -v.x; ny = v.y; break; case 2: nx = -v.x; ny = -v.y; break; case 3: nx = v.y; ny = -v.x; break; default: nx = -v.y; ny = v.x; }
        var S = 210, p = 14, u = (S - 2 * p) / 12, cx = S / 2, cy = S / 2;
        var X = function (a) { return cx + a * u; }, Y = function (a) { return cy - a * u; };
        var g = '';
        for (var i = -5; i <= 5; i++) g += '<line x1="' + X(i) + '" y1="' + p + '" x2="' + X(i) + '" y2="' + (S - p) + '" stroke="#E4E8F2"/><line x1="' + p + '" y1="' + Y(i) + '" x2="' + (S - p) + '" y2="' + Y(i) + '" stroke="#E4E8F2"/>';
        g += '<line x1="' + p + '" y1="' + cy + '" x2="' + (S - p) + '" y2="' + cy + '" stroke="' + SOFT + '" stroke-width="1.5"/><line x1="' + cx + '" y1="' + p + '" x2="' + cx + '" y2="' + (S - p) + '" stroke="' + SOFT + '" stroke-width="1.5"/>';
        g += '<line x1="' + X(v.x) + '" y1="' + Y(v.y) + '" x2="' + X(nx) + '" y2="' + Y(ny) + '" stroke="' + TINT + '" stroke-dasharray="3 3"/>';
        g += '<circle cx="' + X(v.x) + '" cy="' + Y(v.y) + '" r="5" fill="' + MARI + '" stroke="' + INK + '"/>' + txt(X(v.x) + 9, Y(v.y) - 6, 'P', 'start', 11, INK, true);
        g += '<circle cx="' + X(nx) + '" cy="' + Y(ny) + '" r="5" fill="#fff" stroke="' + BRAND + '" stroke-width="2"/>' + txt(X(nx) + 9, Y(ny) - 6, "P'", 'start', 11, BRAND, true);
        return svg(S, S, g, names[v.tf] + ' of a point') +
          cap(names[v.tf] + ': ' + rules[v.tf] + ' &nbsp;&rarr;&nbsp; P(' + v.x + ', ' + v.y + ') &rarr; P&rsquo;(' + nx + ', ' + ny + ')') +
          note('P&rsquo; stays the same distance from the origin as P — a rigid motion moves a shape without resizing it.');
      }
    },

    pythagoras: {
      kind: 'slider', intro: 'Set the two legs; the hypotenuse follows. Hunt for whole-number triples!',
      sliders: [
        { id: 'a', label: 'Leg a', min: 3, max: 12, step: 1, val: 3 },
        { id: 'b', label: 'Leg b', min: 3, max: 12, step: 1, val: 4 }
      ],
      render: function (v) {
        var c2 = v.a * v.a + v.b * v.b, c = Math.sqrt(c2), whole = Math.abs(c - Math.round(c)) < 1e-9;
        var sc = 100 / 12, aw = v.a * sc * 1.6, bh = v.b * sc * 1.4, ox = 40, oy = 128;
        var g = '<polygon points="' + ox + ',' + oy + ' ' + (ox + aw) + ',' + oy + ' ' + ox + ',' + (oy - bh) + '" fill="' + TINT + '" stroke="' + BRAND + '" stroke-width="1.5"/>' +
          '<path d="M' + (ox + 11) + ',' + oy + ' L' + (ox + 11) + ',' + (oy - 11) + ' L' + ox + ',' + (oy - 11) + '" fill="none" stroke="' + INK + '"/>' +
          txt(ox + aw / 2, oy + 15, 'a = ' + v.a, 'middle', 11, INK, true) +
          txt(ox - 6, oy - bh / 2, 'b = ' + v.b, 'end', 11, INK, true) +
          txt(ox + aw / 2 + 10, oy - bh / 2 - 8, 'c', 'start', 11, BAD, true);
        return svg(230, 150, g, 'right triangle with legs ' + v.a + ' and ' + v.b) +
          cap('c&sup2; = ' + v.a + '&sup2; + ' + v.b + '&sup2; = ' + c2 + ' &nbsp;&rarr;&nbsp; c = ' + (whole ? Math.round(c) : '&asymp; ' + c.toFixed(2))) +
          note(whole ? '&#10024; A whole-number Pythagorean triple: ' + v.a + '-' + v.b + '-' + Math.round(c) + '!' : 'Not a whole number — most leg pairs aren&rsquo;t. Try 6 and 8, or 5 and 12.');
      }
    },

    circles: {
      kind: 'slider', intro: 'One slider controls everything about a circle. Watch C grow steadily while A accelerates.',
      sliders: [{ id: 'r', label: 'Radius', min: 1, max: 10, step: 1, val: 5 }],
      render: function (v) {
        var R = v.r * 10, S = 220;
        var g = '<circle cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + R + '" fill="' + TINT + '" fill-opacity=".45" stroke="' + BRAND + '" stroke-width="2"/>' +
          '<line x1="' + S / 2 + '" y1="' + S / 2 + '" x2="' + (S / 2 + R) + '" y2="' + S / 2 + '" stroke="' + INK + '" stroke-width="1.5"/>' +
          '<circle cx="' + S / 2 + '" cy="' + S / 2 + '" r="3" fill="' + INK + '"/>' +
          txt(S / 2 + R / 2, S / 2 - 6, 'r = ' + v.r, 'middle', 11, INK, true);
        return svg(S, S, g, 'circle of radius ' + v.r) +
          cap('C = 2&pi;r &asymp; ' + (2 * Math.PI * v.r).toFixed(1) + ' &nbsp;|&nbsp; A = &pi;r&sup2; &asymp; ' + (Math.PI * v.r * v.r).toFixed(1)) +
          note('Double the radius and C doubles — but A quadruples. That&rsquo;s the r&sup2; at work.');
      }
    },

    'perimeter-area': {
      kind: 'slider', intro: 'Stretch a rectangle and watch perimeter and area move independently.',
      sliders: [
        { id: 'l', label: 'Length', min: 1, max: 10, step: 1, val: 5 },
        { id: 'w', label: 'Width', min: 1, max: 10, step: 1, val: 3 }
      ],
      render: function (v) {
        var s = 17, g = '';
        for (var r = 0; r < v.w; r++) for (var c = 0; c < v.l; c++)
          g += '<rect x="' + (c * s + 1) + '" y="' + (r * s + 1) + '" width="' + (s - 2) + '" height="' + (s - 2) + '" rx="2" fill="' + MARI_BG + '" stroke="#C9791A"/>';
        return svg(v.l * s + 2, v.w * s + 2, g, 'a ' + v.l + ' by ' + v.w + ' rectangle of unit squares') +
          cap('P = 2 &times; (' + v.l + ' + ' + v.w + ') = ' + (2 * (v.l + v.w)) + ' &nbsp;|&nbsp; A = ' + v.l + ' &times; ' + v.w + ' = ' + (v.l * v.w)) +
          note('Find a second rectangle with the SAME perimeter but a different area — there are several.');
      }
    },

    volume: {
      kind: 'slider', intro: 'Volume is layers of a base: count one layer, then stack.',
      sliders: [
        { id: 'l', label: 'Length', min: 1, max: 6, step: 1, val: 3 },
        { id: 'w', label: 'Width', min: 1, max: 6, step: 1, val: 2 },
        { id: 'h', label: 'Height (layers)', min: 1, max: 6, step: 1, val: 4 }
      ],
      render: function (v) {
        var g = '', H = v.h * 24 + 14;
        for (var i = 0; i < v.h; i++) {
          var y = H - 24 - i * 22, x = 10 + i * 7;
          g += '<rect x="' + x + '" y="' + y + '" width="120" height="20" rx="4" fill="rgba(59,76,168,.12)" stroke="' + BRAND + '"/>' +
            txt(x + 60, y + 14, v.l + ' &times; ' + v.w + ' = ' + (v.l * v.w) + ' cubes', 'middle', 10, INK);
        }
        return svg(190, H, g, v.h + ' layers of ' + (v.l * v.w) + ' unit cubes') +
          cap('V = ' + v.l + ' &times; ' + v.w + ' &times; ' + v.h + ' = ' + (v.l * v.w * v.h) + ' cubes') +
          note('Base area ' + (v.l * v.w) + ', stacked ' + v.h + ' high — the prism rule V = base &times; height.');
      }
    },

    // The whole idea of unit conversion is that the QUANTITY is fixed and only the unit (and so the
    // count) changes. The bar below is therefore drawn at a constant width no matter which unit is
    // selected — the number beside it moves by powers of ten while the length visibly does not.
    conversions: {
      kind: 'slider', intro: 'One real length, four unit costumes. Drag the second slider to read the <em>same</em> bar in a different unit.',
      sliders: [
        { id: 'm', label: 'Length in metres', min: 0, max: 2000, step: 50, val: 750 },
        { id: 'u', label: 'Read it as', min: 1, max: 4, step: 1, val: 2, fmt: function (x) { return CONV_UNITS[x - 1].name; } }
      ],
      render: function (v) {
        var sel = CONV_UNITS[v.u - 1];
        var bx0 = 16, bx1 = 284, by = 26, bh = 17;
        var g = txt(150, 17, 'the same real length, whichever unit you use', 'middle', 9.5, SOFT);
        g += '<rect x="' + bx0 + '" y="' + by + '" width="' + (bx1 - bx0) + '" height="' + bh + '" rx="4" fill="' + TINT + '" stroke="' + BRAND + '" stroke-width="1.5"/>';
        // End-stops make it obvious the bar is pinned to the same two points every time.
        g += '<line x1="' + bx0 + '" y1="' + (by - 5) + '" x2="' + bx0 + '" y2="' + (by + bh + 5) + '" stroke="' + BRAND + '" stroke-width="1.5"/>';
        g += '<line x1="' + bx1 + '" y1="' + (by - 5) + '" x2="' + bx1 + '" y2="' + (by + bh + 5) + '" stroke="' + BRAND + '" stroke-width="1.5"/>';

        var y0 = 74, gap = 31;
        // The selected row's highlight is painted before any rung text, otherwise it covers the
        // "x1000" label belonging to the rung above it. It also stops short of the arrow column.
        var selY = y0 + (v.u - 1) * gap;
        g += '<rect x="10" y="' + (selY - 16) + '" width="205" height="25" rx="7" fill="' + MARI_BG + '" stroke="' + MARI + '"/>';
        CONV_UNITS.forEach(function (u, i) {
          var y = y0 + i * gap, on = (i === v.u - 1);
          g += txt(46, y, u.name, 'end', 13, on ? INK : SOFT, true);
          g += txt(172, y, convNum(v.m * u.per), 'end', 13.5, on ? INK : SOFT, true);
          g += txt(178, y, u.name, 'start', 10.5, SOFT);
          // Each rung is a clean power of ten away from the next. The factor is rounded because
          // `per` holds 0.001 for km, and 1/0.001 is 1000.0000000000001 in binary floating point.
          if (i < CONV_UNITS.length - 1) {
            g += '<path d="M228 ' + (y + 4) + ' V' + (y + gap - 9) + '" stroke="' + SOFT + '" stroke-width="1"/>';
            g += '<path d="M225 ' + (y + gap - 13) + ' l3 4 l3 -4" fill="none" stroke="' + SOFT + '" stroke-width="1"/>';
            g += txt(236, y + gap / 2 + 1, '&#215;' + Math.round(CONV_UNITS[i + 1].per / u.per), 'start', 9.5, SOFT);
          }
        });
        return svg(300, y0 + 3 * gap + 18, g, 'The same length labelled in kilometres, metres, centimetres and millimetres') +
          '<div class="ex-num">' + convNum(v.m * sel.per) + ' ' + sel.name + '</div>' +
          note('The bar never moved &mdash; only its name and its count did. Every rung is one clean power of ten, so converting is only ever shifting the digits.');
      }
    },

    statistics: {
      kind: 'slider', intro: 'The data set is 2, 3, 3 and one value YOU control. Watch which average flinches.',
      sliders: [{ id: 'x', label: 'Fourth value', min: 3, max: 50, step: 1, val: 10 }],
      render: function (v) {
        var mean = (8 + v.x) / 4;
        var X = function (n) { return 12 + n * 6; };
        var g = '<line x1="' + X(0) + '" y1="34" x2="' + X(50) + '" y2="34" stroke="' + SOFT + '"/>';
        [0, 10, 20, 30, 40, 50].forEach(function (i) { g += '<line x1="' + X(i) + '" y1="30" x2="' + X(i) + '" y2="38" stroke="' + SOFT + '"/>' + txt(X(i), 52, i, 'middle', 9, SOFT); });
        g += '<circle cx="' + X(2) + '" cy="24" r="4" fill="' + BRAND + '"/><circle cx="' + X(3) + '" cy="24" r="4" fill="' + BRAND + '"/><circle cx="' + X(3) + '" cy="14" r="4" fill="' + BRAND + '"/>';
        g += '<circle cx="' + X(v.x) + '" cy="24" r="4" fill="' + BAD + '"/>';
        g += '<line x1="' + X(mean) + '" y1="8" x2="' + X(mean) + '" y2="34" stroke="' + BAD + '" stroke-dasharray="3 3" stroke-width="1.5"/>';
        g += '<line x1="' + X(3) + '" y1="8" x2="' + X(3) + '" y2="10" stroke="' + GOOD + '" stroke-width="3"/>';
        return svg(320, 58, g, 'dot plot of 2, 3, 3 and ' + v.x + ' with the mean marked') +
          cap('Data: 2, 3, 3, ' + v.x + ' &nbsp;&rarr;&nbsp; mean ' + mean.toFixed(2) + ' &nbsp;|&nbsp; median 3 &nbsp;|&nbsp; mode 3 &nbsp;|&nbsp; range ' + (v.x - 2)) +
          note('Drag the outlier to 50: the mean chases it and the range grows (spread), but the median and mode never move (centre).');
      }
    },

    probability: {
      kind: 'slider', intro: 'Build a bag of marbles and read off the probability.',
      sliders: [
        { id: 'r', label: 'Red marbles', min: 0, max: 10, step: 1, val: 3 },
        { id: 'b', label: 'Blue marbles', min: 0, max: 10, step: 1, val: 5 }
      ],
      render: function (v) {
        var total = v.r + v.b;
        if (!total) return cap('The bag is empty — add some marbles!');
        var g = '';
        for (var i = 0; i < total; i++) {
          g += '<circle cx="' + (16 + (i % 10) * 26) + '" cy="' + (14 + Math.floor(i / 10) * 26) + '" r="10" fill="' + (i < v.r ? BAD : BRAND) + '" stroke="#fff" stroke-width="1.5"/>';
        }
        var gg = gcd(v.r, total);
        var frac = v.r + '&frasl;' + total + (gg > 1 && v.r > 0 ? ' = ' + (v.r / gg) + '&frasl;' + (total / gg) : '');
        return svg(276, 14 + Math.ceil(total / 10) * 26, g, v.r + ' red and ' + v.b + ' blue marbles') +
          cap('P(red) = ' + frac + ' &asymp; ' + Math.round(100 * v.r / total) + '%') +
          note(v.r === 0 ? 'P = 0: impossible.' : v.b === 0 ? 'P = 1: certain.' : 'P(blue) = ' + v.b + '&frasl;' + total + ' — and the two probabilities always total 1.');
      }
    }
  };

  /* ---------- challenges ----------
     The Explore section tells the reader to "predict what will happen first, then drag", but with
     nothing to aim at there was no prediction to make: 21 of the 24 widgets were drag-and-observe.
     A challenge gives the sliders a goal, so exploring becomes a puzzle with a win state.

     Each entry is { ask, ok } where ok(v) receives exactly the slider values render() gets. Keep the
     goals reachable from the slider ranges above, and reachable in more than one way where the maths
     allows it — the point is to search, not to guess one magic setting. */
  var CHALLENGES = {
    /* The three card sorts get goals too, checked when the reader presses Check. Their ok() receives
       a placement summary rather than slider values:
         { total, placed, correct, wrong, buckets[], correctIn[] }
       where buckets[i] counts the cards sitting in bucket i and correctIn[i] how many of those
       belong there. The second goal in each is deliberately a *partial* sort — fill one group
       exactly and leave the rest in the tray — because isolating a single category is a sharper test
       of the classification than shuffling every card into place. */
    operations: [
      {
        ask: 'Put <b>every</b> card into the right group, then press Check.',
        ok: function (s) { return s.correct === s.total; }
      },
      {
        ask: 'Now clear the board and fill <b>only</b> the &ldquo;Brackets first&rdquo; group &mdash; both bracket cards there, every other card left in the tray.',
        ok: function (s) { return s.placed === 2 && s.buckets[1] === 2 && s.correctIn[1] === 2; }
      }
    ],

    factors: [
      {
        ask: 'Sort all eight numbers into Prime or Composite, then press Check.',
        ok: function (s) { return s.correct === s.total; }
      },
      {
        ask: 'Now clear the board and fill <b>only</b> the Prime group &mdash; all four primes in it, every composite left in the tray.',
        ok: function (s) { return s.placed === 4 && s.buckets[0] === 4 && s.correctIn[0] === 4; }
      }
    ],

    shapes: [
      {
        ask: 'Classify all six triangles by their sides, then press Check.',
        ok: function (s) { return s.correct === s.total; }
      },
      {
        ask: 'Now clear the board and place <b>only</b> the two isosceles triangles in their group, leaving everything else in the tray.',
        ok: function (s) { return s.placed === 2 && s.buckets[1] === 2 && s.correctIn[1] === 2; }
      }
    ],

    'place-value': [
      {
        ask: 'Build a number that rounds <b>up</b> to 4,000 when you round to the nearest 1000.',
        ok: function (v) {
          var n = 1000 * v.th + 100 * v.h + 10 * v.t + v.o;
          if (v.rp !== 3) return false;
          var lower = Math.floor(n / 1000) * 1000;
          return n < 4000 && (n - lower >= 500 ? lower + 1000 : lower) === 4000;
        }
      },
      {
        ask: 'Make a number whose four digits add up to exactly <b>25</b>.',
        ok: function (v) { return v.th + v.h + v.t + v.o === 25; }
      }
    ],

    fractions: [
      {
        ask: 'Make A and B <b>equivalent</b> &mdash; same amount, different denominators.',
        ok: function (v) {
          var a = Math.min(v.n1, v.d1) / v.d1, b = Math.min(v.n2, v.d2) / v.d2;
          return v.n1 > 0 && v.d1 !== v.d2 && Math.abs(a - b) < 1e-9;
        }
      },
      {
        ask: 'Make A <b>bigger</b> than B, using a smaller top number on A than on B.',
        ok: function (v) {
          var a = Math.min(v.n1, v.d1) / v.d1, b = Math.min(v.n2, v.d2) / v.d2;
          return a > b && v.n1 < v.n2;
        }
      }
    ],

    decimals: [
      { ask: 'Shade exactly <b>12</b> of the 100 small squares.', ok: function (v) { return v.a * v.b === 12; } },
      { ask: 'Make the product bigger than <b>0.5</b>.', ok: function (v) { return v.a * v.b > 50; } }
    ],

    percentages: [
      { ask: 'Shade <b>three quarters</b> of the grid.', ok: function (v) { return v.p === 75; } },
      { ask: 'Find the percentage that equals the fraction <b>2&frasl;5</b>.', ok: function (v) { return v.p === 40; } }
    ],

    ratios: [
      {
        ask: 'Split the bar so the first part is exactly <b>a quarter</b> of the whole.',
        ok: function (v) { return v.a / (v.a + v.b) === 0.25; }
      },
      {
        ask: 'Make a ratio that <b>simplifies to 1 : 2</b> without already being 1 : 2.',
        ok: function (v) { var g = gcd(v.a, v.b); return v.a / g === 1 && v.b / g === 2 && g > 1; }
      }
    ],

    integers: [
      {
        ask: 'Land exactly on <b>0</b> by <b>subtracting a negative</b> number.',
        ok: function (v) { return v.op === 1 && v.n < 0 && v.s - v.n === 0; }
      },
      {
        ask: 'Start <b>above</b> zero and finish <b>below &minus;5</b>.',
        ok: function (v) { return v.s > 0 && v.s + (v.op ? -v.n : v.n) < -5; }
      }
    ],

    powers: [
      {
        ask: 'Make the value exactly <b>1</b> &mdash; then check every base does it the same way.',
        ok: function (v) { return Math.pow(v.b, v.e) === 1 && v.e === 0; }
      },
      { ask: 'Build a power greater than <b>1000</b>.', ok: function (v) { return Math.pow(v.b, v.e) > 1000; } }
    ],

    patterns: [
      {
        ask: 'Match the <b>mystery sequence</b> with your rule.',
        ok: function (v) { return v.d === patTarget.d && v.c === patTarget.c; }
      },
      {
        ask: 'Build a rule whose <b>10th term is exactly 50</b>.',
        ok: function (v) { return v.d * 10 + v.c === 50; }
      }
    ],

    expressions: [
      {
        ask: 'Make the machine output exactly <b>30</b> when the input x is <b>7</b>.',
        ok: function (v) { return v.x === 7 && v.a * v.x + v.b === 30; }
      },
      {
        ask: 'Set a <b>$0 flagfall</b> and still reach an output of exactly <b>24</b>.',
        ok: function (v) { return v.b === 0 && v.a * v.x === 24; }
      }
    ],

    equations: [
      { ask: 'Balance the scale &mdash; find the x that solves x + 4 = 10.', ok: function (v) { return v.x + 4 === 10; } },
      { ask: 'Now make the left pan exactly <b>2 heavier</b> than the right.', ok: function (v) { return v.x + 4 - 10 === 2; } }
    ],

    inequalities: [
      {
        ask: 'Choose a sign that makes the test value <b>x = 7</b> a true solution.',
        ok: function (v) { return v.x === 7 && (v.sym === 1 || v.sym === 3); }
      },
      {
        ask: 'Shade the region to the <b>left</b>, and pick a test value that comes out <b>false</b>.',
        ok: function (v) {
          var lt = v.sym === 0 || v.sym === 1;
          var ok = v.sym === 0 ? v.x < 7 : v.sym === 1 ? v.x <= 7 : v.sym === 2 ? v.x > 7 : v.x >= 7;
          return lt && !ok;
        }
      }
    ],

    graphs: [
      {
        ask: 'Draw a line that runs <b>downhill</b> and crosses the y-axis <b>below</b> zero.',
        ok: function (v) { return v.m < 0 && v.c < 0; }
      },
      { ask: 'Make a <b>flat</b> line sitting at height 3.', ok: function (v) { return v.m === 0 && v.c === 3; } }
    ],

    angles: [
      {
        ask: 'On the straight line, make the <b>two angles equal</b>.',
        ok: function (v) { return v.m === 0 && v.a === 90; }
      },
      {
        ask: 'Switch to the parallel lines and make both marked angles <b>acute</b>.',
        ok: function (v) { return v.m === 1 && v.a < 90; }
      }
    ],

    transformations: [
      {
        ask: 'Find a point that a <b>reflection in the x-axis leaves exactly where it was</b>.',
        ok: function (v) { return v.tf === 0 && v.y === 0; }
      },
      {
        ask: 'Use a <b>rotation</b> (not a reflection) to send P to <b>(2, 3)</b>.',
        ok: function (v) {
          var nx, ny;
          switch (v.tf) {
            case 0: nx = v.x; ny = -v.y; break;
            case 1: nx = -v.x; ny = v.y; break;
            case 2: nx = -v.x; ny = -v.y; break;
            case 3: nx = v.y; ny = -v.x; break;
            default: nx = -v.y; ny = v.x;
          }
          return v.tf >= 2 && nx === 2 && ny === 3;
        }
      }
    ],

    pythagoras: [
      {
        ask: 'You start on 3-4-5. Find a <b>different</b> pair of legs that still gives a whole-number hypotenuse.',
        ok: function (v) {
          var c = Math.sqrt(v.a * v.a + v.b * v.b);
          var isThreeFour = Math.min(v.a, v.b) === 3 && Math.max(v.a, v.b) === 4;
          return !isThreeFour && Math.abs(c - Math.round(c)) < 1e-9;
        }
      },
      {
        ask: 'Find the pair of legs whose hypotenuse is exactly <b>13</b>.',
        ok: function (v) { return v.a * v.a + v.b * v.b === 169; }
      }
    ],

    circles: [
      {
        ask: 'Find the one radius where the <b>area and circumference are the same number</b>.',
        ok: function (v) { return Math.abs(Math.PI * v.r * v.r - 2 * Math.PI * v.r) < 1e-9; }
      },
      { ask: 'Push the circumference past <b>50</b>.', ok: function (v) { return 2 * Math.PI * v.r > 50; } }
    ],

    'perimeter-area': [
      {
        ask: 'Build a rectangle with perimeter <b>16</b> and area <b>12</b>.',
        ok: function (v) { return 2 * (v.l + v.w) === 16 && v.l * v.w === 12; }
      },
      {
        ask: 'Make an area of exactly <b>24</b> with the <b>smallest possible perimeter</b>.',
        ok: function (v) { return v.l * v.w === 24 && 2 * (v.l + v.w) === 20; }
      }
    ],

    volume: [
      { ask: 'Build a <b>cube</b> &mdash; every edge the same length.', ok: function (v) { return v.l === v.w && v.w === v.h; } },
      { ask: 'Make a volume of exactly <b>36</b> cubes.', ok: function (v) { return v.l * v.w * v.h === 36; } }
    ],

    conversions: [
      { ask: 'Show a length of <b>1.5 km</b>, read in kilometres.', ok: function (v) { return v.m === 1500 && v.u === 1; } },
      { ask: 'Read a length as <b>25,000 cm</b>.', ok: function (v) { return v.m === 250 && v.u === 3; } }
    ],

    statistics: [
      {
        ask: 'Drag the fourth value until the <b>mean is exactly double the median</b>.',
        ok: function (v) { return (8 + v.x) / 4 === 6; }
      },
      { ask: 'Make the <b>range</b> exactly 30.', ok: function (v) { return v.x - 2 === 30; } }
    ],

    probability: [
      {
        ask: 'Fill the bag so that P(red) is exactly <b>&frac14;</b>.',
        ok: function (v) { return v.r + v.b > 0 && v.r / (v.r + v.b) === 0.25; }
      },
      {
        ask: 'Make red and blue <b>equally likely</b>, with more than 6 marbles in the bag.',
        ok: function (v) { return v.r === v.b && v.r + v.b > 6; }
      }
    ]
  };

  /* ---------- runtime ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }


  // A challenge is solved once, and stays solved: the flag is what lets a returning reader pick up at
  // the next one instead of re-doing the first. XP is awarded on the same flag, so a challenge cannot
  // be farmed by wiggling a slider back and forth.
  function buildChallenge(host, topicId) {
    var list = CHALLENGES[topicId];
    if (!list || !list.length) return null;
    var PS = window.ProgressStore;
    var key = function (i) { return 'explore|' + topicId + '|' + i; };
    var done = function (i) { return PS ? PS.getFlag(key(i)) : false; };

    var idx = 0;
    while (idx < list.length - 1 && done(idx)) idx++;

    var card = el('div', 'ex-challenge');
    card.innerHTML = '<span class="ex-ch-tag"></span><p class="ex-ch-ask"></p>' +
      '<p class="ex-ch-status" role="status"></p>' +
      '<button class="ex-ch-next" type="button" hidden>Next challenge &rarr;</button>';
    var tag = card.querySelector('.ex-ch-tag');
    var ask = card.querySelector('.ex-ch-ask');
    var status = card.querySelector('.ex-ch-status');
    var next = card.querySelector('.ex-ch-next');

    function show() {
      var solved = done(idx);
      tag.innerHTML = '&#127919; Challenge ' + (idx + 1) + ' of ' + list.length;
      ask.innerHTML = list[idx].ask;
      card.classList.toggle('solved', solved);
      status.innerHTML = solved
        ? '&#10003; Solved earlier &mdash; move the sliders to see it again.'
        : 'Move the sliders until this is true.';
      next.hidden = !(solved && idx < list.length - 1);
      if (solved && idx === list.length - 1) {
        status.innerHTML = '&#127881; Every challenge in this chapter is solved.';
      }
    }

    next.addEventListener('click', function () {
      if (idx < list.length - 1) { idx++; show(); }
    });

    host.appendChild(card);
    show();

    return function check(v) {
      var was = done(idx);
      var hit = false;
      // A broken challenge must never break the widget it sits on.
      try { hit = !!list[idx].ok(v); } catch (e) { return; }
      if (!hit) {
        if (!was) { card.classList.remove('solved'); status.innerHTML = 'Move the sliders until this is true.'; }
        return;
      }
      card.classList.add('solved');
      status.innerHTML = was
        ? '&#10003; That works.'
        : '&#127881; <b>Solved!</b> +3 XP';
      if (!was && PS) { PS.setFlag(key(idx), true); PS.addXp(3); }
      next.hidden = idx >= list.length - 1;
      if (idx >= list.length - 1 && !was) status.innerHTML = '&#127881; <b>Solved!</b> +3 XP &mdash; that was the last one.';
      card.classList.remove('just-solved');
      void card.offsetWidth;
      if (!was) card.classList.add('just-solved');
    };
  }

  function buildSliders(host, spec, topicId) {
    var checkChallenge = buildChallenge(host, topicId);
    var controls = el('div', 'ex-controls');
    var canvas = el('div', 'ex-canvas');
    var inputs = {};
    spec.sliders.forEach(function (s) {
      var ctl = el('label', 'ex-ctl');
      ctl.innerHTML = '<span>' + s.label + ': <b class="ex-val"></b></span>';
      var input = document.createElement('input');
      input.type = 'range'; input.min = s.min; input.max = s.max; input.step = s.step; input.value = s.val;
      input.setAttribute('aria-label', s.label);
      ctl.appendChild(input);
      inputs[s.id] = { input: input, val: ctl.querySelector('.ex-val'), fmt: s.fmt };
      controls.appendChild(ctl);
    });
    function update() {
      var v = {};
      // NOTE: this is a textContent sink, so a spec's fmt() must return PLAIN TEXT — write '≤' and
      // '°', never '&le;'/'&deg;', or the entity shows up verbatim in the slider label. (Entities are
      // still correct inside render(), which goes through innerHTML.)
      Object.keys(inputs).forEach(function (k) { var raw = Number(inputs[k].input.value); v[k] = raw; inputs[k].val.textContent = inputs[k].fmt ? inputs[k].fmt(raw) : inputs[k].input.value; });
      canvas.innerHTML = spec.render(v);
      if (checkChallenge) checkChallenge(v);
    }
    Object.keys(inputs).forEach(function (k) { inputs[k].input.addEventListener('input', update); });
    host.appendChild(controls); host.appendChild(canvas);
    update();
  }

  function buildSort(host, spec, topicId) {
    var checkChallenge = buildChallenge(host, topicId);
    var tray = el('div', 'sort-tray');
    var buckets = el('div', 'sort-buckets');
    var actions = el('div', 'sort-actions');
    var selected = null;

    // Shuffle the card order so the answer isn't the layout.
    var cards = spec.cards.slice();
    for (var i = cards.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = cards[i]; cards[i] = cards[j]; cards[j] = t; }

    cards.forEach(function (c) {
      var card = el('button', 'sort-card', c.t);
      card.type = 'button'; card.dataset.b = c.b;
      card.addEventListener('click', function () {
        if (card.parentElement !== tray) { tray.appendChild(card); card.classList.remove('ok', 'no'); return; }
        if (selected) selected.classList.remove('sel');
        selected = (selected === card) ? null : card;
        if (selected) selected.classList.add('sel');
      });
      tray.appendChild(card);
    });

    spec.buckets.forEach(function (label, bi) {
      var bucket = el('div', 'sort-bucket');
      bucket.innerHTML = '<h3>' + label + '</h3>';
      var drop = el('div', 'drop');
      bucket.appendChild(drop);
      bucket.addEventListener('click', function (e) {
        if (e.target.closest('.sort-card')) return; // card clicks handled above
        if (selected) { drop.appendChild(selected); selected.classList.remove('sel'); selected = null; result.textContent = ''; }
      });
      bucket.dataset.bi = bi;
      buckets.appendChild(bucket);
    });

    var checkBtn = el('button', 'btn primary', 'Check my sort');
    checkBtn.type = 'button';
    var result = el('span', 'sort-result');
    checkBtn.addEventListener('click', function () {
      var right = 0, placed = 0;
      var perBucket = spec.buckets.map(function () { return 0; });
      var rightPerBucket = spec.buckets.map(function () { return 0; });
      buckets.querySelectorAll('.sort-bucket').forEach(function (bucket) {
        var bi = Number(bucket.dataset.bi);
        bucket.querySelectorAll('.sort-card').forEach(function (card) {
          placed++;
          perBucket[bi]++;
          var ok = card.dataset.b === bucket.dataset.bi;
          card.classList.toggle('ok', ok); card.classList.toggle('no', !ok);
          if (ok) { right++; rightPerBucket[bi]++; }
        });
      });
      if (checkChallenge) {
        checkChallenge({
          total: spec.cards.length, placed: placed, correct: right, wrong: placed - right,
          buckets: perBucket, correctIn: rightPerBucket
        });
      }
      if (!placed) { result.textContent = 'Sort the cards into groups first — click a card, then a group.'; return; }
      var left = tray.querySelectorAll('.sort-card').length;
      result.innerHTML = right + ' / ' + spec.cards.length + ' correct' + (left ? ' (' + left + ' not sorted yet)' : right === spec.cards.length ? ' — &#127881; perfect!' : ' — click a red card to send it back and retry.');
    });
    actions.appendChild(checkBtn); actions.appendChild(result);

    host.appendChild(tray); host.appendChild(buckets); host.appendChild(actions);
  }

  // Exposed for tests only (see tests/explore-challenges.test.mjs); nothing in the page uses it.
  window.Explore = {
    EXPLORES: EXPLORES, CHALLENGES: CHALLENGES,
    buildChallenge: buildChallenge, buildSort: buildSort, buildSliders: buildSliders
  };

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('explore-widget');
    if (!host) return;
    var spec = EXPLORES[window.CURRENT_TOPIC_ID];
    var section = host.closest('.hf-sec');
    if (!spec) { if (section) section.remove(); return; }
    if (spec.intro) host.appendChild(el('p', 'ex-intro', spec.intro));
    if (spec.kind === 'sort') buildSort(host, spec, window.CURRENT_TOPIC_ID);
    else buildSliders(host, spec, window.CURRENT_TOPIC_ID);
  });
})();
