/* js/nav.js
   Top navigation bar: the 5 page links (Cover/Contents/Practice/Progress/About) plus a mobile
   toggle. The full 24-chapter list now lives only on contents.html (with its own search), and
   read-progress ticks are shown there too — this file no longer builds a persistent chapter list,
   since every chapter page already has Previous/Next and Contents is one click away everywhere.
   Expects `window.SITE_ROOT` ('' at root, '../' inside topics/) to be set before this script runs. */
(function () {
  'use strict';
  var ROOT = window.SITE_ROOT || '';
  var nav = document.getElementById('nav');
  if (!nav) return;

  var PAGES = [
    ['index.html', 'Cover'],
    ['contents.html', 'Contents'],
    ['practice.html', 'Practice'],
    ['progress.html', 'Progress'],
    ['about.html', 'About']
  ];
  var here = (location.pathname.split('/').pop() || 'index.html');
  // A chapter page isn't one of the 5 pages itself, but it lives under Contents conceptually.
  var onChapterPage = !!window.CURRENT_TOPIC_ID;

  PAGES.forEach(function (p) {
    var a = document.createElement('a');
    a.href = ROOT + p[0];
    a.textContent = p[1];
    var isActive = onChapterPage ? p[0] === 'contents.html' : here === p[0];
    if (isActive) a.classList.add('active');
    nav.appendChild(a);
  });

  var navtoggle = document.getElementById('navtoggle');
  if (navtoggle) {
    navtoggle.addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) document.body.classList.remove('nav-open');
    });
  }
})();
