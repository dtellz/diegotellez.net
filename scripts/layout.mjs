export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pdfPath = '/assets/Diego-Tellez-CV.pdf';
export const downloadLink = (className = '') => `<a${className ? ` class="${esc(className)}"` : ''} href="${pdfPath}" download="Diego-Tellez-CV.pdf" type="application/pdf">Download CV · PDF <span aria-hidden="true">↓</span></a>`;

export function documentHead({ title, description, canonical, resume = false, noindex = false, redirect, person }) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111313">
  <meta name="color-scheme" content="dark light">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  ${redirect ? `<meta http-equiv="refresh" content="0; url=${esc(redirect)}">` : ''}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  ${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/landing.css">
  ${resume ? '<link rel="stylesheet" href="/assets/css/resume.css">' : ''}
  <link rel="alternate" type="application/json" href="/.well-known/profile.json" title="Structured professional profile">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Machine-readable profile">
  <script>try{const theme=localStorage.getItem('dt-theme');if(theme==='light'||theme==='dark')document.documentElement.dataset.theme=theme;}catch{}</script>
  ${person ? `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>` : ''}
  <script type="module" src="/assets/js/landing.js"></script>
</head>`.split('\n').filter(line => line.trim()).join('\n');
}

export function siteHeader(page = 'home') {
  return `<header class="site-header">
      <a class="identity" href="/" aria-label="Diego Téllez, home"><span class="prompt" aria-hidden="true">&gt;</span> dtellz<span class="path"> / ${esc(page)}</span></a>
      <nav aria-label="Main navigation">
        <a href="/#work">work</a>
        <a href="/#approach">approach</a>
        <a href="/#about">about</a>
        <a href="/resume/"${page === 'résumé' ? ' aria-current="page"' : ''}>résumé <span aria-hidden="true">↗</span></a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Use light theme" hidden>
        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z"/></svg>
      </button>
    </header>`;
}

export function siteFooter() {
  return `<footer class="site-footer"><span>© <span data-year>${new Date().getFullYear()}</span> Diego Téllez</span>${downloadLink()}<a href="#main">Back to top <span aria-hidden="true">↑</span></a></footer>`;
}

export function documentPage({ page, body, ...head }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
${documentHead(head)}
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="page-shell">
    ${siteHeader(page)}
    <main id="main">${body}</main>
    ${siteFooter()}
  </div>
</body>
</html>
`;
}
