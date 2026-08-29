/* js/progress-store.js
   Shared progress data layer, used by every page. Replaces the original single-page prototype's
   `window.storage.get/set` calls (not a real browser API — progress silently never saved once
   deployed) with real localStorage, so progress actually persists on GitHub Pages.
   Global so plain <script> tags on every page can use it without a build step / module system. */
(function (global) {
  'use strict';
  var KEY = 'mathsNotebook.progress.v1';
  var TOTAL_TOPICS = 24;
  var QUESTIONS_PER_TOPIC = 30;
  var TOTAL_QUESTIONS = TOTAL_TOPICS * QUESTIONS_PER_TOPIC;

  function defaultState() {
    return {
      answers: {},      // "topicId|level|index" -> typed answer string
      results: {},       // same key -> 'correct' | 'wrong' | 'answered'
      seeds: {},         // topicId -> RNG seed (dynamic topics only)
      bookmarks: {},      // topicId -> true
      xp: 0,
      streak: { count: 0, lastActiveDay: null },
      badges: [],
      gym: {},           // practice-book area -> { attempts, correct, best }
      flags: {},         // "topicId|kind|id" -> true — small per-chapter UI state, e.g. reflection ticks
      marks: {}          // topicId -> id of the furthest section reached, for "resume where you left off"
    };
  }

  var state = null;

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
      state.answers = state.answers || {};
      state.results = state.results || {};
      state.seeds = state.seeds || {};
      state.bookmarks = state.bookmarks || {};
      state.streak = state.streak || { count: 0, lastActiveDay: null };
      state.badges = state.badges || [];
      state.gym = state.gym || {};
      state.flags = state.flags || {};
      state.marks = state.marks || {};
    } catch (err) {
      console.warn('Progress could not be read, starting fresh.', err);
      state = defaultState();
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { console.error('Could not save progress.', err); }
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  function markDailyActive() {
    load();
    var today = todayKey(), s = state.streak;
    if (s.lastActiveDay === today) return;
    if (s.lastActiveDay == null) s.count = 1;
    else {
      var gap = daysBetween(s.lastActiveDay, today);
      s.count = gap === 1 ? s.count + 1 : 1;
    }
    s.lastActiveDay = today;
    save();
  }

  function addXp(amount) { load(); state.xp = Math.max(0, state.xp + amount); save(); return state.xp; }

  var BADGES = [
    { id: 'first-chapter', name: 'First Chapter', icon: '📖', earned: function (s) { return Object.keys(s.answers).some(function (k) { return s.answers[k]; }); } },
    { id: 'century', name: 'Century', icon: '💯', earned: function (s) { return Object.values(s.results).filter(function (r) { return r === 'correct'; }).length >= 100; } },
    { id: 'streak-7', name: '7-Day Streak', icon: '🔥', earned: function (s) { return s.streak.count >= 7; } },
    { id: 'bookworm', name: 'Bookworm', icon: '🐛', earned: function (s) { return topicsCompleted(s) >= 6; } },
    { id: 'scholar', name: 'Scholar', icon: '🎓', earned: function (s) { return topicsCompleted(s) >= 24; } }
  ];

  function checkBadges() {
    load();
    var earned = [];
    BADGES.forEach(function (b) {
      if (state.badges.indexOf(b.id) === -1 && b.earned(state)) { state.badges.push(b.id); earned.push(b); }
    });
    if (earned.length) save();
    return earned;
  }

  function recordAnswer(key, value, verdict) {
    load();
    state.answers[key] = value;
    state.results[key] = verdict;
    markDailyActive();
    if (verdict === 'correct') addXp(10); else if (verdict === 'answered') addXp(4);
    checkBadges();
    save();
  }

  function clearAllAnswers() {
    load();
    state.answers = {}; state.results = {}; state.seeds = {};
    save();
  }

  function getSeed(topicId) {
    load();
    if (!(topicId in state.seeds)) state.seeds[topicId] = (Math.random() * 2147483647) | 0;
    return state.seeds[topicId];
  }
  function reseed(topicId) { load(); state.seeds[topicId] = (Math.random() * 2147483647) | 0; save(); return state.seeds[topicId]; }

  // Generic tiny-state store for per-chapter UI the learner expects to survive a reload but that is
  // not an answer — currently the reflection checklist. Keyed "topicId|kind|id".
  function getFlag(key) { load(); return !!state.flags[key]; }
  function setFlag(key, on) {
    load();
    if (on) state.flags[key] = true; else delete state.flags[key];
    save();
    return on;
  }

  // Furthest section reached in a chapter. A chapter is ~9000px of scrolling, so returning to the
  // very top every visit makes picking up where you left off a chore.
  function getMark(topicId) { load(); return state.marks[topicId] || null; }
  function setMark(topicId, section) {
    load();
    if (state.marks[topicId] === section) return;
    if (section) state.marks[topicId] = section; else delete state.marks[topicId];
    save();
  }

  function toggleBookmark(topicId) {
    load();
    if (state.bookmarks[topicId]) delete state.bookmarks[topicId]; else state.bookmarks[topicId] = true;
    save();
    return !!state.bookmarks[topicId];
  }
  function isBookmarked(topicId) { load(); return !!state.bookmarks[topicId]; }
  function bookmarkedIds() { load(); return Object.keys(state.bookmarks); }

  function topicAnsweredCount(topicId) {
    load();
    var n = 0;
    Object.keys(state.answers).forEach(function (k) { if (k.indexOf(topicId + '|') === 0 && state.answers[k] !== '') n++; });
    return n;
  }
  function topicsCompleted(s) {
    s = s || load();
    var ids = {};
    Object.keys(s.answers).forEach(function (k) { if (s.answers[k] !== '') ids[k.split('|')[0]] = (ids[k.split('|')[0]] || 0) + 1; });
    return Object.keys(ids).filter(function (id) { return ids[id] >= QUESTIONS_PER_TOPIC; }).length;
  }

  function globalStats() {
    load();
    var answered = Object.values(state.answers).filter(function (v) { return v !== ''; }).length;
    var correct = 0, wrong = 0;
    Object.values(state.results).forEach(function (r) { if (r === 'correct') correct++; else if (r === 'wrong') wrong++; });
    return {
      answered: answered, total: TOTAL_QUESTIONS,
      correct: correct, wrong: wrong,
      topicsDone: topicsCompleted(state), totalTopics: TOTAL_TOPICS,
      xp: state.xp, streak: state.streak.count
    };
  }

  global.ProgressStore = {
    load: load, save: save,
    recordAnswer: recordAnswer, clearAllAnswers: clearAllAnswers,
    getSeed: getSeed, reseed: reseed,
    toggleBookmark: toggleBookmark, isBookmarked: isBookmarked, bookmarkedIds: bookmarkedIds,
    getFlag: getFlag, setFlag: setFlag, getMark: getMark, setMark: setMark,
    topicAnsweredCount: topicAnsweredCount, globalStats: globalStats,
    addXp: addXp, markDailyActive: markDailyActive, checkBadges: checkBadges,
    BADGES: BADGES, QUESTIONS_PER_TOPIC: QUESTIONS_PER_TOPIC, TOTAL_QUESTIONS: TOTAL_QUESTIONS
  };
})(window);
