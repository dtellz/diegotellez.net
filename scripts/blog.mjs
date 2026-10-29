import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { documentPage, esc } from './layout.mjs';

const postPath = post => `/blog/${post.slug}/`;
const displayDate = date => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${date}T12:00:00Z`));
const plainText = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function postMeta(post) {
  return `<p class="writing-meta"><time datetime="${esc(post.date)}">${esc(displayDate(post.date))}</time><span aria-hidden="true">/</span><span>${post.minutes} min read</span></p>`;
}

function postPreview(post, heading = 'h2') {
  return `<article class="writing-entry">
    ${postMeta(post)}
    <${heading}><a href="${postPath(post)}">${esc(post.title)} <span aria-hidden="true">↗</span></a></${heading}>
    <p class="writing-description">${esc(post.description)}</p>
    <ul class="tech-list" aria-label="Post topics">${post.tags.map(tag => `<li>${esc(tag)}</li>`).join('')}</ul>
    <a class="inline-link writing-read" href="${postPath(post)}">Read the post <span aria-hidden="true">→</span></a>
  </article>`;
}

export async function generateBlog(root, profile) {
  const metadata = JSON.parse(await readFile(new URL('content/posts.json', root), 'utf8'));
  const slugs = new Set();
  const posts = [];
  for (const post of metadata) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug)) {
      throw new Error(`Invalid or duplicate blog slug: ${post.slug}`);
    }
    slugs.add(post.slug);
    const source = await readFile(new URL(`content/${post.body}`, root), 'utf8');
    const figure = post.image ? `<figure class="post-figure">
      <a href="${esc(post.image.path)}" target="_blank" rel="noopener" aria-label="Open the beta invitation screenshot at full size">
        <img src="${esc(post.image.path)}" width="${post.image.width}" height="${post.image.height}" alt="${esc(post.image.alt)}" loading="lazy" decoding="async">
      </a>
      <figcaption>${esc(post.image.caption)} <a href="${esc(post.image.path)}" target="_blank" rel="noopener">View full size <span aria-hidden="true">↗</span></a></figcaption>
    </figure>` : '';
    const body = source.replace('<!-- post:figure -->', figure);
    const wordCount = plainText(source).split(/\s+/).length;
    posts.push({ ...post, body, wordCount, minutes: Math.max(1, Math.ceil(wordCount / 220)) });
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  // blog/ contains generated pages only; retired slugs must not remain published.
  await rm(new URL('blog/', root), { recursive: true, force: true });
  await mkdir(new URL('blog/', root), { recursive: true });

  for (const post of posts) {
    const canonical = `${profile.website}${postPath(post)}`;
    const headings = [...post.body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
    const image = post.image ? { ...post.image, url: `${profile.website}${post.image.path}` } : undefined;
    const page = documentPage({
      page: 'blog', blog: true, title: `${post.title} - ${profile.shortName}`,
      description: post.description, canonical, image,
      article: { author: profile.shortName, published: post.date },
      structuredData: {
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
        description: post.description, datePublished: post.date, dateModified: post.date,
        author: { '@type': 'Person', name: profile.name, url: profile.website },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }, url: canonical,
        image: image ? [image.url] : undefined, inLanguage: 'en', wordCount: post.wordCount
      },
      body: `<article class="blog-post" aria-labelledby="post-heading">
        <header class="section-grid post-header"><div class="section-label"><a href="/blog/">← All posts</a></div><div class="section-content">
          ${postMeta(post)}
          <h1 id="post-heading">${esc(post.title)}</h1>
          <p class="post-deck">${esc(post.description)}</p>
          <p class="post-author">By <a href="/#about" rel="author">${esc(profile.shortName)}</a></p>
        </div></header>
        <div class="section-grid post-layout"><aside class="post-sidebar"><nav class="post-toc" aria-label="In this post"><p>In this post</p>${headings.map(([, id, text]) => `<a href="#${esc(id)}">${text}</a>`).join('')}</nav></aside><div class="post-prose">${post.body}</div></div>
        <footer class="section-grid post-end"><div class="section-label">/ continue</div><div class="section-content"><p>I’m interested in working with people building useful AI products and dependable systems.</p><div class="hero-links"><a class="primary-link" href="mailto:${esc(profile.email)}">Get in touch <span aria-hidden="true">↗</span></a><a href="/resume/">Read my résumé <span aria-hidden="true">↗</span></a><a href="/blog/">All posts <span aria-hidden="true">→</span></a></div></div></footer>
      </article>`
    });
    await mkdir(new URL(`blog/${post.slug}/`, root), { recursive: true });
    await writeFile(new URL(`blog/${post.slug}/index.html`, root), page);
  }

  await writeFile(new URL('blog/index.html', root), documentPage({
    page: 'blog', blog: true, title: `Blog - ${profile.shortName} | Engineering notes`,
    description: 'Notes on AI-native software engineering, building AI applications and learning through the work.',
    canonical: `${profile.website}/blog/`,
    body: `<section class="hero section-grid blog-intro" aria-labelledby="blog-heading"><div class="section-label"><span class="file-icon" aria-hidden="true">#</span> blog</div><div class="section-content"><p class="location">Engineering notes</p><h1 id="blog-heading">Learning in public<span class="name-period">.</span></h1><p class="hero-perspective">Notes on building software with AI, the decisions behind it and what I’m learning along the way.</p></div></section>
      <section class="section-grid blog-list" aria-labelledby="posts-heading"><div class="section-label">/ writing</div><div class="section-content"><h2 class="blog-list-heading" id="posts-heading">All posts</h2>${posts.map(post => postPreview(post, 'h3')).join('\n')}</div></section>`
  }));

  const urls = [
    { path: '/' }, { path: '/resume/' }, { path: '/blog/' },
    ...posts.map(post => ({ path: postPath(post), date: post.date }))
  ];
  await writeFile(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({path, date}) => `  <url><loc>${esc(profile.website + path)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`).join('\n')}
</urlset>\n`);

  return `<section class="section-grid writing-section" id="writing" aria-labelledby="writing-heading"><div class="section-label"><span class="section-number">04</span> / writing</div><div class="section-content"><div class="section-heading"><h2 id="writing-heading">Notes from the work</h2><a class="inline-link" href="/blog/">All posts <span aria-hidden="true">→</span></a></div>${posts.length ? postPreview(posts[0], 'h3') : '<p class="section-intro">New posts will appear here.</p>'}</div></section>`;
}
