const themeToggle = document.querySelector('.theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');

function syncTheme() {
  const light = document.documentElement.dataset.theme === 'light';
  themeToggle?.setAttribute('aria-label', light ? 'Use dark theme' : 'Use light theme');
  themeToggle?.setAttribute('title', light ? 'Use dark theme' : 'Use light theme');
  themeColor?.setAttribute('content', light ? '#f8f8f4' : '#111313');
}

if (themeToggle) {
  syncTheme();
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('dt-theme', theme); } catch {}
    syncTheme();
  });
}

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = String(new Date().getFullYear());
});
