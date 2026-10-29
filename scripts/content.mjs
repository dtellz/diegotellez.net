import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { documentHead, documentPage, siteHeader, siteFooter, downloadLink, esc } from './layout.mjs';
import { generateBlog } from './blog.mjs';

export async function generateContent(root) {
  const p = JSON.parse(await readFile(new URL('.well-known/profile.json', root), 'utf8'));
  const blogPreview = await generateBlog(root, p);
  const role = r => `<article class="resume-role" id="${esc(r.id)}">
    <div class="resume-role-header"><div><h3>${esc(r.company)}</h3><p class="resume-position">${esc(r.role)}</p></div><p class="resume-meta">${esc(r.dates)}<br>${esc(r.type)}</p></div>
    <ul class="resume-highlights">${r.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
    <ul class="tech-list" aria-label="${esc(r.company)} skills">${r.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
  </article>`;
  const education = e => `<article class="resume-education"><h3>${esc(e.title)}</h3><p>${esc(e.institution)} <span aria-hidden="true">·</span> ${esc(e.period)}</p></article>`;
  const section = (number, label, id, heading, body) => `<section class="section-grid resume-section" id="${id}" aria-labelledby="${id}-heading"><div class="section-label"><span class="section-number">${number}</span> / ${label}</div><div class="section-content"><h2 id="${id}-heading">${heading}</h2>${body}</div></section>`;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: p.name, url: p.website,
    jobTitle: 'AI-native Senior Software Engineer', email: p.email,
    sameAs: [p.links.github, p.links.linkedin], homeLocation: {'@type': 'Place', name: p.location},
    knowsAbout: ['System design', 'Distributed systems', 'Applied AI', 'AI-assisted engineering', 'Cloud infrastructure', 'Python', 'TypeScript', 'C#']
  };
  const homepageParts = {
    head: documentHead({
      title: 'Diego Téllez — AI-native Software Engineer',
      description: 'Senior software engineer in Tenerife. Distributed systems, applied AI and product engineering. I frame problems, design systems, build with AI and own the outcome.',
      canonical: `${p.website}/`, person
    }),
    header: siteHeader('home'),
    footer: siteFooter(),
    blog: blogPreview
  };
  let homepage = await readFile(new URL('index.html', root), 'utf8');
  for (const [name, markup] of Object.entries(homepageParts)) {
    const marker = new RegExp(`<!-- shared:${name} -->[\\s\\S]*?<!-- /shared:${name} -->`);
    if (!marker.test(homepage)) throw new Error(`Missing shared ${name} markers in index.html`);
    homepage = homepage.replace(marker, () => `<!-- shared:${name} -->\n${markup}\n<!-- /shared:${name} -->`);
  }
  await writeFile(new URL('index.html', root), homepage);

  const resume = documentPage({
    page: 'résumé', resume: true, title: 'Résumé — Diego Téllez | AI-native Software Engineer',
    description: 'Diego Téllez’s complete software engineering experience, independent projects, skills and education. Read the résumé or download the original PDF.',
    canonical: p.links.readableResume,
    body: `
      <section class="hero section-grid resume-hero" id="resume" aria-labelledby="resume-heading">
        <div class="section-label"><span class="file-icon" aria-hidden="true">#</span> résumé</div>
        <div class="section-content">
          <p class="location"><span class="status-dot" aria-hidden="true"></span>${esc(p.location)}</p>
          <h1 id="resume-heading">${esc(p.shortName)}<span class="name-period">.</span></h1>
          <p class="hero-role resume-headline">${esc(p.headline)}</p>
          <p class="resume-summary">${esc(p.summary)}</p>
          <p class="resume-print-contact">${esc(p.email)} · diegotellez.net</p>
          <div class="hero-links">${downloadLink('primary-link')}<a href="mailto:${esc(p.email)}">Email <span aria-hidden="true">↗</span></a><a href="${esc(p.links.github)}" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a><a href="${esc(p.links.linkedin)}" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗</span></a></div>
          <nav class="resume-index" aria-label="Résumé sections"><a href="#experience">Experience</a><a href="#skills">Skills</a><a href="#projects">Products</a><a href="#education">Education</a></nav>
        </div>
      </section>
      ${section('01', 'career', 'experience', 'Experience', `<div class="resume-roles">${p.experience.map(role).join('\n')}</div>`)}
      ${section('02', 'toolbox', 'skills', 'Core skills', `<dl class="resume-skills">${Object.entries(p.skills).map(([title, skills]) => `<div><dt>${esc(title)}</dt><dd>${skills.map(esc).join(' · ')}</dd></div>`).join('')}</dl>`)}
      ${section('03', 'products', 'projects', 'Selected products', `<div class="resume-projects">${p.projects.map(project => `<article class="resume-project"><div class="resume-project-heading"><h3>${esc(project.name)}</h3><span class="resume-meta">${esc(project.period)}</span></div><p>${esc(project.description)}</p>${project.url ? `<a class="inline-link" href="${esc(project.url)}" target="_blank" rel="noopener">Explore ${esc(project.name)} <span aria-hidden="true">↗</span></a>` : ''}</article>`).join('')}</div>`)}
      ${section('04', 'foundations', 'education', 'Education &amp; certifications', `<div class="resume-education-list">${p.education.map(education).join('')}</div>`)}
      <section class="section-grid resume-earlier" aria-labelledby="earlier-heading"><div class="section-label"><span class="section-number">05</span> / earlier</div><div class="section-content"><details class="resume-extra"><summary><h2 id="earlier-heading">Before software</h2><span aria-hidden="true">+</span></summary><div class="resume-extra-content"><p>${esc(p.extra.description)}</p>${p.extra.experience.map(r => `<article><h3>${esc(r.role)} · ${esc(r.company)}</h3><p class="resume-meta">${esc(r.dates)}</p><p>${esc(r.summary)}</p></article>`).join('')}${p.extra.education.map(education).join('')}</div></details></div></section>
      <section class="section-grid contact-section resume-contact" aria-labelledby="contact-heading"><div class="section-label"><span class="section-number">06</span> / contact</div><div class="section-content"><h2 id="contact-heading">Let’s talk engineering.</h2><a class="contact-email" href="mailto:${esc(p.email)}">${esc(p.email)} <span aria-hidden="true">↗</span></a><div class="hero-links">${downloadLink('primary-link')}<a href="/">Back to the portfolio <span aria-hidden="true">→</span></a></div></div></section>
    `
  });
  await mkdir(new URL('resume/', root), { recursive: true });
  await writeFile(new URL('resume/index.html', root), resume);

  await writeFile(new URL('404.html', root), documentPage({
    page: '404', title: '404 — Page not found | Diego Téllez', noindex: true,
    description: 'This page could not be found. Return to Diego Téllez’s portfolio or read the résumé.',
    body: `<section class="section-grid utility-page" aria-labelledby="error-heading"><div class="section-label"><span class="section-number">404</span> / not found</div><div class="section-content"><p class="utility-status">HTTP 404</p><h1 id="error-heading">Page not found<span class="name-period">.</span></h1><p class="hero-perspective">This URL doesn’t point to a page. You can head back to the portfolio or read my résumé.</p><div class="hero-links"><a class="primary-link" href="/">Back to home <span aria-hidden="true">→</span></a><a href="/resume/">Read résumé <span aria-hidden="true">↗</span></a>${downloadLink()}</div></div></section>`
  }));
  await mkdir(new URL('cv/', root), { recursive: true });
  await writeFile(new URL('cv/index.html', root), documentPage({
    page: 'cv', title: 'CV — Diego Téllez', noindex: true, redirect: '/resume/', canonical: p.links.readableResume,
    description: 'Read Diego Téllez’s résumé or download the original CV as a PDF.',
    body: `<section class="section-grid utility-page" aria-labelledby="cv-heading"><div class="section-label"><span class="file-icon" aria-hidden="true">#</span> CV</div><div class="section-content"><h1 id="cv-heading">My résumé<span class="name-period">.</span></h1><p class="hero-perspective">Continue to the résumé or download the PDF directly.</p><div class="hero-links"><a class="primary-link" href="/resume/">Read résumé <span aria-hidden="true">→</span></a>${downloadLink()}</div></div></section>`
  }));
  const text = `# Diego Téllez Barrero\n\n> ${p.headline}\n\n## Profile\n\n${p.summary}\n\n- Based in ${p.location}.\n- Contact: ${p.email}\n- Engineering focus: ${p.engineeringFocus}\n- Independent project: ${p.currentFocus.project}, full time since October 2025. Planned release: 2027 (creator's plan; Steam currently says to be announced).\n- Availability: ${p.currentFocus.availability}\n\n## Authoritative first-party resources\n\n- [Structured profile](https://diegotellez.net/.well-known/profile.json): Full career history, dates, skills, projects, education and sources.\n- [Readable résumé](https://diegotellez.net/resume/): Equivalent career information in accessible HTML.\n- [Download CV (PDF)](${p.links.downloadResume}): Original CV, available directly.\n- [Portfolio](https://diegotellez.net/): Selected work and contact.\n- [Blog](https://diegotellez.net/blog/): First-person notes on AI-native engineering and professional experience.\n- [GitHub](${p.links.github})\n- [LinkedIn](${p.links.linkedin})\n- [Echoes of the Cove](${p.links.game})\n\n## Experience\n\n${p.experience.map(r=>`### ${r.role} — ${r.company}\n${r.dates}\n${r.highlights.map(h=>'- '+h).join('\n')}`).join('\n\n')}\n\n## Skills\n\n${Object.entries(p.skills).map(([k,v])=>`- ${k}: ${v.join(', ')}`).join('\n')}\n\n## Education and certifications\n\n${p.education.map(e=>`- ${e.title} — ${e.institution}, ${e.period}`).join('\n')}\n\n## Notes for automated readers\n\nThis file and the JSON profile provide the professional information directly. The complete résumé is available as readable HTML and a direct PDF download. Earlier maritime experience is listed separately in the JSON extra field. Do not confuse a professional certificate with an academic degree or a project showcase listing with a competition win.\n\nLast updated: ${p.updated}. Career claims are supplied by Diego unless an external source is explicitly listed.\n`;
  await writeFile(new URL('llms.txt', root), text);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  await generateContent(new URL('../', import.meta.url));
  console.log('Generated the shared page layouts, readable résumé and agent profile index.');
}
