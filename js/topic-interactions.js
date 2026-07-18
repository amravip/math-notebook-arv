/* js/topic-interactions.js
   Runs on every chapter (topics/*.html) page: mark-answer / reveal-solution / tab switching /
   collapsible sections / roadmap jump-links / retrieval reveal / bookmark toggle, and restores
   previously-saved answers from ProgressStore on load. Answer-checking logic (normAns/isCorrect)
   preserved verbatim from the original prototype. */
(function () {
  'use strict';
  var PS = window.ProgressStore;
  var topicId = window.CURRENT_TOPIC_ID;
  if (!topicId) return;
  // Read live rather than capturing once: on dynamic topics, quiz-engine.js populates
  // window.TOPIC_CHECK from an inline <script> that runs AFTER this file loads, so a one-time
  // capture at parse time would permanently see an empty object.
  function CHECK() { return window.TOPIC_CHECK || {}; }

  function normAns(s) {
    var x = String(s).toLowerCase().trim().replace(/\s+/g, '');
    // Answer keys use the true minus sign (− U+2212); nobody's keyboard types that. Normalise it
    // (and the visually-identical en/em dashes some autocorrect substitutes) to a plain hyphen so
    // "-4" and "−4" compare equal.
    x = x.replace(/[−–—]/g, '-');
    x = x.replace(/[°º²³]/g, '').replace(/,/g, '').replace(/π/g, 'pi');
    x = x.replace(/squared|cubed/g, '');
    x = x.replace(/\$/g, '');       // "$51" and "51" are the same answer
    x = x.replace(/centimet(re|er)s?|millimet(re|er)s?|met(re|er)s?/g, '');
    x = x.replace(/cm|mm/g, '').replace(/units?/g, '').replace(/degrees?|deg/g, '');
    x = x.replace(/times/g, '');    // "10 times" answers "how many times bigger" as validly as "10"
    x = x.replace(/(\d)m$/, '$1');
    x = x.replace(/gradient=|^[a-z]=/, '');
    return x;
  }

  // Multi-part answers ("$18 and $27", "9600 and 10 000", "1/6 and 1/2"): split into ordered parts
  // so "18, 27", "18 and 27" and "18 27" all match. Parts are compared in order (ordering questions
  // stay strict), letters-only fragments like a stray unit "m" are dropped, and "10 000"/"10,000"
  // style thousands groupings are joined BEFORE splitting so they don't read as two parts.
  function normParts(s) {
    var x = String(s).toLowerCase().trim();
    // Normalise the true minus sign (and en/em dashes) to a plain hyphen, exactly as normAns does —
    // otherwise a multi-part answer containing a negative (e.g. "9 and −9") only matches when typed
    // with the "and" separator, and parseFloat can't read "−9" for the numeric-tolerance compare.
    x = x.replace(/[−–—]/g, '-');
    x = x.replace(/[°º²³()]/g, '').replace(/\$/g, '').replace(/π/g, 'pi');
    x = x.replace(/(\d)[ ,](?=\d\d\d(\D|$))/g, '$1');
    return x.split(/(?:and|[,;&\s])+/).filter(function (p) { return p && !/^[a-z%]+$/.test(p); });
  }
  function partsMatch(iParts, aParts) {
    if (aParts.length < 2 || iParts.length !== aParts.length) return false;
    for (var k = 0; k < aParts.length; k++) {
      var a = aParts[k], b = iParts[k];
      if (a === b) continue;
      // Exact numeric equality only (handles "376.80" vs "376.8"). No rounding tolerance here:
      // ordering questions have neighbouring parts as close as 0.02 apart, so any slack would
      // accept a wrongly-ordered list.
      var fa = parseFloat(a), fb = parseFloat(b);
      if (isNaN(fa) || isNaN(fb) || Math.abs(fa - fb) > 1e-9) return false;
    }
    return true;
  }

  function isCorrect(input, acceptRaw) {
    var n = normAns(input); if (!n) return false;
    var acc = acceptRaw.map(normAns);
    if (acc.indexOf(n) !== -1) return true;
    if (/^-?\d*\.?\d+$/.test(n)) {
      var f = parseFloat(n);
      for (var i = 0; i < acc.length; i++) { var af = parseFloat(acc[i]); if (!isNaN(af) && Math.abs(af - f) < 0.06) return true; }
    }
    var ip = normParts(input);
    for (var j = 0; j < acceptRaw.length; j++) { if (partsMatch(ip, normParts(acceptRaw[j]))) return true; }
    return false;
  }
  window.TopicEngine = { normAns: normAns, isCorrect: isCorrect, getCheckMap: CHECK };

  function applyMark(ex, v, verdict) {
    ex.classList.add('attempted');
    ex.classList.toggle('correct', verdict === 'correct');
    ex.classList.toggle('wrong', verdict === 'wrong');
    var input = ex.querySelector('.ans-input'); input.value = v; input.readOnly = true;
    ex.querySelector('.your-answer .txt').textContent = v;
    var mb = ex.querySelector('.markbtn'); mb.disabled = true;
    mb.innerHTML = verdict === 'correct' ? '✓ Correct' : verdict === 'wrong' ? '✗ Incorrect' : '✓ Answer marked';
    var rev = ex.querySelector('.reveal'); rev.classList.remove('locked');
    if (verdict === 'wrong') { ex.classList.add('open'); rev.innerHTML = '▾ Hide solution'; }
  }

  function updateChapterProgress() {
    var n = PS.topicAnsweredCount(topicId);
    document.querySelectorAll('.topic-prog[data-tid="' + topicId + '"]').forEach(function (p) {
      p.textContent = n + ' / ' + PS.QUESTIONS_PER_TOPIC;
      p.classList.toggle('full', n >= PS.QUESTIONS_PER_TOPIC);
    });
  }

  function restoreAnswers() {
    var state = PS.load();
    var healed = false;
    document.querySelectorAll('.ex').forEach(function (ex) {
      var k = ex.dataset.key, v = state.answers[k];
      if (v !== undefined && v !== '') {
        var stored = state.results[k], meta = CHECK()[k];
        // Re-mark against the CURRENT checking rules rather than trusting the stored verdict, so
        // answers mis-marked under older, stricter rules (e.g. "18, 27" for "$18 and $27") heal
        // themselves on the next visit — including the XP the learner should have earned.
        var verdict = meta ? (isCorrect(v, meta) ? 'correct' : 'wrong') : (stored || 'answered');
        if (meta && stored && stored !== verdict) {
          state.results[k] = verdict;
          if (verdict === 'correct') PS.addXp(10);
          healed = true;
        }
        applyMark(ex, v, verdict);
      }
    });
    if (healed) PS.save();
    updateChapterProgress();
  }

  document.addEventListener('DOMContentLoaded', function () {
    restoreAnswers();

    // Revise mode is a global toggle (set on the Progress page); apply it here too.
    if (localStorage.getItem('mathsNotebook.reviseMode') === '1') document.body.classList.add('revise');

    // Bookmark button
    var bmBtn = document.querySelector('.bookmark-btn');
    if (bmBtn) {
      var setBookmarkUi = function (on) {
        bmBtn.classList.toggle('on', on);
        bmBtn.innerHTML = on ? '★ Bookmarked' : '☆ Bookmark this chapter';
      };
      setBookmarkUi(PS.isBookmarked(topicId));
      bmBtn.addEventListener('click', function () { setBookmarkUi(PS.toggleBookmark(topicId)); });
    }

    document.addEventListener('click', function (e) {
      var jump = e.target.closest('.hf-jump');
      if (jump) {
        var target = document.querySelector('[data-section="' + jump.dataset.target + '"]');
        if (target) { target.classList.remove('collapsed'); target.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
        return;
      }
      var hfr = e.target.closest('.hf-reveal');
      if (hfr) {
        var host = hfr.closest('li,.hf-sec'); var hid = host && host.querySelector('.hf-hidden');
        if (hid) { if (!hfr.dataset.lbl) hfr.dataset.lbl = hfr.textContent; var on2 = hid.classList.toggle('show'); hfr.textContent = on2 ? 'Hide' : hfr.dataset.lbl; }
        return;
      }
      var secTag = e.target.closest('.hf-tag');
      if (secTag) { var sec = secTag.closest('.hf-sec'); if (sec) sec.classList.toggle('collapsed'); return; }

      var tab = e.target.closest('.tab');
      if (tab) {
        var wrap = tab.closest('.hf-sec') || document;
        wrap.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); });
        tab.classList.add('on');
        wrap.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.dataset.lv === tab.dataset.lv); });
        return;
      }

      var mb = e.target.closest('.markbtn');
      if (mb) {
        if (mb.disabled) return;
        var ex = mb.closest('.ex'); var input = ex.querySelector('.ans-input'); var v = input.value.trim();
        if (!v) { input.classList.add('nudge'); input.focus(); setTimeout(function () { input.classList.remove('nudge'); }, 350); return; }
        var key = ex.dataset.key, meta = CHECK()[key];
        var verdict = meta ? (isCorrect(v, meta) ? 'correct' : 'wrong') : 'answered';
        applyMark(ex, v, verdict);
        PS.recordAnswer(key, v, verdict);
        updateChapterProgress();
        return;
      }

      var rev = e.target.closest('.reveal');
      if (rev) {
        var exr = rev.closest('.ex');
        if (!exr.classList.contains('attempted')) {
          var inputr = exr.querySelector('.ans-input'); inputr.classList.add('nudge'); inputr.focus();
          inputr.placeholder = 'Write your answer, then press Mark answer first';
          setTimeout(function () { inputr.classList.remove('nudge'); }, 350); return;
        }
        exr.classList.toggle('open');
        rev.innerHTML = exr.classList.contains('open') ? '▾ Hide solution' : '🔒 Show solution';
        return;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList.contains('ans-input')) {
        e.preventDefault(); e.target.closest('.ex').querySelector('.markbtn').click();
      }
    });
  });
})();
