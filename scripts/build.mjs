import { cp, mkdir, rm } from 'node:fs/promises';
import { generateContent } from './content.mjs';

const root = new URL('../', import.meta.url);
await generateContent(root);
const output = new URL('_site/', root);
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
// Explicitly stage public files: repository metadata, scripts and docs stay outside the published site.
for (const item of ['index.html','404.html','assets','cv','resume','.well-known','llms.txt','robots.txt','sitemap.xml','CNAME','.nojekyll']) {
  await cp(new URL(item,root),new URL(item,output),{recursive:true});
}
console.log('Static site ready in _site/ — shared HTML layouts, CSS and JavaScript.');
