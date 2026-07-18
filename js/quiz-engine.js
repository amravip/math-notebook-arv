/* js/quiz-engine.js
   Seeded question generators + SVG figure builders for the 6 "generator" chapters (graphs, angles,
   shapes, transformations, pythagoras, circles), which produce fresh randomised questions each time
   the stored seed changes (i.e. after a site-wide Reset), instead of the other 18 chapters' fixed
   pre-written question banks. Preserved verbatim from the original prototype's engine — only the
   seed now persists via ProgressStore (localStorage) instead of an in-page variable. Loaded only on
   these 6 chapter pages, so the other 18 (static) pages stay lighter. */
(function () {
  'use strict';

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var ri = function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); };
  var pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };
  var M = function (s) { return '<span class="m">' + s + '</span>'; };

  /* ---- figure builders (theme-aware SVG), verbatim ---- */
  function coordPlane(R, pts, opts) {
    opts = opts || {}; var S = 210, pad = 18, c = S / 2, u = (c - pad) / R;
    var X = function (v) { return +(c + v * u).toFixed(1); }, Y = function (v) { return +(c - v * u).toFixed(1); };
    var g = '<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--brand)"/></marker></defs>';
    for (var i = -R; i <= R; i++) { g += '<line class="fig-g" x1="' + X(i) + '" y1="' + pad + '" x2="' + X(i) + '" y2="' + (S - pad) + '"/><line class="fig-g" x1="' + pad + '" y1="' + Y(i) + '" x2="' + (S - pad) + '" y2="' + Y(i) + '"/>'; }
    g += '<line class="fig-ax" x1="' + pad + '" y1="' + c + '" x2="' + (S - pad) + '" y2="' + c + '"/><line class="fig-ax" x1="' + c + '" y1="' + pad + '" x2="' + c + '" y2="' + (S - pad) + '"/>';
    g += '<text class="fig-txt soft" x="' + (S - pad + 1) + '" y="' + (c + 13) + '">x</text><text class="fig-txt soft" x="' + (c + 5) + '" y="' + pad + '">y</text>';
    (opts.lines || []).forEach(function (l) { g += '<line class="fig-line" x1="' + X(l.x1) + '" y1="' + Y(l.y1) + '" x2="' + X(l.x2) + '" y2="' + Y(l.y2) + '"/>'; });
    (opts.arrows || []).forEach(function (a) { g += '<line class="fig-arr" x1="' + X(a.x1) + '" y1="' + Y(a.y1) + '" x2="' + X(a.x2) + '" y2="' + Y(a.y2) + '" marker-end="url(#ah)"/>'; });
    pts.forEach(function (p) { g += '<circle class="fig-pt' + (p.hollow ? ' hollow' : '') + '" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5"/>'; if (p.label) g += '<text class="fig-txt" x="' + (X(p.x) + 7) + '" y="' + (Y(p.y) - 6) + '">' + p.label + '</text>'; });
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="215" height="215" role="img" aria-label="coordinate grid">' + g + '</svg>';
  }
  function quadrantChart() {
    var S = 250, pad = 30, c = S / 2, u = (c - pad) / 5, g = '';
    for (var i = -5; i <= 5; i++) { g += '<line class="fig-g" x1="' + (c + i * u) + '" y1="' + pad + '" x2="' + (c + i * u) + '" y2="' + (S - pad) + '"/><line class="fig-g" x1="' + pad + '" y1="' + (c - i * u) + '" x2="' + (S - pad) + '" y2="' + (c - i * u) + '"/>'; }
    g += '<line class="fig-ax" x1="' + pad + '" y1="' + c + '" x2="' + (S - pad) + '" y2="' + c + '"/><line class="fig-ax" x1="' + c + '" y1="' + pad + '" x2="' + c + '" y2="' + (S - pad) + '"/>';
    g += '<text class="fig-txt soft" x="' + (S - pad + 2) + '" y="' + (c + 13) + '">x</text><text class="fig-txt soft" x="' + (c + 5) + '" y="' + pad + '">y</text>';
    var o = (c - pad) / 2, q = function (x, y, rom, sign) { return '<text class="fig-txt" text-anchor="middle" x="' + x + '" y="' + (y - 3) + '">' + rom + '</text><text class="fig-txt soft" text-anchor="middle" x="' + x + '" y="' + (y + 14) + '">' + sign + '</text>'; };
    g += q(c + o, c - o, 'I', '(+, +)') + q(c - o, c - o, 'II', '(−, +)') + q(c - o, c + o, 'III', '(−, −)') + q(c + o, c + o, 'IV', '(+, −)');
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="250" role="img" aria-label="four quadrants">' + g + '</svg>';
  }
  // orient (0-3) rotates/mirrors the triangle so the right angle and hypotenuse aren't always in
  // the same visual corner — real test diagrams vary this, and always drawing it the same way was
  // letting learners practise spotting the hypotenuse in only one fixed layout.
  function rightTri(aL, bL, cL, orient) {
    var W = 230, H = 175, ox = 36, oy = 142, aw = 150, bh = 100;
    var mirrorX = orient === 1 || orient === 3, flipY = orient === 2 || orient === 3;
    var X = function (x) { return mirrorX ? W - x : x; };
    var Y = function (y) { return flipY ? H - y : y; };
    var corner = [X(ox), Y(oy)], right = [X(ox + aw), Y(oy)], top = [X(ox), Y(oy - bh)];
    var raH = mirrorX ? -14 : 14, raV = flipY ? 14 : -14;
    var g = '<polygon class="fig-shape" points="' + corner.join(',') + ' ' + right.join(',') + ' ' + top.join(',') + '"/>';
    g += '<path class="fig-ra" d="M' + (X(ox) + raH) + ',' + Y(oy) + ' L' + (X(ox) + raH) + ',' + (Y(oy) + raV) + ' L' + X(ox) + ',' + (Y(oy) + raV) + '"/>';
    g += '<text class="fig-txt" text-anchor="middle" x="' + X(ox + aw / 2) + '" y="' + (Y(oy) + (flipY ? -10 : 18)) + '">' + aL + '</text>';
    g += '<text class="fig-txt" text-anchor="' + (mirrorX ? 'start' : 'end') + '" x="' + (X(ox) + (mirrorX ? 8 : -6)) + '" y="' + Y(oy - bh / 2 + 4) + '">' + bL + '</text>';
    g += '<text class="fig-txt" text-anchor="' + (mirrorX ? 'end' : 'start') + '" x="' + (X(ox + aw / 2) + (mirrorX ? -8 : 8)) + '" y="' + (Y(oy - bh / 2) + (flipY ? 14 : -6)) + '">' + cL + '</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="225" role="img" aria-label="right-angled triangle">' + g + '</svg>';
  }
  function triFig(a, b, cc) {
    var W = 230, H = 160, A = [30, 135], B = [200, 135], C = [96, 26];
    var g = '<polygon class="fig-shape" points="' + A[0] + ',' + A[1] + ' ' + B[0] + ',' + B[1] + ' ' + C[0] + ',' + C[1] + '"/>';
    g += '<text class="fig-txt ang" x="' + (A[0] + 15) + '" y="' + (A[1] - 11) + '">' + a + '</text>';
    g += '<text class="fig-txt ang" text-anchor="end" x="' + (B[0] - 13) + '" y="' + (B[1] - 11) + '">' + b + '</text>';
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + C[0] + '" y="' + (C[1] + 24) + '">' + cc + '</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="225" role="img" aria-label="triangle with angles">' + g + '</svg>';
  }
  // A triangle with its base extended beyond one vertex, for exterior-angle questions.
  function extTriFig(a, b) {
    var W = 250, H = 160, A = [30, 135], B = [188, 135], C = [100, 26], E = [236, 135];
    var g = '<polygon class="fig-shape" points="' + A[0] + ',' + A[1] + ' ' + B[0] + ',' + B[1] + ' ' + C[0] + ',' + C[1] + '"/>';
    g += '<line class="fig-line" x1="' + B[0] + '" y1="' + B[1] + '" x2="' + E[0] + '" y2="' + E[1] + '"/>';
    g += '<text class="fig-txt ang" x="' + (A[0] + 15) + '" y="' + (A[1] - 11) + '">' + a + '</text>';
    g += '<text class="fig-txt ang" text-anchor="end" x="' + (B[0] - 22) + '" y="' + (B[1] - 11) + '">' + b + '</text>';
    g += '<text class="fig-txt ang" x="' + (B[0] + 10) + '" y="' + (B[1] - 11) + '">x</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="245" role="img" aria-label="triangle with an exterior angle">' + g + '</svg>';
  }
  function polyFig(n) {
    var S = 150, c = S / 2, r = 52, pts = [];
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push((c + r * Math.cos(a)).toFixed(1) + ',' + (c + r * Math.sin(a)).toFixed(1)); }
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="150" role="img" aria-label="' + n + '-sided polygon"><polygon class="fig-shape" points="' + pts.join(' ') + '"/></svg>';
  }
  function miniPoly(cx, cy, r, n, label) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return '<polygon class="fig-shape" points="' + pts.join(' ') + '"/><text class="fig-txt soft" text-anchor="middle" x="' + cx + '" y="' + (cy + r + 17) + '">' + label + '</text>';
  }
  function polyRow() { return '<svg class="viz" viewBox="0 0 300 125" width="285" role="img" aria-label="polygons">' + miniPoly(55, 58, 40, 3, 'triangle') + miniPoly(150, 58, 40, 4, 'quadrilateral') + miniPoly(245, 58, 40, 5, 'pentagon') + '</svg>'; }
  function straightAngle(a) {
    var W = 230, H = 118, ox = W / 2, oy = 88, len = 95, rad = a * Math.PI / 180;
    var g = '<line class="fig-ax" x1="' + (ox - len) + '" y1="' + oy + '" x2="' + (ox + len) + '" y2="' + oy + '"/>';
    g += '<line class="fig-line" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + len * Math.cos(rad)).toFixed(1) + '" y2="' + (oy - len * Math.sin(rad)).toFixed(1) + '"/>';
    g += '<circle class="fig-pt" cx="' + ox + '" cy="' + oy + '" r="3"/>';
    var la = a / 2 * Math.PI / 180, lx = ((180 + a) / 2) * Math.PI / 180;
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + (ox + 48 * Math.cos(la)).toFixed(1) + '" y="' + (oy - 48 * Math.sin(la) + 4).toFixed(1) + '">' + a + '°</text>';
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + (ox + 48 * Math.cos(lx)).toFixed(1) + '" y="' + (oy - 48 * Math.sin(lx) + 4).toFixed(1) + '">x</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="220" role="img" aria-label="angles on a straight line">' + g + '</svg>';
  }
  function complementFig(a) {
    var W = 165, H = 150, ox = 36, oy = 120, len = 96, rad = a * Math.PI / 180;
    var g = '<line class="fig-ax" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + len) + '" y2="' + oy + '"/><line class="fig-ax" x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + (oy - len) + '"/>';
    g += '<path class="fig-ra" d="M' + (ox + 13) + ',' + oy + ' L' + (ox + 13) + ',' + (oy - 13) + ' L' + ox + ',' + (oy - 13) + '"/>';
    g += '<line class="fig-line" x1="' + ox + '" y1="' + oy + '" x2="' + (ox + len * Math.cos(rad)).toFixed(1) + '" y2="' + (oy - len * Math.sin(rad)).toFixed(1) + '"/>';
    var la = a / 2 * Math.PI / 180, lx = ((90 + a) / 2) * Math.PI / 180;
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + (ox + 52 * Math.cos(la)).toFixed(1) + '" y="' + (oy - 52 * Math.sin(la) + 4).toFixed(1) + '">' + a + '°</text>';
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + (ox + 52 * Math.cos(lx)).toFixed(1) + '" y="' + (oy - 52 * Math.sin(lx) + 4).toFixed(1) + '">x</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="160" role="img" aria-label="complementary angles">' + g + '</svg>';
  }
  function aroundPoint(a, b) {
    var S = 190, c = S / 2, len = 70, x = 360 - a - b, vals = [a, b, x], labels = [a + '°', b + '°', 'x'];
    var P = function (deg, rr) { return [+(c + rr * Math.cos(deg * Math.PI / 180)).toFixed(1), +(c - rr * Math.sin(deg * Math.PI / 180)).toFixed(1)]; };
    var g = '<circle class="fig-pt" cx="' + c + '" cy="' + c + '" r="3"/>', start = 90;
    var bounds = [start]; vals.forEach(function (v) { bounds.push(bounds[bounds.length - 1] + v); });
    for (var i = 0; i < 3; i++) { var p = P(bounds[i], len); g += '<line class="fig-line" x1="' + c + '" y1="' + c + '" x2="' + p[0] + '" y2="' + p[1] + '"/>'; }
    var s2 = start; vals.forEach(function (v, i2) { var p = P(s2 + v / 2, len * 0.55); g += '<text class="fig-txt ang" text-anchor="middle" x="' + p[0] + '" y="' + (p[1] + 4) + '">' + labels[i2] + '</text>'; s2 += v; });
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="185" role="img" aria-label="angles around a point">' + g + '</svg>';
  }
  // Two straight lines crossing at a point; xDeg positions the 'x' label (a/2+180 for the vertically
  // opposite wedge, (a+180)/2 for an adjacent wedge) around the crossing so it matches the fact used.
  function crossFig(a, xDeg) {
    var S = 190, c = S / 2, len = 78;
    var P = function (deg, rr) { var rad = deg * Math.PI / 180; return [+(c + rr * Math.cos(rad)).toFixed(1), +(c - rr * Math.sin(rad)).toFixed(1)]; };
    var e1 = P(0, len), e2 = P(180, len), e3 = P(a, len), e4 = P(a + 180, len);
    var g = '<line class="fig-line" x1="' + e1[0] + '" y1="' + e1[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '"/>';
    g += '<line class="fig-line" x1="' + e3[0] + '" y1="' + e3[1] + '" x2="' + e4[0] + '" y2="' + e4[1] + '"/>';
    g += '<circle class="fig-pt" cx="' + c + '" cy="' + c + '" r="3"/>';
    var la = P(a / 2, 46), lx = P(xDeg, 46);
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + la[0] + '" y="' + (la[1] + 4) + '">' + a + '°</text>';
    g += '<text class="fig-txt ang" text-anchor="middle" x="' + lx[0] + '" y="' + (lx[1] + 4) + '">x</text>';
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="185" role="img" aria-label="two crossing straight lines">' + g + '</svg>';
  }
  // Two horizontal parallel lines cut by a transversal; kind picks which named angle 'x' marks.
  function parallelFig(kind) {
    var W = 230, H = 170, T = [94, 50], B = [151, 120];
    var g = '<line class="fig-ax" x1="20" y1="' + T[1] + '" x2="210" y2="' + T[1] + '"/><line class="fig-ax" x1="20" y1="' + B[1] + '" x2="210" y2="' + B[1] + '"/>';
    g += '<line class="fig-line" x1="70" y1="15" x2="175" y2="155"/>';
    g += '<circle class="fig-pt" cx="' + T[0] + '" cy="' + T[1] + '" r="3"/><circle class="fig-pt" cx="' + B[0] + '" cy="' + B[1] + '" r="3"/>';
    g += '<text class="fig-txt ang" x="' + (T[0] + 8) + '" y="' + (T[1] - 8) + '">a</text>';
    var xp = kind === 'corr' ? [B[0] + 8, B[1] - 8] : kind === 'alt' ? [B[0] - 24, B[1] + 18] : [B[0] + 8, B[1] + 18];
    g += '<text class="fig-txt ang" x="' + xp[0] + '" y="' + xp[1] + '">x</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="225" role="img" aria-label="parallel lines cut by a transversal">' + g + '</svg>';
  }
  function quadFig(a, b, cc, dd) {
    var W = 230, H = 160, A = [34, 120], B = [196, 132], C = [184, 30], D = [58, 24];
    var g = '<polygon class="fig-shape" points="' + A[0] + ',' + A[1] + ' ' + B[0] + ',' + B[1] + ' ' + C[0] + ',' + C[1] + ' ' + D[0] + ',' + D[1] + '"/>';
    g += '<text class="fig-txt ang" x="' + (A[0] + 8) + '" y="' + (A[1] - 9) + '">' + a + '</text>';
    g += '<text class="fig-txt ang" text-anchor="end" x="' + (B[0] - 8) + '" y="' + (B[1] - 9) + '">' + b + '</text>';
    g += '<text class="fig-txt ang" text-anchor="end" x="' + (C[0] - 8) + '" y="' + (C[1] + 18) + '">' + cc + '</text>';
    g += '<text class="fig-txt ang" x="' + (D[0] + 8) + '" y="' + (D[1] + 18) + '">' + dd + '</text>';
    return '<svg class="viz" viewBox="0 0 ' + W + ' ' + H + '" width="225" role="img" aria-label="quadrilateral with angles">' + g + '</svg>';
  }
  function circleFig(label, kind) {
    var S = 170, c = S / 2, R = 58;
    var g = '<circle class="fig-shape" cx="' + c + '" cy="' + c + '" r="' + R + '"/><circle class="fig-pt" cx="' + c + '" cy="' + c + '" r="3"/>';
    if (kind === 'd') { g += '<line class="fig-line" x1="' + (c - R) + '" y1="' + c + '" x2="' + (c + R) + '" y2="' + c + '"/><text class="fig-txt" text-anchor="middle" x="' + c + '" y="' + (c - 7) + '">' + label + '</text>'; }
    else if (kind === 'c' || kind === 'a') { g += '<text class="fig-txt" text-anchor="middle" x="' + c + '" y="' + (S - 6) + '">' + label + '</text>'; }
    else { g += '<line class="fig-line" x1="' + c + '" y1="' + c + '" x2="' + (c + R) + '" y2="' + c + '"/><text class="fig-txt" text-anchor="middle" x="' + (c + R / 2) + '" y="' + (c - 7) + '">' + label + '</text>'; }
    return '<svg class="viz" viewBox="0 0 ' + S + ' ' + S + '" width="165" role="img" aria-label="circle">' + g + '</svg>';
  }

  /* ---- generators: each returns {q, steps, ans, accept, fig?}, verbatim ---- */
  var NGON = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 11: 'hendecagon', 12: 'dodecagon' };
  var ROMAN = ['', 'I', 'II', 'III', 'IV'];
  var coordAcc = function (x, y) { return ['(' + x + ',' + y + ')', x + ',' + y]; };

  var GEN = {
    graphs: {
      easy: function (r) {
        if (pick(r, ['quad', 'read']) === 'quad') {
          var x = 0, y = 0; while (x === 0) x = ri(r, -6, 6); while (y === 0) y = ri(r, -6, 6);
          var q = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : 4;
          return { q: 'In which quadrant does the point ' + M('(' + x + ', ' + y + ')') + ' lie? <span class="muted">(Answer 1, 2, 3 or 4.)</span>',
            fig: coordPlane(6, [{ x: x, y: y, label: 'P' }]),
            steps: ['Read the signs: x = ' + M(x) + ' is ' + (x > 0 ? 'positive' : 'negative') + ', y = ' + M(y) + ' is ' + (y > 0 ? 'positive' : 'negative') + '.',
              'Quadrants run anticlockwise from top-right: I (+,+), II (−,+), III (−,−), IV (+,−).',
              'So the point lies in Quadrant ' + M(ROMAN[q]) + '.'],
            ans: M('Quadrant ' + ROMAN[q] + ' (' + q + ')'), accept: [String(q), ROMAN[q], 'quadrant' + q, 'quadrant' + ROMAN[q]] };
        }
        var px = ri(r, -6, 6), py = ri(r, -6, 6);
        return { q: 'What are the coordinates of point ' + M('P') + '?', fig: coordPlane(6, [{ x: px, y: py, label: 'P' }]),
          steps: ['Read across from the origin to find x, then up or down to find y.', 'P is at ' + M('(' + px + ', ' + py + ')') + '.'],
          ans: M('(' + px + ', ' + py + ')'), accept: coordAcc(px, py) };
      },
      medium: function (r) {
        var m = ri(r, 2, 5), c = ri(r, -5, 6), R = 8;
        var loXk = Math.max(-6, Math.ceil((-R - c) / m)), hiXk = Math.min(6, Math.floor((R - c) / m));
        var xk = ri(r, loXk, hiXk), y = m * xk + c, cs = c >= 0 ? '+ ' + c : '− ' + (-c);
        var xStart = Math.max(-R, (-R - c) / m), xEnd = Math.min(R, (R - c) / m);
        return { q: 'For the line ' + M('y = ' + m + 'x ' + cs) + ', find ' + M('y') + ' when ' + M('x = ' + xk) + '.',
          fig: coordPlane(R, [{ x: xk, y: y, label: 'P' }], { lines: [{ x1: xStart, y1: m * xStart + c, x2: xEnd, y2: m * xEnd + c }] }),
          steps: ['Substitute x = ' + M(xk) + ':  y = ' + m + '×' + xk + ' ' + cs + '.', 'y = ' + M(m * xk) + ' ' + cs + ' = ' + M(y) + '.'],
          ans: M('y = ' + y), accept: [String(y)] };
      },
      hard: function (r) {
        var branch = pick(r, ['grad', 'eqpts', 'eqgi']);
        if (branch === 'grad') {
          var x1, x2, s, y1, y2, g = 0;
          do { x1 = ri(r, -4, 2); x2 = ri(r, x1 + 1, 4); s = pick(r, [-2, -1, 1, 2, 3]); y1 = ri(r, -3, 3); y2 = y1 + s * (x2 - x1); g++; } while ((Math.abs(y2) > 6) && g < 50);
          return { q: 'Find the gradient of the line through ' + M('(' + x1 + ', ' + y1 + ')') + ' and ' + M('(' + x2 + ', ' + y2 + ')') + '.',
            fig: coordPlane(6, [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }], { lines: [{ x1: x1, y1: y1, x2: x2, y2: y2 }] }),
            steps: ['Gradient = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).', '= (' + y2 + ' − ' + y1 + ') ÷ (' + x2 + ' − ' + x1 + ') = ' + M(y2 - y1) + ' ÷ ' + M(x2 - x1) + '.', '= ' + M(s) + '.'],
            ans: M('gradient = ' + s), accept: [String(s)] };
        }
        var m2 = pick(r, [-3, -2, -1, 1, 2, 3]), c2 = ri(r, -6, 6), R2 = 9;
        var b1 = (-R2 - c2) / m2, b2 = (R2 - c2) / m2;
        var loB = Math.max(-6, Math.ceil(Math.min(b1, b2))), hiB = Math.min(6, Math.floor(Math.max(b1, b2)));
        var mTerm = m2 === 1 ? 'x' : m2 === -1 ? '-x' : m2 + 'x', cTerm = c2 === 0 ? '' : (c2 > 0 ? '+' + c2 : String(c2));
        var full = 'y=' + mTerm + cTerm, alt = mTerm + cTerm;
        var prettyM = m2 === 1 ? 'x' : m2 === -1 ? '−x' : (m2 < 0 ? '−' + (-m2) + 'x' : m2 + 'x');
        var prettyC = c2 === 0 ? '' : (c2 > 0 ? ' + ' + c2 : ' − ' + (-c2));
        var eqDisplay = 'y = ' + prettyM + prettyC;
        if (branch === 'eqpts') {
          var xa = ri(r, loB, hiB - 1), xb = ri(r, xa + 1, hiB), ya = m2 * xa + c2, yb = m2 * xb + c2;
          return { q: 'A straight line passes through ' + M('(' + xa + ', ' + ya + ')') + ' and ' + M('(' + xb + ', ' + yb + ')') + '. Find the equation of the line in the form ' + M('y = mx + c') + '.',
            fig: coordPlane(R2, [{ x: xa, y: ya, label: 'A' }, { x: xb, y: yb, label: 'B' }], { lines: [{ x1: xa, y1: ya, x2: xb, y2: yb }] }),
            steps: ['Gradient m = (y₂ − y₁) ÷ (x₂ − x₁) = (' + yb + ' − ' + ya + ') ÷ (' + xb + ' − ' + xa + ') = ' + M(m2) + '.',
              'Substitute one point into y = mx + c to find c: ' + ya + ' = ' + m2 + '×' + xa + ' + c, so c = ' + M(c2) + '.',
              'Equation: ' + M(eqDisplay) + '.'],
            ans: M(eqDisplay), accept: [full, alt] };
        }
        var xc = ri(r, loB, hiB), yc = m2 * xc + c2;
        return { q: 'A straight line has gradient ' + M(m2) + ' and passes through ' + M('(' + xc + ', ' + yc + ')') + '. Find the equation of the line in the form ' + M('y = mx + c') + '.',
          fig: coordPlane(R2, [{ x: xc, y: yc, label: 'A' }]),
          steps: ['Substitute the point into y = mx + c: ' + yc + ' = ' + m2 + '×' + xc + ' + c.',
            'So c = ' + yc + ' − (' + m2 + '×' + xc + ') = ' + M(c2) + '.',
            'Equation: ' + M(eqDisplay) + '.'],
          ans: M(eqDisplay), accept: [full, alt] };
      }
    },
    angles: {
      easy: function (r) {
        if (pick(r, ['s', 'c']) === 's') {
          var a = ri(r, 20, 160), x = 180 - a;
          return { q: 'Two angles sit on a straight line. One is ' + M(a + '°') + '. Find the other angle ' + M('x') + '.', fig: straightAngle(a),
            steps: ['Angles on a straight line add to ' + M('180°') + '.', 'x = 180° − ' + a + '° = ' + M(x + '°') + '.'], ans: M(x + '°'), accept: [String(x)] };
        }
        var a2 = ri(r, 15, 80), x2 = 90 - a2;
        return { q: 'Two angles are complementary. One is ' + M(a2 + '°') + '. Find the other angle ' + M('x') + '.', fig: complementFig(a2),
          steps: ['Complementary angles add to ' + M('90°') + '.', 'x = 90° − ' + a2 + '° = ' + M(x2 + '°') + '.'], ans: M(x2 + '°'), accept: [String(x2)] };
      },
      medium: function (r) {
        var a = ri(r, 40, 150), b = ri(r, 40, Math.max(41, 300 - a)), bb = Math.min(b, 300 - a), x = 360 - a - bb;
        return { q: 'Three angles meet at a point: ' + M(a + '°') + ', ' + M(bb + '°') + ' and ' + M('x') + '. Find ' + M('x') + '.', fig: aroundPoint(a, bb),
          steps: ['Angles around a point add to ' + M('360°') + '.', 'x = 360° − ' + a + '° − ' + bb + '° = ' + M(x + '°') + '.'], ans: M(x + '°'), accept: [String(x)] };
      },
      hard: function (r) {
        var a = ri(r, 35, 110), b = ri(r, 30, Math.max(31, 160 - a)), bb = Math.min(b, 160 - a), x = 180 - a - bb;
        return { q: 'A triangle has angles ' + M(a + '°') + ', ' + M(bb + '°') + ' and ' + M('x') + '. Find ' + M('x') + '.', fig: triFig(a + '°', bb + '°', 'x'),
          steps: ['The angles in a triangle add to ' + M('180°') + '.', 'x = 180° − ' + a + '° − ' + bb + '° = ' + M(x + '°') + '.'], ans: M(x + '°'), accept: [String(x)] };
      }
    },
    shapes: {
      easy: function (r) {
        if (pick(r, ['n', 't']) === 'n') {
          var n = pick(r, [5, 6, 7, 8, 9, 10]);
          return { q: 'How many sides does a ' + NGON[n] + ' have?', fig: polyFig(n), steps: ['A ' + NGON[n] + ' is a polygon with ' + M(n) + ' sides.'], ans: M(n), accept: [String(n)] };
        }
        var a = ri(r, 40, 90), b = ri(r, 30, Math.max(31, 140 - a)), bb = Math.min(b, 140 - a), x = 180 - a - bb;
        return { q: 'Find the missing angle ' + M('x') + ' in a triangle whose other angles are ' + M(a + '°') + ' and ' + M(bb + '°') + '.', fig: triFig(a + '°', bb + '°', 'x'),
          steps: ['Angles in a triangle add to ' + M('180°') + '.', 'x = 180° − ' + a + '° − ' + bb + '° = ' + M(x + '°') + '.'], ans: M(x + '°'), accept: [String(x)] };
      },
      medium: function (r) {
        var n = ri(r, 3, 12), sum = (n - 2) * 180;
        return { q: 'What is the sum of the interior angles of a ' + NGON[n] + ' (' + M(n) + ' sides)?', fig: polyFig(n),
          steps: ['Interior angle sum = (n − 2) × 180°.', '= (' + n + ' − 2) × 180° = ' + M(n - 2) + ' × 180° = ' + M(sum + '°') + '.'], ans: M(sum + '°'), accept: [String(sum)] };
      },
      hard: function (r) {
        var n = pick(r, [3, 4, 5, 6, 8, 9, 10, 12]);
        if (pick(r, ['in', 'ex']) === 'in') {
          var each = (n - 2) * 180 / n;
          return { q: 'Each interior angle of a <b>regular</b> ' + NGON[n] + ' (' + M(n) + ' sides). Find it.', fig: polyFig(n),
            steps: ['Interior angle sum = (' + n + ' − 2) × 180° = ' + M((n - 2) * 180 + '°') + '.', 'Equal angles, so divide by ' + M(n) + ': ' + (n - 2) * 180 + '° ÷ ' + n + ' = ' + M(each + '°') + '.'], ans: M(each + '°'), accept: [String(each)] };
        }
        var ext = 360 / n;
        return { q: 'Each exterior angle of a <b>regular</b> ' + NGON[n] + ' (' + M(n) + ' sides). Find it.', fig: polyFig(n),
          steps: ['The exterior angles of any polygon add to 360°.', 'Regular, so divide by ' + M(n) + ': 360° ÷ ' + n + ' = ' + M(ext + '°') + '.'], ans: M(ext + '°'), accept: [String(ext)] };
      }
    },
    transformations: {
      easy: function (r) {
        var x = ri(r, -3, 3), y = ri(r, -3, 3), dx = ri(r, -3, 3), dy = ri(r, -3, 3); if (dx === 0 && dy === 0) return null;
        var nx = x + dx, ny = y + dy;
        return { q: 'Translate the point ' + M('(' + x + ', ' + y + ')') + ' by ' + M('(' + dx + ', ' + dy + ')') + '. What are its new coordinates?',
          fig: coordPlane(6, [{ x: x, y: y, label: 'P' }, { x: nx, y: ny, label: "P'", hollow: true }], { arrows: [{ x1: x, y1: y, x2: nx, y2: ny }] }),
          steps: ['Add the shift to each coordinate: (' + x + ' + ' + dx + ', ' + y + ' + ' + dy + ').', '= ' + M('(' + nx + ', ' + ny + ')') + '.'], ans: M('(' + nx + ', ' + ny + ')'), accept: coordAcc(nx, ny) };
      },
      medium: function (r) {
        var x = ri(r, -5, 5), y = ri(r, -5, 5); if (x === 0 && y === 0) return null;
        var ax = pick(r, ['x-axis', 'y-axis']), nx = ax === 'x-axis' ? x : -x, ny = ax === 'x-axis' ? -y : y;
        return { q: 'Reflect the point ' + M('(' + x + ', ' + y + ')') + ' in the ' + ax + '. What are its new coordinates?',
          fig: coordPlane(6, [{ x: x, y: y, label: 'P' }, { x: nx, y: ny, label: "P'", hollow: true }]),
          steps: [ax === 'x-axis' ? 'Reflecting in the x-axis flips the sign of y: (x, −y).' : 'Reflecting in the y-axis flips the sign of x: (−x, y).', '= ' + M('(' + nx + ', ' + ny + ')') + '.'], ans: M('(' + nx + ', ' + ny + ')'), accept: coordAcc(nx, ny) };
      },
      hard: function (r) {
        var x = ri(r, -5, 5), y = ri(r, -5, 5); if (x === 0 && y === 0) return null;
        var t = pick(r, ['180', '90cw', '90ccw']), nx, ny, d, rule;
        if (t === '180') { nx = -x; ny = -y; d = '180°'; rule = '(x, y) → (−x, −y)'; }
        else if (t === '90cw') { nx = y; ny = -x; d = '90° clockwise'; rule = '(x, y) → (y, −x)'; }
        else { nx = -y; ny = x; d = '90° anticlockwise'; rule = '(x, y) → (−y, x)'; }
        return { q: 'Rotate the point ' + M('(' + x + ', ' + y + ')') + ' by ' + M(d) + ' about the origin. New coordinates?',
          fig: coordPlane(6, [{ x: x, y: y, label: 'P' }, { x: nx, y: ny, label: "P'", hollow: true }]),
          steps: ['A ' + d + ' rotation about the origin maps ' + rule + '.', '= ' + M('(' + nx + ', ' + ny + ')') + '.'], ans: M('(' + nx + ', ' + ny + ')'), accept: coordAcc(nx, ny) };
      }
    },
    pythagoras: {
      easy: function (r) {
        var t = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [12, 16, 20], [10, 24, 26], [9, 40, 41], [15, 20, 25], [18, 24, 30]]), a = t[0], b = t[1], c = t[2];
        return { q: 'A right-angled triangle has legs ' + M(a + ' cm') + ' and ' + M(b + ' cm') + '. Find the hypotenuse.', fig: rightTri(a + ' cm', b + ' cm', '?', ri(r, 0, 3)),
          steps: ['Pythagoras: c² = a² + b².', 'c² = ' + a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + M(a * a + b * b) + '.', 'c = √' + (a * a + b * b) + ' = ' + M(c + ' cm') + '.'], ans: M(c + ' cm'), accept: [String(c)] };
      },
      medium: function (r) {
        var t = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [12, 16, 20], [10, 24, 26], [15, 20, 25]]), a = t[0], b = t[1], c = t[2];
        var known = pick(r, [a, b]), find = known === a ? b : a;
        return { q: 'A right-angled triangle has hypotenuse ' + M(c + ' cm') + ' and one leg ' + M(known + ' cm') + '. Find the other leg.', fig: rightTri(known + ' cm', '?', c + ' cm', ri(r, 0, 3)),
          steps: ['Rearrange: leg² = c² − (known leg)².', '= ' + c + '² − ' + known + '² = ' + c * c + ' − ' + known * known + ' = ' + M(c * c - known * known) + '.', 'leg = √' + (c * c - known * known) + ' = ' + M(find + ' cm') + '.'], ans: M(find + ' cm'), accept: [String(find)] };
      },
      hard: function (r) {
        var a = ri(r, 4, 12), b = ri(r, 3, 11); if (b >= a) b = a - 1; if (b < 3) b = 3; var c = Math.round(Math.sqrt(a * a + b * b) * 10) / 10;
        return { q: 'A right-angled triangle has legs ' + M(a + ' cm') + ' and ' + M(b + ' cm') + '. Find the hypotenuse, to 1 decimal place.', fig: rightTri(a + ' cm', b + ' cm', '?', ri(r, 0, 3)),
          steps: ['c² = ' + a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + M(a * a + b * b) + '.', 'c = √' + (a * a + b * b) + ' ≈ ' + M(c + ' cm') + '.'], ans: M(c + ' cm'), accept: [c.toFixed(1)] };
      }
    },
    circles: {
      easy: function (r) {
        var v = ri(r, 3, 20);
        if (pick(r, ['d', 'r']) === 'd') return { q: 'A circle has radius ' + M(v + ' cm') + '. What is its diameter?', fig: circleFig(v + ' cm', 'r'), steps: ['Diameter = 2 × radius.', '= 2 × ' + v + ' = ' + M(2 * v + ' cm') + '.'], ans: M(2 * v + ' cm'), accept: [String(2 * v)] };
        var d = 2 * v; return { q: 'A circle has diameter ' + M(d + ' cm') + '. What is its radius?', fig: circleFig(d + ' cm', 'd'), steps: ['Radius = diameter ÷ 2.', '= ' + d + ' ÷ 2 = ' + M(v + ' cm') + '.'], ans: M(v + ' cm'), accept: [String(v)] };
      },
      medium: function (r) {
        var rad = ri(r, 2, 12), C = Math.round(2 * 3.14 * rad * 100) / 100;
        return { q: 'Find the circumference of a circle with radius ' + M(rad + ' cm') + '. Use ' + M('π = 3.14') + ', answer to 2 dp.', fig: circleFig(rad + ' cm', 'r'),
          steps: ['Circumference = 2πr.', '= 2 × 3.14 × ' + rad + ' = ' + M(C + ' cm') + '.'], ans: M(C + ' cm'), accept: [C.toFixed(2)] };
      },
      hard: function (r) {
        var rad = ri(r, 2, 12), A = Math.round(3.14 * rad * rad * 100) / 100;
        return { q: 'Find the area of a circle with radius ' + M(rad + ' cm') + '. Use ' + M('π = 3.14') + ', answer to 2 dp.', fig: circleFig(rad + ' cm', 'r'),
          steps: ['Area = πr².', '= 3.14 × ' + rad + '² = 3.14 × ' + rad * rad + ' = ' + M(A + ' cm²') + '.'], ans: M(A + ' cm²'), accept: [A.toFixed(2)] };
      }
    }
  };
  var INTRO_FIG = { graphs: quadrantChart, angles: function () { return straightAngle(125); }, shapes: polyRow,
    transformations: function () { return coordPlane(6, [{ x: -3, y: 1, label: 'A' }, { x: 1, y: 1, label: "A'", hollow: true }], { arrows: [{ x1: -3, y1: 1, x2: 1, y2: 1 }] }); },
    pythagoras: function () { return rightTri('a', 'b', 'c'); }, circles: function () { return circleFig('r', 'r'); } };
  var INTRO_CAP = { graphs: 'The axes split the plane into four quadrants. A point&rsquo;s signs (x, y) decide which one it lands in.',
    angles: 'Angles on a straight line always add to 180°; angles around a point add to 360°.',
    shapes: 'Polygons are named by their number of sides. Interior angles sum to (n − 2) × 180°.',
    transformations: 'A translation slides every point by the same amount — here (x, y) each shift right by 4.',
    pythagoras: 'In a right-angled triangle, a² + b² = c², where c is the hypotenuse (opposite the right angle).',
    circles: 'r = radius, d = 2r. Circumference = 2πr, Area = πr².' };

  var LEVELS = [['Easy', 'easy'], ['Medium', 'medium'], ['Hard', 'hard']];

  function generateFor(topicId) {
    var g = GEN[topicId]; if (!g) return null;
    var seed = window.ProgressStore.getSeed(topicId);
    var rng = mulberry32(seed);
    var t = {};
    LEVELS.forEach(function (lv) {
      var key = lv[1], fn = g[key]; if (!fn) return;
      var arr = [], seen = {}, guard = 0;
      while (arr.length < 10 && guard++ < 400) { var p = fn(rng); if (!p || seen[p.q]) continue; seen[p.q] = true; arr.push(p); }
      t[key] = arr;
    });
    return t;
  }

  function partHtml(title, items, type) {
    type = type || 'ol';
    return items ? '<div class="assignment-part"><h4>' + title + '</h4><' + type + '>' + items + '</' + type + '></div>' : '';
  }
  function assignmentItems(items, start, count) { return (items || []).slice(start, start + count).map(function (e) { return '<li>' + e.q + '</li>'; }).join(''); }

  window.QuizEngine = {
    GEN: GEN, INTRO_FIG: INTRO_FIG, INTRO_CAP: INTRO_CAP,

    // Renders the practice tabs/panes, worked-examples sample grid, and assignment grid for a
    // dynamic topic, and registers each item's accept[] into window.TOPIC_CHECK for grading.
    renderDynamicTopic: function (topicId, approach, check) {
      var t = generateFor(topicId); if (!t) return;
      window.TOPIC_CHECK = window.TOPIC_CHECK || {};

      var tabs = LEVELS.map(function (lv, i) { return '<button class="tab ' + (i === 0 ? 'on' : '') + '" data-lv="' + lv[0] + '">' + lv[0] + '<span class="n">' + t[lv[1]].length + '</span></button>'; }).join('');
      var panes = LEVELS.map(function (lv, i) {
        var key = lv[1];
        var cards = t[key].map(function (e, idx) {
          var kkey = topicId + '|' + key + '|' + idx;
          if (e.accept) window.TOPIC_CHECK[kkey] = e.accept;
          return '<div class="ex" data-key="' + kkey + '" data-tid="' + topicId + '">' +
            '<div class="ex-top"><span class="num">' + (idx + 1) + '</span><div class="q">' + e.q + '</div></div>' +
            (e.fig ? '<div class="figwrap">' + e.fig + '</div>' : '') +
            '<div class="attempt"><input class="ans-input" type="text" placeholder="Write your answer here&hellip;" aria-label="Your answer">' +
            '<button class="markbtn">✓ Mark answer</button><button class="reveal locked">🔒 Show solution</button></div>' +
            '<div class="sol"><div class="your-answer"><span class="lbl">Your answer</span><span class="txt"></span></div>' +
            '<div class="lead">Approach</div><p class="approach">' + approach + '</p>' +
            '<div class="lead">Working, step by step</div><ol class="steps">' + e.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
            '<div class="answer"><span class="tag">Answer</span><span class="val">' + e.ans + '</span></div>' +
            '<div class="checktip"><b>Check it:</b> ' + check + '</div></div></div>';
        }).join('');
        return '<div class="pane ' + (i === 0 ? 'on' : '') + '" data-lv="' + lv[0] + '">' + cards + '</div>';
      }).join('');
      var elTabs = document.getElementById('dyn-tabs'), elPanes = document.getElementById('dyn-panes');
      if (elTabs) elTabs.innerHTML = tabs;
      if (elPanes) elPanes.innerHTML = panes;

      var workedSamples = [['Easy', 'Core skill', (t.easy || [])[0]], ['Medium', 'Mixed method', (t.medium || [])[0]], ['Hard', 'Challenge scenario', (t.hard || [])[0]]].filter(function (x) { return x[2]; });
      var elWorked = document.getElementById('dyn-worked');
      if (elWorked && workedSamples.length) {
        elWorked.innerHTML = '<div class="example-grid">' + workedSamples.map(function (x) {
          var lv = x[0], label = x[1], e = x[2];
          return '<article class="we-card ' + lv.toLowerCase() + '"><div class="we-card-head"><span class="level">' + lv + '</span><span>' + label + '</span></div>' +
            '<div class="we-q">' + e.q + '</div>' + (e.fig ? '<div class="figwrap">' + e.fig + '</div>' : '') +
            '<ol class="steps">' + e.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
            '<div class="answer"><span class="tag">Answer</span><span class="val">' + e.ans + '</span></div></article>';
        }).join('') + '</div>';
      }

      var elAssign = document.getElementById('dyn-assignment');
      if (elAssign) {
        elAssign.innerHTML = [
          partHtml('Part A - Fluency', assignmentItems(t.easy, 1, 4)),
          partHtml('Part B - Method and reasoning', assignmentItems(t.medium, 1, 3)),
          partHtml('Part C - Application and challenge', assignmentItems(t.hard, 1, 3))
        ].join('');
      }
    }
  };
})();
