(function () {
  const root = document.documentElement;
  const SCROLL_SELECTOR = 'html, .page-scroll, .main-content, .tech-sidebar';

  function getSavedTheme() {
    try { return localStorage.getItem('fluxsecs-theme') === 'light' ? 'light' : 'dark'; }
    catch (error) { return 'dark'; }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  }

  const timers = new WeakMap();
  function markScrolling(el) {
    if (!el) return;
    el.classList.add('is-scrolling');
    const prev = timers.get(el);
    if (prev) window.clearTimeout(prev);
    const t = window.setTimeout(() => el.classList.remove('is-scrolling'), 700);
    timers.set(el, t);
  }
  function relevantHosts() {
    const hosts = [root];
    document.querySelectorAll('.page-scroll, .main-content, .tech-sidebar').forEach(el => hosts.push(el));
    return hosts;
  }
  function showAllRelevant() { relevantHosts().forEach(markScrolling); }
  function showForTarget(target) {
    const host = target && target.closest ? target.closest('.page-scroll, .main-content, .tech-sidebar') : null;
    markScrolling(host || root);
  }

  function syncThemeButton() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    const isLight = root.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isLight ? '切換為深色模式' : '切換為淺色模式');
    btn.title = isLight ? '切換為深色模式' : '切換為淺色模式';
  }

  applyTheme(getSavedTheme());
  document.documentElement.lang = 'zh-Hant';

  document.addEventListener('click', function (event) {
    const themeBtn = event.target.closest('#themeBtn');
    if (!themeBtn) return;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('fluxsecs-theme', next); } catch (error) {}
    syncThemeButton();
  });

  window.addEventListener('scroll', function () { markScrolling(root); }, { passive: true });
  document.addEventListener('scroll', function (event) { showForTarget(event.target); }, { passive: true, capture: true });
  ['wheel', 'touchmove'].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) { showForTarget(event.target); }, { passive: true, capture: true });
  });
  window.addEventListener('keydown', function (event) {
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
    if (!keys.includes(event.code) && !keys.includes(event.key)) return;
    showAllRelevant();
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { syncThemeButton(); }, { once: true });
  } else { syncThemeButton(); }

  window.addEventListener('storage', function (event) {
    if (event.key === 'fluxsecs-theme') { applyTheme(getSavedTheme()); syncThemeButton(); }
  });
})();
