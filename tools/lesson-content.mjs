// tools/lesson-content.mjs
//
// Expanded "Read the Chapter" content for every topic — replaces the original (quite thin) t.lesson
// prose with a fuller explanation: a clear definition (as a short bullet list, not just a sentence),
// plus 3 real-world worked scenarios per topic so a learner sees the idea applied in different
// contexts, not just the abstract rule. Kept as its own file (same pattern as STATIC_MODELS in
// generate-book.mjs) so this large block of authored content doesn't bloat the build script.
//
// Applied in generate-book.mjs's applyContentFixes(): `t.lesson = LESSON_EXPANSIONS[t.id] || t.lesson`.
// Every existing CSS class (.term, .hl, .kbox, .why-style callouts) is reused; two new ones were
// added to css/styles.css for this: `.def-list` (a clean bulleted definition list) and
// `.rw-examples`/`.rw-card` (a grid of real-world scenario cards, tinted like the existing
// `.hf-sec.realworld` section so the "this is a real example" cue is visually consistent).
//
// The five Geometry-strand topics (angles, shapes, transformations, pythagoras, circles) live in
// geometry-lessons.mjs instead — they were rewritten with sub-headings, numbered methods and inline
// explainer diagrams, which made them too big to sit comfortably in here. They are spread into
// LESSON_EXPANSIONS below, so consumers see one combined map exactly as before.

import { GEOMETRY_LESSONS } from './geometry-lessons.mjs';

// A small pie-chart SVG, reused for any topic where "slices of a whole" is the clearest visual
// (ratios, fractions, percentages, probability, circles all lean on the same picture).
export function pizzaSVG(total, coloredCount, opts) {
  opts = opts || {};
  const cx = 62, cy = 62, r = 54;
  const colorA = opts.colorA || '#E4572E', colorB = opts.colorB || '#FCE7B8';
  let paths = '';
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = (cx + r * Math.cos(a0)).toFixed(1), y0 = (cy + r * Math.sin(a0)).toFixed(1);
    const x1 = (cx + r * Math.cos(a1)).toFixed(1), y1 = (cy + r * Math.sin(a1)).toFixed(1);
    const fill = i < coloredCount ? colorA : colorB;
    paths += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z" fill="${fill}" stroke="#fff" stroke-width="1.5"/>`;
  }
  return `<svg viewBox="0 0 124 124" width="124" height="124" role="img" aria-label="A pizza cut into ${total} slices, ${coloredCount} of one topping and ${total - coloredCount} of the other">${paths}</svg>`;
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

export const LESSON_EXPANSIONS = {

  ...GEOMETRY_LESSONS,

  conversions: `
<p>The metric system runs on <span class="hl">powers of ten</span>: prefixes like kilo-, centi- and milli- just slide the decimal point.</p>
<ul class="def-list">
  <li>1 km = 1000 m, 1 m = 100 cm &mdash; converting to a <em>smaller</em> unit gives a <em>bigger</em> number.</li>
  <li>A <span class="term">rate</span> combines two different kinds of unit, like speed (distance per time) or a price per kilogram. For example, $4.50 for 500 g is a rate: $4.50 per 500 g, or $0.009 per gram.</li>
  <li>speed = distance &divide; time, which rearranges to distance = speed &times; time, or time = distance &divide; speed. For example, 150 km in 3 h &rarr; speed = 150 &divide; 3 = <span class="hl">50 km/h</span>.</li>
  <li>Always make units match before calculating &mdash; mixing minutes with hours, or cm with m, is the classic slip. For example, 24 km in 30 min: convert 30 min = 0.5 h first, so speed = 24 &divide; 0.5 = <span class="hl">48 km/h</span>.</li>
  <li>Speed itself has two common "outfits": km/h and m/s. To go from km/h to m/s, divide by 3.6 (since 1000 m &divide; 3600 s = 1 &divide; 3.6) &mdash; so 90 km/h = 90 &divide; 3.6 = <b>25 m/s</b>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Speed relationship</span><span class="formula">speed = distance &divide; time (rearranges three ways)</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127859; Following a recipe</span>
    <p>A recipe needs 250 ml of milk, but your jug is marked in litres. Since 1 L = 1000 ml, 250 ml = <b>0.25 L</b> &mdash; converting first avoids pouring the wrong amount.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#9992;&#65039; Planning a road trip</span>
    <p>A trip is 360 km at 90 km/h. Time = distance &divide; speed = 360 &divide; 90 = <b>4 hours</b> &mdash; but only once both are already in matching units.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128138; Reading a medicine dose</span>
    <p>A label says 5 mg per kg of body weight. For a 20 kg child, that's 5 &times; 20 = <b>100 mg</b> &mdash; mixing up mg and g here could mean a dose 1000 times too strong.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128692; A cyclist's mixed-unit speed</span>
    <p>A cyclist rides 24 km in 30 minutes. 30 minutes is <b>0.5 hours</b> &mdash; convert the time first: speed = 24 &divide; 0.5 = <b>48 km/h</b>. Dividing 24 by "30" (forgetting the unit switch) gives a wrong, much smaller answer.</p>
  </div>
</div>`,

  statistics: `
<p>Statistics summarise a whole set of data with a single number. There are three "averages", and picking the right one is itself a skill.</p>
<ul class="def-list">
  <li>The <span class="term">mean</span> is the "fair share" average: add every value, then divide by how many values there are. For example, the mean of 4, 6, 8 is (4 + 6 + 8) &divide; 3 = <span class="hl">6</span>.</li>
  <li>The <span class="term">median</span> is the middle value once the data is placed in order. For example, in 3, 7, 9 the median is 7.</li>
  <li>The <span class="term">mode</span> is the value that appears most often. For example, in 2, 4, 4, 7 the mode is 4.</li>
  <li>The <span class="term">range</span> (max &minus; min) describes how spread out the data is, not where its centre lies. For example, 2, 5, 9 has range 9 &minus; 2 = 7.</li>
  <li>The mean uses every value, so one huge outlier can drag it away from what's typical &mdash; the median ignores outliers and is often a fairer summary. For example, in 2, 3, 3, 10 the mean (4.5) is pulled up by the 10, while the median (3) is not.</li>
  <li>The mean does not have to be one of the actual data values. For 2, 3, 3, 10 the mean is 4.5 &mdash; a number that appears nowhere in the list.</li>
  <li>With an <em>even</em> number of values, there is no single middle one &mdash; the median is the average of the two middle values once the data is in order. For example, in 4, 6, 8, 10 the median is (6 + 8) &divide; 2 = <span class="hl">7</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Centre &amp; spread</span><span class="formula">mean = fair share (sum &divide; count)<br>median = middle<br>mode = most common<br>range = max &minus; min</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127968; Average house prices</span>
    <p>In a street of 9 houses worth about $600,000 each, one mansion sells for $5,000,000. The <b>mean</b> price jumps, making the street look expensive &mdash; the <b>median</b> (the middle house) still shows the true typical price.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127951; A batting average</span>
    <p>A batter scores 20, 35, 15, 100, 30. The <b>mean</b> (40) is pulled up by the one big 100; the <b>median</b> (30) better reflects a typical innings.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128094; Shoe sizes in a class</span>
    <p>The <b>mode</b> (most common size) tells a shop which size to stock the most of &mdash; the mean shoe size might come out as 7.3, a size that doesn't even exist.</p>
  </div>
</div>`,

  probability: `
<p>Probability measures how likely an event is, on a scale from <span class="hl">0 (impossible) to 1 (certain)</span>.</p>
<ul class="def-list">
  <li>The <span class="term">sample space</span> is the full list of equally likely outcomes for an experiment &mdash; get this list right before calculating anything. For example, rolling one die has sample space 1, 2, 3, 4, 5, 6.</li>
  <li>For equally likely outcomes: <span class="term">P(event) = favourable outcomes &divide; total outcomes</span>. For example, P(even number on a die) = 3 &divide; 6 = &frac12;.</li>
  <li>The complement rule: P(not A) = 1 &minus; P(A) &mdash; this often turns a hard "at least one" question into an easy one. For example, P(rain) = 0.3, so P(no rain) = 1 &minus; 0.3 = <span class="hl">0.7</span>.</li>
  <li>For two events together, "<span class="hl">AND</span>" multiplies and "<span class="hl">OR</span>" adds &mdash; but mind the conditions: multiply only when the events are <span class="term">independent</span> (one doesn't affect the other), add only when they cannot both happen at once. Two separate coins both landing heads: &frac12; &times; &frac12; = &frac14;, matching HH being 1 of the 4 equally likely outcomes.</li>
  <li>A probability is not tested by one trial. "30% chance of rain" not raining doesn't make the forecast wrong &mdash; probabilities are checked over <em>many</em> repeats, comparing the predicted probability to the <span class="term">relative frequency</span> (how often it actually happened). For example, 200 spins landing red 50 times gives a relative frequency of 50 &divide; 200 = <span class="hl">&frac14;</span>.</li>
  <li>Each toss, roll or spin is independent of the last. If a coin has landed tails five times running, heads is still exactly 50% likely next time &mdash; it is never "due".</li>
</ul>
<div class="kbox"><span class="kbox-tag">Core formulas</span><span class="formula">P(event) = favourable &divide; total<br>P(not A) = 1 &minus; P(A)<br>independent AND: &times; &nbsp;|&nbsp; exclusive OR: +</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127922; Rolling two dice</span>
    <p>Wanting a total of 7: the sample space has 6&times;6 = 36 equally likely outcomes, and 6 of them make 7. So P(total = 7) = 6&frasl;36 = <b>1&frasl;6</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127780;&#65039; Reading a weather forecast</span>
    <p>A forecast gives a 30% chance of rain. P(rain) = 0.3, so P(no rain) = 1 &minus; 0.3 = <b>0.7</b> &mdash; more likely than not, but rain is still a real possibility.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129689; Tossing two coins</span>
    <p>It's tempting to guess 3 outcomes (0, 1 or 2 heads). The true sample space has 4: HH, HT, TH, TT &mdash; so "exactly one head" is 2&frasl;4 = <b>1&frasl;2</b>, not 1&frasl;3.</p>
  </div>
</div>`,

  'perimeter-area': `
<p><span class="term">Perimeter</span> is a one-dimensional length around the edge of a shape; <span class="term">area</span> is a two-dimensional covering, counted in <span class="hl">unit squares</span>.</p>
<ul class="def-list">
  <li>Key area formulas: rectangle = length &times; width; triangle = &frac12; &times; base &times; height (exactly half its surrounding rectangle); parallelogram = base &times; height. For example, a triangle with base 8 cm and height 5 cm has area &frac12; &times; 8 &times; 5 = <span class="hl">20 cm&sup2;</span>.</li>
  <li>A <span class="term">trapezium</span> has one pair of parallel sides (lengths a and b, a distance h apart). Its area is <span class="hl">&frac12;(a + b) &times; h</span> &mdash; average the two parallel sides, then multiply by the height. For a = 6, b = 10, h = 4: &frac12;(6 + 10) &times; 4 = &frac12; &times; 16 &times; 4 = 32.</li>
  <li>For a triangle, "height" always means the <span class="term">perpendicular height</span> &mdash; measured straight up from the base at a right angle &mdash; never the slanted side, even when the slanted side looks like the obvious measurement to use. For example, a triangle with base 6 cm and perpendicular height 4 cm has area &frac12; &times; 6 &times; 4 = 12 cm&sup2;.</li>
  <li>A <span class="term">compound shape</span> (made of simpler shapes joined together) is found by splitting it into rectangles and triangles, then adding or subtracting their areas. For example, an L-shape splits into a 6 &times; 4 and a 3 &times; 2 rectangle &rarr; 24 + 6 = 30 units&sup2;.</li>
  <li>Perimeter and area measure genuinely different things &mdash; a shape can have a bigger perimeter but a <em>smaller</em> area than another shape. For example, a 1 &times; 8 rectangle has perimeter 18 but area 8, while a 4 &times; 4 square has a smaller perimeter (16) yet a bigger area (16).</li>
</ul>
<div class="kbox"><span class="kbox-tag">Key areas</span><span class="formula">rectangle = l &times; w<br>triangle = &frac12; &times; b &times; h<br>parallelogram = b &times; h<br>trapezium = &frac12;(a + b) &times; h</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128679; Fencing a garden</span>
    <p>A rectangular garden is 8 m by 5 m. Fencing needs the <b>perimeter</b>: 2 &times; (8+5) = <b>26 m</b> of fence.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129529; Carpeting a room</span>
    <p>A room is 4 m by 3.5 m. Carpet needed is the <b>area</b>: 4 &times; 3.5 = <b>14 m&sup2;</b> &mdash; carpet is bought by area, not by the length of the walls.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128204; Two paddocks, same fence</span>
    <p>A 10 m &times; 10 m paddock has perimeter 40 m and area 100 m&sup2;. An 18 m &times; 2 m paddock also has perimeter 40 m, but only <b>36 m&sup2;</b> &mdash; the same fencing can enclose very different areas.</p>
  </div>
</div>`,

  volume: `
<p><span class="term">Volume</span> measures how much space a 3-D solid fills, in <span class="hl">cubic</span> units; <span class="term">surface area</span> is the total area of all its flat faces.</p>
<ul class="def-list">
  <li>For any prism (including a cuboid), volume = base area &times; height &mdash; how many unit cubes tile the base, times how many layers stack up. For example, a box with base 3 &times; 2 = 6 and height 4 has volume 6 &times; 4 = <span class="hl">24 cm&sup3;</span>.</li>
  <li>Surface area is the material needed to wrap or cover a solid completely &mdash; the sum of every face's area. Unfold a box flat and you get its <span class="term">net</span>: every face laid out where you can see and add up all six at once. For example, a 4 &times; 3 &times; 2 cm box has 6 faces of areas 12, 12, 8, 8, 6, 6 cm&sup2;, totalling <span class="hl">52 cm&sup2;</span>.</li>
  <li>A cuboid's 6 faces come in <b>3 matching pairs</b> (top&amp;bottom, front&amp;back, left&amp;right) &mdash; find one area from each pair, add the three, then double the total. For example, a 4 &times; 3 &times; 2 box: 4&times;3 = 12, 4&times;2 = 8, 3&times;2 = 6 &rarr; 2 &times; (12 + 8 + 6) = <span class="hl">52 cm&sup2;</span>.</li>
  <li>Scaling a 3-D shape affects volume differently to area: double every edge of a cube and its volume becomes <b>8 times</b> bigger (2&sup3;), not 2 times. For example, a 2 cm cube (8 cm&sup3;) becomes a 4 cm cube (64 cm&sup3;) &mdash; eight times the volume.</li>
  <li>To find a side length back from a volume you <span class="term">undo the cube</span> (a cube root): try whole numbers until one fits. For volume 64 cm&sup3;: 3&times;3&times;3 = 27 (too small), 4&times;4&times;4 = 64 &mdash; so the side is <span class="hl">4 cm</span>.</li>
  <li>Capacity links straight to volume: a cube 10 cm on every side holds 10&times;10&times;10 = 1000 cm&sup3;, and that amount is defined as <span class="hl">1 litre</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Prism &amp; capacity</span><span class="formula">V = base area &times; height<br>1 litre = 1000 cm&sup3;</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128031; Filling a fish tank</span>
    <p>A tank is 60 &times; 30 &times; 40 cm: volume = 72,000 cm&sup3;. Since 1000 cm&sup3; = 1 litre, that's <b>72 litres</b> of water to fill it.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128230; A shipping box</span>
    <p>A box is 50 &times; 40 &times; 30 cm (60,000 cm&sup3;). Doubling every dimension to 100 &times; 80 &times; 60 cm doesn't just double the volume &mdash; it makes it <b>8 times</b> bigger (480,000 cm&sup3;).</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127873; Wrapping a gift</span>
    <p>Wrapping paper needed is the box's <b>surface area</b> (every face added up); how much it can hold is its <b>volume</b> &mdash; two different questions about the very same box.</p>
  </div>
  <div class="rw-card">
    ${cuboidNetSVG(4, 3, 2)}
    <span class="rw-tag">&#128230; Unfolding a cereal box (4 &times; 3 &times; 2 cm)</span>
    <p>Top &amp; bottom: 4&times;3 = 12 cm&sup2; each. Front &amp; back: 4&times;2 = 8 cm&sup2; each. Left &amp; right: 3&times;2 = 6 cm&sup2; each.</p>
    <p>SA = 2&times;(12 + 8 + 6) = 2&times;26 = <b>52 cm&sup2;</b> &mdash; the flattened net above shows exactly these 6 pieces.</p>
  </div>
</div>`,

  equations: `
<p>An equation asserts that two expressions name the <span class="hl">same number</span>. Picture a <span class="term">balance scale</span>: the two sides weigh the same, and your job is to isolate the unknown without ever tipping it.</p>
<ul class="def-list">
  <li>Solving means finding the value of the unknown that keeps both sides equal. For example, x + 3 = 7 is solved by <span class="hl">x = 4</span>, since 4 + 3 = 7.</li>
  <li>Every step must be a "legal move": add, subtract, multiply or divide <span class="hl">both sides equally</span> so the balance stays true. For example, from x + 4 = 10, subtract 4 from both sides &rarr; x = 6.</li>
  <li>To undo an operation, apply its opposite (its <span class="term">inverse</span>) &mdash; undo in the reverse order to how the expression was built. For example, 2x + 1 = 9: undo the +1 first (2x = 8), then undo the &times;2 (x = 4).</li>
  <li>Always check your answer by substituting it back into the original equation &mdash; both sides should come out equal. For example, solving 2x = 10 gives x = 5; check: 2 &times; 5 = 10. &#10003;</li>
  <li>If the unknown appears on <em>both</em> sides (like 3x + 5 = x + 13), do one extra move first: subtract the smaller x-term from both sides to gather all the x's on one side, then solve as usual. Subtract x from both sides &rarr; 2x + 5 = 13 &rarr; 2x = 8 &rarr; <span class="hl">x = 4</span>. The balance idea is unchanged &mdash; you are just lifting an x-shaped weight off each pan.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Legal moves</span><span class="formula">do the SAME thing to both sides<br>undo operations in reverse</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128179; Saving for a skateboard</span>
    <p>You have $35 saved and want a $95 skateboard, saving $12 a week: 35 + 12w = 95 &rarr; 12w = 60 &rarr; <b>w = 5 weeks</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127777;&#65039; Temperature conversion</span>
    <p>F = 1.8C + 32. If today is 68&deg;F: 1.8C + 32 = 68 &rarr; 1.8C = 36 &rarr; <b>C = 20&deg;C</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127909; Movie tickets</span>
    <p>A group booking costs an $8 fee plus $14 per ticket. If the total was $92: 8 + 14t = 92 &rarr; 14t = 84 &rarr; <b>t = 6 tickets</b>.</p>
  </div>
</div>`,

  inequalities: `
<p>An <span class="term">inequality</span> (&gt;, &lt;, &ge;, &le;) describes a whole <span class="hl">range</span> of solutions, not a single value &mdash; a region of the number line rather than a point.</p>
<ul class="def-list">
  <li>Solve an inequality with the same legal moves as an equation, with <b>one exception</b>: multiplying or dividing both sides by a <span class="hl">negative</span> number flips the inequality sign. For example, &minus;2x &lt; 6: divide both sides by &minus;2 and flip &rarr; x &gt; &minus;3.</li>
  <li>A strict inequality (&lt;, &gt;) uses an open circle on a number line &mdash; the endpoint itself is not included. For example, x &lt; 5 has an open circle at 5, and 5 is not a solution.</li>
  <li>&le; or &ge; uses a closed, filled circle &mdash; the endpoint itself is included. For example, x &ge; 3 has a filled circle at 3, and 3 <em>is</em> a solution.</li>
  <li>Many real limits are ranges, not single numbers: a maximum, a minimum, or an allowed band of values. For example, a lift limit w &lt; 500 kg, or a ride that needs height h &ge; 120 cm.</li>
  <li>Always check the boundary itself: with &ge; or &le;, the boundary value <em>is</em> a solution; with a strict &gt; or &lt;, it is <em>not</em>. For example, for x &le; 4 the value 4 works, but for x &lt; 4 it does not.</li>
</ul>
<div class="kbox"><span class="kbox-tag">The exception</span><span class="formula">&times; or &divide; by a NEGATIVE &rarr; reverse the inequality sign</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128663; A speed limit sign</span>
    <p>A sign reads "speed &le; 50 km/h". Any speed from 0 up to <em>and including</em> 50 is legal &mdash; not only exactly 50.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127905; A rollercoaster height rule</span>
    <p>A ride requires height &ge; 120 cm. A rider exactly 120 cm tall is allowed on; someone even 1 cm shorter is turned away.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127871; A party snack budget</span>
    <p>You have $150 for snacks at $6 each: 6n &le; 150 &rarr; n &le; 25. You can buy <b>up to 25 items</b> without going over budget.</p>
  </div>
</div>`,

  graphs: `
<p>The <span class="hl">coordinate plane</span> locates every point with an ordered pair (x, y): across first (x), then up (y).</p>
<ul class="def-list">
  <li>A straight-line graph is the picture of every (x, y) pair that makes a linear equation true &mdash; points on the line satisfy it, points off it don't. For example, (1, 3) lies on y = 2x + 1 because 2 &times; 1 + 1 = 3, but (1, 5) does not.</li>
  <li>In <span class="term">y = mx + c</span>: m is the <span class="term">gradient</span> (steepness) &mdash; how much y climbs for every step of x, or rise &divide; run. For example, in y = 2x + 1 the gradient m = 2, so y climbs 2 for every 1 step across.</li>
  <li>c is the <span class="term">y-intercept</span> &mdash; where the line crosses the y-axis. For example, in y = 2x + 1 the intercept c = 1, so the line crosses the y-axis at (0, 1).</li>
  <li>Lines with the same gradient are parallel &mdash; they climb at the same rate but cross the y-axis at different points. For example, y = 2x + 1 and y = 2x &minus; 4 are parallel, both climbing 2 for every step across.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Line equation</span><span class="formula">y = mx + c<br>m = gradient = rise &divide; run<br>c = y-intercept</span></div>
<p>To draw y = 2x &minus; 1 by hand: pick three easy x-values, substitute each into the equation, then plot the (x, y) pairs and join them with a straight line.</p>
<div class="kbox"><span class="kbox-tag">y = 2x &minus; 1, worked point by point</span><span class="formula">x=0: y=2(0)&minus;1=&minus;1 &rarr; (0,&minus;1)<br>x=1: y=2(1)&minus;1=1 &rarr; (1,1)<br>x=2: y=2(2)&minus;1=3 &rarr; (2,3)</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128241; Comparing phone plans</span>
    <p>Plan A costs y = 20 (a flat fee, no per-GB charge). Plan B costs y = 5g + 5. Graphing both lines shows exactly where B becomes cheaper or pricier as data use (g) grows.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128692; A cyclist's distance-time graph</span>
    <p>A cyclist's distance from home is graphed against time. A steeper line means faster travel (a bigger gradient); a flat, horizontal section means the cyclist has stopped.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128506;&#65039; A treasure map</span>
    <p>A map marks treasure at (4, 3) &mdash; 4 steps east, then 3 steps north from the corner. Every map, game and GPS app is really a coordinate plane in disguise.</p>
  </div>
</div>`,

  operations: `
<p>Order of operations is a <span class="hl">convention for reading</span>, not a law of nature — we agree on it so an expression like 6 + 4 &times; 3 has exactly one meaning for everyone.</p>
<ul class="def-list">
  <li><span class="term">BEDMAS</span> sets the order: Brackets, Exponents, Division/Multiplication (left to right), Addition/Subtraction (left to right). For example, in 6 + 4 &times; 3 the &times; is done first: 4 &times; 3 = 12, then 6 + 12 = 18.</li>
  <li>&times; and &divide; rank equally, and + and &minus; rank equally. When operations tie in rank, work strictly <span class="hl">left to right</span>. For example, 40 &divide; 5 &times; 2 = 8 &times; 2 = 16 (left to right), not 40 &divide; 10 = 4.</li>
  <li>Brackets are always done first, no matter what operation is written inside them. For example, 2 &times; (3 + 4) = 2 &times; 7 = <span class="hl">14</span>, whereas 2 &times; 3 + 4 is only 10.</li>
  <li>Spreadsheets, calculators and computer code all follow BEDMAS exactly &mdash; get the order wrong in one formula and every total after it is wrong too. For example, the spreadsheet formula =2+3&times;4 returns <b>14</b> (the &times; first), not 20.</li>
</ul>
<div class="kbox"><span class="kbox-tag">The order</span><span class="formula">Brackets &rarr; Exponents &rarr; &times;, &divide; <span class="muted">(left to right)</span> &rarr; +, &minus; <span class="muted">(left to right)</span></span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129380; Splitting a restaurant bill</span>
    <p>3 mains at $12 each, plus a $6 shared dessert: 3 &times; 12 + 6 = 36 + 6 = <b>$42</b>.</p>
    <p>Not 3 &times; (12 + 6) = $54 &mdash; the multiplication happens before the addition unless brackets say otherwise.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128241; Phone data plan</span>
    <p>A plan costs $20 base plus $5 per extra GB. For 3 extra GB: 20 + 5 &times; 3 = 20 + 15 = <b>$35</b>. The 5 &times; 3 is worked out before the $20 is added on.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128290; A spreadsheet formula</span>
    <p>A cell contains <code>=10+2*5</code>. It shows <b>20</b>, not 60 &mdash; computers follow BEDMAS exactly, doing 2&times;5 first, then adding 10.</p>
  </div>
</div>`,

  factors: `
<p>A <span class="term">factor</span> divides a whole number exactly, with no remainder; a <span class="term">multiple</span> is a number you land on when counting up in that number's times table.</p>
<ul class="def-list">
  <li>A <span class="term">prime</span> number has exactly two factors: 1 and itself. 1 is <em>not</em> prime, because it only has one factor. For example, 7 has only 1 and 7 as factors, so it is prime.</li>
  <li>A <span class="term">composite</span> number has more than two factors &mdash; it is neither prime nor equal to 1. Every whole number greater than 1 is either prime or composite. For example, 9 has factors 1, 3, 9 &mdash; more than two, so it is composite.</li>
  <li>Every whole number bigger than 1 breaks down into prime factors in exactly one way &mdash; its unique "atomic" fingerprint. For example, 12 = <span class="hl">2 &times; 2 &times; 3</span>, and no other set of primes multiplies to 12.</li>
  <li><span class="hl">HCF</span> (Highest Common Factor) is the largest number that divides two numbers exactly &mdash; for example, the HCF of 12 and 18 is 6.</li>
  <li><span class="hl">LCM</span> (Lowest Common Multiple) is the smallest number that both numbers divide into exactly &mdash; for example, the LCM of 4 and 6 is 12.</li>
</ul>
<div class="kbox"><span class="kbox-tag">From prime factors</span><span class="formula">HCF = primes in BOTH<br>LCM = highest power of EACH<br>HCF &times; LCM = the two numbers multiplied</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128652; Bus timetables</span>
    <p>Bus A leaves every 12 minutes, Bus B every 15 minutes. They next leave together after the <b>LCM of 12 and 15 = 60 minutes</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127852; Packing party bags</span>
    <p>You have 24 lollies and 36 chocolates to pack into identical bags with nothing left over. The most bags you can make is the <b>HCF of 24 and 36 = 12</b> (2 lollies + 3 chocolates each).</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129521; Tiling a floor</span>
    <p>A floor is 24 tiles by 18 tiles. The largest square block pattern that fits evenly uses the <b>HCF of 24 and 18 = 6</b>.</p>
  </div>
</div>`,

  powers: `
<p>An <span class="term">exponent</span> (or index) counts how many times the <span class="term">base</span> is multiplied by itself: 2&sup3; = 2&times;2&times;2 (which is <em>not</em> 2&times;3).</p>
<ul class="def-list">
  <li>Index law: when multiplying powers with the same base, <em>add</em> the exponents, never multiply them &mdash; a&#8319; &times; a&#7480; = a&#8319;&#8314;&#7480;. So 2&sup3; &times; 2&sup2; = 2&#8309; = 32, not 2&#8310; = 64.</li>
  <li>A <span class="hl">square root</span> undoes squaring &mdash; it asks "what number, multiplied by itself, gives this value?" For example, &radic;49 = 7, because 7 &times; 7 = 49.</li>
  <li>Any base to the power 0 equals 1 (a&#8304; = 1). See <em>why</em> by dividing down: 2&sup3; = 8, 2&sup2; = 4, 2&sup1; = 2 &mdash; each step halves, so 2&#8304; = 2 &divide; 2 = <span class="hl">1</span>.</li>
  <li><span class="hl teal">Scientific notation</span> writes very large or very small numbers compactly, as a value between 1 and 10 times a power of 10. Large numbers use a positive power (150,000,000 = 1.5 &times; 10&#8312;); numbers <em>smaller than 1</em> use a negative power &mdash; 0.0045 = <span class="hl">4.5 &times; 10&#8315;&sup3;</span> (the point moves 3 places right to make 4.5, so the exponent is &minus;3). The leading digit is always 1&ndash;10, so every number has exactly one form.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Index laws</span><span class="formula">a&#8319; &times; a&#7480; = a&#8319;&#8314;&#7480;<br>(a&#8319;)&#7480; = a&#8319;&#7480;<br>a&#8304; = 1</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#129440; Bacteria doubling</span>
    <p>A bacteria colony doubles every hour, starting from 1 cell. After 10 hours there are 2&#185;&#8304; = <b>1024 cells</b> &mdash; powers describe repeated doubling far faster than adding.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128190; Phone storage</span>
    <p>A phone has 128 GB of storage. 128 = 2&#8311;. Computer storage sizes (kilo, mega, giga) are built from powers of 2 and powers of 1000.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127756; Distance to the Sun</span>
    <p>The Sun is about 150,000,000 km from Earth. In scientific notation that's <b>1.5 &times; 10&#8312; km</b> &mdash; far easier to read and compare than counting zeros.</p>
  </div>
</div>`,

  patterns: `
<p>A <span class="term">sequence</span> is an ordered list of numbers built by a rule; each number is a <span class="term">term</span>, and its position in the list is n.</p>
<ul class="def-list">
  <li>A <span class="term">term-to-term rule</span> tells you how to get the next term from the one before it, e.g. "add 4".</li>
  <li>A <span class="term">position-to-term rule</span> (the nth-term rule) lets you jump straight to any term &mdash; like the 100th &mdash; without listing every term before it. For example, with rule 4n + 3, term 100 = 4 &times; 100 + 3 = <span class="hl">403</span>, with no need to list terms 1&ndash;99.</li>
  <li>The common difference in a linear sequence becomes <em>the number multiplying n</em>; a constant is then added or subtracted to shift the rule so it matches the real first term. For example, 5, 8, 11, 14&hellip; has difference 3, so the rule starts 3n; at n = 1 that gives 3 but the term is 5, so add 2 &rarr; <span class="hl">3n + 2</span>.</li>
  <li>Not every pattern grows by a constant amount &mdash; square numbers and triangular numbers grow by a changing amount each step. For example, the square numbers 1, 4, 9, 16&hellip; grow by 3, 5, 7 &mdash; a gap that keeps increasing.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Two rules</span><span class="formula">term-to-term: add the common difference<br>position-to-term: nth term = d &times; n + adjust</span></div>
<p>Going the other way &mdash; from a sequence <em>to</em> its rule &mdash; is the direction most questions actually ask. For 7, 11, 15, 19&hellip;: the difference is always +4, so the rule starts "4n". Testing n = 1 gives 4&times;1 = 4, but the real first term is 7, so add 3: the rule is <b>4n + 3</b>. Check it: n = 2 &rarr; 4&times;2+3 = 11. &#10003;</p>
<p>When the difference itself changes, look at the <span class="term">second differences</span> (the gaps between the gaps). For 2, 6, 12, 20, 30&hellip; the first differences are 4, 6, 8, 10 &mdash; each 2 more than the last &mdash; so the next gap is 12 and the next term is 42. Two families are worth knowing by name: the <span class="hl">square numbers</span> 1, 4, 9, 16&hellip; have nth term n&sup2;, and the <span class="hl">triangular numbers</span> 1, 3, 6, 10&hellip; have nth term n(n + 1) &divide; 2.</p>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127917; Theatre seating</span>
    <p>Row 1 has 10 seats, and each row behind has 4 more: 10, 14, 18, 22&hellip; The nth-term rule is 4n + 6, so row 20 has 4&times;20+6 = <b>86 seats</b> &mdash; no need to count every row in between.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128176; Loan repayments</span>
    <p>A loan balance drops the same amount each month: $2000, $1800, $1600&hellip; The term-to-term rule (subtract 200) predicts next month, but the nth-term rule predicts <b>any</b> month instantly.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127959;&#65039; A growing tiled border</span>
    <p>A tiled border around a growing pool needs 8, 12, 16, 20&hellip; tiles. Spotting the nth-term rule 4n + 4 tells you exactly how many tiles any size pool needs, without building a model first.</p>
  </div>
</div>`,

  expressions: `
<p>A <span class="term">variable</span> is a letter standing in for a number that is unknown or can change.</p>
<ul class="def-list">
  <li>A <span class="term">term</span> is one piece of an expression, like 3x; the number in front (3) is its <span class="term">coefficient</span>.</li>
  <li>Only <span class="hl">like terms</span> &mdash; terms with exactly the same letter part <em>and the same power</em> &mdash; can be combined: 3x + 5x = 8x, but 3x + 2y (different letters) and x + x&sup2; (different powers, since x&sup2; means x&times;x) cannot be combined.</li>
  <li><span class="term">Expanding</span> a bracket means multiplying every term inside it by what's outside: a(b + c) = ab + ac. If the outside number is negative, every term inside flips sign: &minus;2(x &minus; 3) = &minus;2x + 6, not &minus;2x &minus; 6.</li>
  <li><span class="term">Factorising</span> is expanding in reverse: find the highest common factor of the terms and write it outside a bracket. 6x + 9 share a common factor of 3, so 6x + 9 = <span class="hl">3(2x + 3)</span>. Check by expanding back: 3&times;2x + 3&times;3 = 6x + 9. &#10003;</li>
  <li>Two expressions are equivalent if they give the same value for every number substituted in &mdash; a fact you can spot-check by trying a number in both. For example, 2(x + 3) and 2x + 6 are equivalent: at x = 5 both give 16.</li>
</ul>
<div class="kbox"><span class="kbox-tag">The engine: distributive property</span><span class="formula">a(b + c) = ab + ac &nbsp;(expanding &mdash; and, reversed, factoring)<br>&minus;2(x &minus; 3) = &minus;2x + 6 &nbsp;(a negative outside flips every sign inside)</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128241; Phone data plan</span>
    <p>A plan costs $20 base plus $5 per GB used. The cost for g GB is the expression <b>20 + 5g</b>. Using 6 GB: 20 + 5&times;6 = <b>$50</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128661; Taxi fare</span>
    <p>A taxi charges a $4 flagfall plus $2 per kilometre: <b>4 + 2k</b>. A 9 km trip costs 4 + 2&times;9 = <b>$22</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127818; Packing lunchboxes</span>
    <p>Packing x apples, and 4 more bananas than apples, means total fruit is x + (x + 4) = <b>2x + 4</b> &mdash; collecting the two like terms (x and x) into 2x.</p>
  </div>
</div>`,

  'place-value': `
<p>Our number system is <span class="hl">base ten</span> and <span class="term">positional</span>: a numeral's value is the sum of each digit multiplied by the value of its place.</p>
<ul class="def-list">
  <li>Each digit's value depends on where it sits. Moving one place left multiplies that digit's value by <span class="hl">10</span>. For example, the 4 in 4073 is worth 4000, but the 4 in 40 is worth only 40.</li>
  <li>A number's total value is the sum of digit &times; place value (its <span class="term">expanded form</span>): 4073 = 4&times;1000 + 0&times;100 + 7&times;10 + 3.</li>
  <li>Zero is not "nothing" &mdash; it is a placeholder that holds a column open so the other digits keep their correct value. For example, in <span class="hl">405</span> the 0 keeps the 4 in the hundreds column; drop it and 405 becomes just 45.</li>
  <li>To round, look only at the digit just past the place you are keeping: 5 or more rounds up, anything less stays the same. For example, 374 to the nearest 10 &rarr; the ones digit 4 rounds down to 370, but 376 &rarr; 380.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Definition</span><span class="formula">value = &Sigma; (digit &times; place value)<br>each place is 10&times; the one on its right</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128181; Reading a price tag</span>
    <p>$1,000 and $100 look almost alike on a receipt &mdash; but one extra zero makes the first price <b>ten times</b> as much money.</p>
    <p>A cash register, a bank app and a price tag all depend on place value to keep prices honest.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128663; Car odometer</span>
    <p>A car's odometer reads <b>45,000 km</b>. After a 10 km trip it reads <b>45,010 km</b>.</p>
    <p>Only the tens and ones digits changed &mdash; the ten-thousands, thousands and hundreds digits kept their value untouched.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127758; A city's population</span>
    <p>A town of <b>84,000</b> people grows to <b>840,000</b>. That is not "a couple more digits" &mdash; it is exactly <b>ten times</b> bigger, because every digit shifted one place to the left.</p>
  </div>
</div>`,

  decimals: `
<p>Decimals are simply fractions whose denominators are <span class="hl">powers of ten</span>, so place value flows smoothly rightward into tenths, hundredths, thousandths.</p>
<ul class="def-list">
  <li>A decimal names a precise point on the number line, just like a fraction &mdash; 0.75 is exactly the same point as 3&frasl;4.</li>
  <li>To <span class="term">add or subtract</span> decimals, line up the decimal points so you combine same-size parts: tenths with tenths, hundredths with hundredths. For example, 3.4 + 0.25: line up the points &rarr; 3.40 + 0.25 = 3.65.</li>
  <li>To <span class="term">multiply</span> decimals, count the total decimal places in both numbers &mdash; the answer needs that many. This works because you are really scaling by tens: 3.6 &times; 0.4 = (36 &divide; 10) &times; (4 &divide; 10) = 36 &times; 4 &divide; 100 = 144 &divide; 100 = <span class="hl">1.44</span>.</li>
  <li>More digits does not mean a bigger number. Compare by place value: 0.5 is bigger than 0.45, even though 0.45 has more digits.</li>
  <li>To <span class="term">divide</span> by a decimal, multiply both numbers by 10 (or 100&hellip;) until the divisor is a whole number &mdash; this doesn't change the answer, just makes the division easier. e.g. 3.5 &divide; 0.5: multiply both by 10 &rarr; 35 &divide; 5 = <b>7</b>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Two rules, one reason</span><span class="formula">+ , &minus; : line up the points<br>&times; : count decimal places<br>&divide; : &times;10 both until the divisor is whole</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#128181; Supermarket receipt</span>
    <p>Milk $3.99 + Bread $4.50. Line up the points: <b>$3.99 + $4.50 = $8.49</b>.</p>
    <p>Misalign the points by mistake and you could be out by whole dollars, not just cents.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127939; Race times</span>
    <p>Two sprinters finish in <b>10.58 s</b> and <b>10.6 s</b>. Since 10.6 = 10.60, and 60 hundredths is more than 58 hundredths, the second time is actually <em>slower</em> &mdash; despite "10.6" looking like the smaller number.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128207; Measuring a plank</span>
    <p>A plank measures <b>1.75 m</b>. Cutting off <b>0.40 m</b>: line up the points, 1.75 &minus; 0.40 = <b>1.35 m</b> remains.</p>
  </div>
</div>`,

  fractions: `
<p>A fraction is a <span class="hl">number</span>, not just a slice of pizza &mdash; it marks an exact point on the number line and also means "numerator &divide; denominator".</p>
<ul class="def-list">
  <li>The <span class="term">denominator</span> names the size of each equal part; the <span class="term">numerator</span> counts how many of those parts you have. For example, in &frac34; the denominator 4 says the parts are quarters, and the numerator 3 counts three of them.</li>
  <li>Multiplying or dividing the top and bottom by the same number gives an <span class="term">equivalent fraction</span> &mdash; the same point on the number line, with a new name. For example, &frac12; = 2&frasl;4 = 3&frasl;6, all the same amount.</li>
  <li>You can only add or subtract fractions once the parts are the same size &mdash; that means finding a common denominator first. For example, &frac12; + &frac13;: rewrite both over 6 &rarr; <span class="frac"><span class="n">3</span><span class="d">6</span></span> + <span class="frac"><span class="n">2</span><span class="d">6</span></span> = <span class="hl"><span class="frac"><span class="n">5</span><span class="d">6</span></span></span>.</li>
  <li>Dividing by a fraction asks "how many of these fit?" &mdash; so 2 &divide; &frac14; asks "how many quarters fit into 2?" The shortcut is to flip the second fraction (its <span class="term">reciprocal</span> &mdash; the fraction turned upside down) and multiply instead.</li>
  <li>Multiplying does not always make things bigger. &frac12; &times; &frac13; = &frac16;, which is smaller than both &mdash; multiplying by a fraction less than 1 shrinks the amount, the opposite of multiplying by a whole number.</li>
</ul>
<div class="kbox"><span class="kbox-tag">The engine</span><span class="formula">Equivalent: &times;/&divide; top &amp; bottom alike<br>Add: same-size parts first<br>Multiply: across<br>Divide: &times; the reciprocal</span></div>
<div class="rw-examples">
  <div class="rw-card">
    ${pizzaSVG(4, 3)}
    <span class="rw-tag">&#127829; Sharing a pizza</span>
    <p>A pizza is cut into 4 equal slices. Eating 3 of them means you have eaten <b>3&frasl;4</b> of the pizza &mdash; 3 parts out of 4 equal parts.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127856; Halving a recipe</span>
    <p>A cookie recipe needs 3&frasl;4 cup of sugar. Halving the whole recipe means multiplying every fraction by 1&frasl;2: 3&frasl;4 &times; 1&frasl;2 = <b>3&frasl;8 cup</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128336; Telling the time</span>
    <p>"Quarter past" the hour is 1&frasl;4 of 60 minutes = <b>15 minutes</b>. "Half past" is 1&frasl;2 of 60 = <b>30 minutes</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#129381; Scooping flour</span>
    <p>A jar holds 2 cups of flour. Using a &frac14;-cup scoop, how many scoops empty it? That is exactly 2 &divide; &frac14; &mdash; "how many quarters fit into 2?"</p>
    <p>Flip and multiply: 2 &times; 4&frasl;1 = <b>8 scoops</b>. Counting scoops and dividing by a fraction are the same question.</p>
  </div>
</div>`,

  percentages: `
<p>"Per cent" means <span class="hl">per hundred</span> &mdash; a percentage is a fraction locked to a denominator of 100, so it converts freely between forms.</p>
<ul class="def-list">
  <li>25% = 25&frasl;100 = 0.25 = 1&frasl;4 &mdash; the same amount, written three different ways.</li>
  <li>To turn any percentage into a decimal, divide by 100 (move the point two places left): 37% = 0.37, 6.5% = 0.065. To go the other way, multiply by 100 (move it two places right): 0.6 = 60%.</li>
  <li>To find a percentage of an amount: <span class="hl">(percent &divide; 100) &times; amount</span>. For example, 20% of 150 = (20 &divide; 100) &times; 150 = <span class="hl">30</span>.</li>
  <li>A percentage is always taken <em>of</em> a particular amount, called the base. Change the base, and the same percentage becomes a different actual amount. For example, 10% of $50 is $5, but 10% of $80 is $8.</li>
  <li>Percentage changes do not simply add: a 10% rise followed by a 10% fall does <em>not</em> return you to the start, because the second 10% is of a different amount. For example, $100 rises 10% to $110, then falls 10% to $99 &mdash; not back to $100.</li>
  <li><span class="term">Working backwards:</span> if you know the price <em>after</em> a discount and need the original, the sale price is not 100% &mdash; it is (100 &minus; discount)% of the original. Divide by that percentage (as a decimal) to undo it. For example, a jacket costs $60 after 25% off, so $60 is 75% of the original: $60 &divide; 0.75 = <span class="hl">$80</span>.</li>
  <li>To find the <em>whole</em> when you know a percentage of it, use the <span class="term">1% method</span>: divide by that percentage to get 1%, then multiply by 100. If 15% of a number is 45, then 1% = 45 &divide; 15 = 3, so 100% = <span class="hl">300</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Core moves</span><span class="formula">% of amount = (% &divide; 100) &times; amount<br>whole from a part: &divide; by the % to get 1%, &times; 100<br>change is measured against the ORIGINAL</span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127991;&#65039; Shop sale</span>
    <p>An $80 jacket is 25% off. 25% of 80 = (25&divide;100)&times;80 = <b>$20 off</b>, so it now costs <b>$60</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127869;&#65039; Restaurant tip</span>
    <p>A $45 bill, 10% tip: 10% of $45 = <b>$4.50</b>. Knowing 10% (just divide by 10) makes any tip or discount easy to estimate in your head.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128200;&#128201; Rise then fall</span>
    <p>A $100 item rises 10% to $110, then falls 10%. 10% of $110 = $11, so it drops to <b>$99</b> &mdash; not back to $100, because the second 10% was taken of a bigger number.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128281; Working out the original price</span>
    <p>A jacket is on sale for <b>$60</b> after <b>25% off</b>. $60 is not the whole jacket &mdash; it's what's left after removing a quarter, so $60 is <b>75%</b> of the original.</p>
    <p>Original = 60 &divide; 0.75 = <b>$80</b>. Taking 25% off $60 (giving $45) would be the wrong direction &mdash; that undoes a discount that was never applied to $60 in the first place.</p>
  </div>
</div>`,

  integers: `
<p>Integers extend the number line to the left of zero: &hellip;&minus;3, &minus;2, &minus;1, 0, 1, 2, 3&hellip;</p>
<ul class="def-list">
  <li>Every number has an <span class="term">opposite</span> the same distance from zero; its <span class="term">absolute value</span> is that distance, ignoring the sign. For example, +5 and &minus;5 are opposites, each 5 away from zero, so |&minus;5| = 5.</li>
  <li>Adding is movement along the number line: add a positive number by moving right, add a negative number by moving <span class="hl">left</span>. For example, &minus;5 + 8: start at &minus;5 and move 8 right &rarr; 3.</li>
  <li><span class="term">Subtracting</span> a number means adding its opposite &mdash; that is why subtracting a negative makes a number bigger. For example, 4 &minus; (&minus;3) = 4 + 3 = 7.</li>
  <li>When multiplying: same signs give a <span class="hl">positive</span> answer, different signs give a <span class="hl">negative</span> answer. Why does negative &times; negative turn positive? Follow the pattern down: 3&times;(&minus;2) = &minus;6, 2&times;(&minus;2) = &minus;4, 1&times;(&minus;2) = &minus;2, 0&times;(&minus;2) = 0 &mdash; each step rises by 2, so (&minus;1)&times;(&minus;2) must be <span class="hl">+2</span>. Reversing a reversal returns the original direction.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Sign rules (with reason)</span><span class="formula">subtracting = adding the opposite<br>same signs give a <b>positive</b><br>different signs give a <b>negative</b></span></div>
<div class="rw-examples">
  <div class="rw-card">
    <span class="rw-tag">&#127777;&#65039; Morning temperature</span>
    <p>The forecast says <b>&minus;5&deg;C</b> this morning, warming to <b>3&deg;C</b> by afternoon. That is a rise of 3 &minus; (&minus;5) = <b>8&deg;C</b>, even though one of the numbers is negative.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127974; Bank balance</span>
    <p>You have $100 in your account and spend $150. Your balance becomes 100 &minus; 150 = <b>&minus;$50</b> &mdash; you are overdrawn, meaning you owe the bank money.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127754; Below sea level</span>
    <p>A submarine dives to 250 m below sea level, written <b>&minus;250 m</b>. It then rises 100 m: &minus;250 + 100 = <b>&minus;150 m</b> &mdash; still below sea level, but closer to the surface.</p>
  </div>
</div>`,

  ratios: `
<p>A <span class="term">ratio</span> is used to compare the sizes of two or more quantities measured in the same units. A <span class="term">rate</span> compares two <em>different</em> kinds of quantity, like dollars per kilogram or kilometres per hour.</p>
<ul class="def-list">
  <li>A ratio of <span class="hl">5 : 6</span> means that for every 5 of the first quantity, there are 6 of the second quantity.</li>
  <li>A ratio can also be written as a fraction of the whole. In the ratio 5 : 6 there are 5 + 6 = 11 parts altogether, so the first quantity is <span class="hl">5&frasl;11</span> of the total and the second is <span class="hl">6&frasl;11</span> of the total.</li>
  <li>Ratios can be simplified exactly like fractions &mdash; divide every part by the same number. e.g. 10 : 12 simplifies to <span class="hl">5 : 6</span> (divide both by 2).</li>
  <li>To share an amount in a given ratio, add the parts first, divide to find the value of <em>one</em> part, then multiply for each share (the <span class="term">unitary method</span>). For example, sharing $40 in 3 : 5 &rarr; 8 parts, $40 &divide; 8 = $5 each &rarr; $15 and $25.</li>
  <li>A <span class="term">rate</span> compares two <em>different</em> units. To find a <span class="term">unit rate</span>, divide so the second quantity becomes 1: $4.50 for 500 g is 4.50 &divide; 500 = <span class="hl">$0.009 per gram</span>. Reducing to "per one" is what lets you compare fairly.</li>
  <li>To find the better value, compare unit rates: 500 g for $4.50 is $0.009/g, while 750 g for $6.30 is 6.30 &divide; 750 = $0.0084/g &mdash; cheaper per gram, so better value even though it costs more in total.</li>
  <li><span class="term">Speed</span> is the most common rate: speed = distance &divide; time. 300 km in 5 hours is 300 &divide; 5 = <span class="hl">60 km/h</span>.</li>
</ul>
<div class="kbox"><span class="kbox-tag">Unitary method</span><span class="formula">total &divide; (sum of parts) = one part &rarr; multiply for each share</span></div>
<div class="rw-examples">
  <div class="rw-card">
    ${pizzaSVG(8, 3)}
    <span class="rw-tag">&#127829; Pizza night</span>
    <p>A pizza is cut into 8 equal slices. 3 have pepperoni, 5 are plain. The ratio of pepperoni to plain is <b>3 : 5</b>.</p>
    <p>That does <em>not</em> mean pepperoni is 3&frasl;5 of the pizza &mdash; there are 3 + 5 = 8 slices total, so pepperoni is 3&frasl;8 of the whole pizza. Ratio compares the two toppings to each other; fraction-of-whole compares one topping to the total.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#127912; Mixing paint</span>
    <p>A mural needs blue and white paint in the ratio 2 : 3. For every 2 tins of blue, you need 3 tins of white.</p>
    <p>Used 6 tins of blue? That's double 2, so you need double 3 = <b>9 tins of white</b> to keep the same shade.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128176; Splitting chore money</span>
    <p>Two siblings share $40 for chores in the ratio 3 : 5.</p>
    <p>3 + 5 = 8 parts. $40 &divide; 8 = $5 per part. So they get 3 &times; $5 = <b>$15</b> and 5 &times; $5 = <b>$25</b>.</p>
  </div>
  <div class="rw-card">
    <span class="rw-tag">&#128722; Best value at the shop</span>
    <p>Which is cheaper per gram: 500 g of rice for $4.50, or 750 g for $6.30?</p>
    <p>500 g: $4.50 &divide; 500 = <b>$0.009/g</b>. 750 g: $6.30 &divide; 750 = <b>$0.0084/g</b>. The bigger bag wins &mdash; always compare the <em>unit rate</em>, not the total price.</p>
  </div>
</div>`,

};
