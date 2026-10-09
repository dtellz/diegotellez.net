import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

// To update, download the official npm tarball, extract it, and pass its package directory.
const source = path.resolve(process.argv[2] || '/tmp/diego-three/package');
const destination = new URL('../assets/vendor/three/', import.meta.url);
await mkdir(destination, { recursive:true });
for (const file of ['three.module.js','three.core.js']) await copyFile(path.join(source,'build',file),new URL(file,destination));
await copyFile(path.join(source,'LICENSE'),new URL('LICENSE',destination));
const visited = new Set();
async function copyModule(relative) {
  relative=path.posix.normalize(relative);
  if(visited.has(relative))return;visited.add(relative);
  if(relative.startsWith('../'))throw new Error('Invalid module path');
  const content=await readFile(path.join(source,'examples/jsm',relative),'utf8');
  const target=new URL('addons/'+relative,destination);
  await mkdir(new URL('./',target),{recursive:true});await writeFile(target,content);
  for(const match of content.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(match[1].startsWith('.'))await copyModule(path.posix.join(path.posix.dirname(relative),match[1]));}
}
for (const module of ['controls/OrbitControls.js','environments/RoomEnvironment.js','objects/Water.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','postprocessing/OutputPass.js','postprocessing/ShaderPass.js']) await copyModule(module);
await writeFile(new URL('VERSION',destination),'three 0.186.1\nSource: https://registry.npmjs.org/three/-/three-0.186.1.tgz\nLicense: MIT\n');
console.log(`Vendored Three.js and ${visited.size} required addon modules. No CDN requests.`);
