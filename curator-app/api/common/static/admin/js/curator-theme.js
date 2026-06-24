'use strict';

/**
 * Curator admin theme: simple light/dark flip (no confusing auto/light/dark cycle).
 * Persists to localStorage key "theme" for compatibility with Django admin CSS.
 */
(function () {
  const STORAGE_KEY = 'theme';

  function resolvedTheme(mode) {
    if (mode === 'light' || mode === 'dark') {
      return mode;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(mode) {
    const normalized =
      mode === 'light' || mode === 'dark' || mode === 'auto' ? mode : 'auto';
    document.documentElement.dataset.theme = normalized;
    localStorage.setItem(STORAGE_KEY, normalized);
  }

  function toggleTheme() {
    const stored = localStorage.getItem(STORAGE_KEY) || 'auto';
    const current = resolvedTheme(stored);
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  applyTheme(localStorage.getItem(STORAGE_KEY) || 'auto');

  window.addEventListener('load', function () {
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', toggleTheme);
    });
  });
})();
