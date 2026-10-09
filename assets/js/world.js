import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export async function createWorld({mount,chapters,fragments,onSelect,onNearby,onFragment,onProgress}) {
  const mobile=innerWidth<760, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#183336');scene.fog=new THREE.FogExp2('#183336',.0065);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile?1.25:1.35));renderer.setSize(mount.clientWidth,mount.clientHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Three-dimensional career landscape. Drag to orbit, scroll to zoom, WASD or arrow keys to move, E to inspect a nearby landmark. The Chapters button provides direct access to every story.');mount.append(canvas);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();document.dispatchEvent(new CustomEvent('atlas-context-lost'));});
  const camera=new THREE.PerspectiveCamera(mobile?44:40,mount.clientWidth/mount.clientHeight,.1,350);
  const initialTarget=new THREE.Vector3(mobile?0:-5,0,mobile?1:2), initialOffset=mobile?new THREE.Vector3(43,39,55):new THREE.Vector3(29,24,36);
  camera.position.copy(initialTarget).add(initialOffset);camera.lookAt(initialTarget);
  const controls=new OrbitControls(camera,canvas);controls.target.copy(initialTarget);controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;controls.minDistance=16;controls.maxDistance=mobile?110:82;controls.minPolarAngle=.36;controls.maxPolarAngle=1.25;controls.rotateSpeed=.42;controls.zoomSpeed=.62;controls.enableZoom=true;
  let entered=false,elapsed=0,last=performance.now(),frame=0,lowPower=false,paused=false,tween=null,selected=null,nearby=null,clickStart=null,path=[],pendingFragment=null,gesture=false;
  const clockUniform={value:0}, animated=[], pickables=[], colliders=[], landmarkObjects=new Map(), fragmentObjects=new Map(), keys=new Set(), pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
  const seed=(x,z=0)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
  const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const boundary=a=>1+.055*Math.sin(a*3+.3)+.045*Math.sin(a*7-.7)+.035*Math.cos(a*11);
  const normalizedRadius=(x,z)=>{const a=Math.atan2(z/11.7,x/18.7);return Math.hypot(x/18.7,z/11.7)/boundary(a);};
  const contains=(x,z,margin=.93)=>normalizedRadius(x,z)<margin;
  function height(x,z){let h=.8+.58*Math.sin(x*.31)*Math.cos(z*.43)+.26*Math.sin(x*.69+z*.22)+.09*Math.cos(x*1.6-z*1.25)+1.45*Math.exp(-((x+2)**2+(z+1)**2)/42);h-=smooth(.77,1.02,normalizedRadius(x,z))*1.45;for(const s of chapters){const d=Math.hypot(x-s.x,z-s.z);if(d<2.75)h=THREE.MathUtils.lerp(.95,h,smooth(1.7,2.75,d));}return h;}
  const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();const environmentTarget=pmrem.fromScene(environment,.06);scene.environment=environmentTarget.texture;scene.environmentIntensity=.48;environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe2f0eb,0x28453c,.8));
  const sun=new THREE.DirectionalLight(0xffe8ba,2.65);sun.position.set(-16,25,-14);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);sun.shadow.camera.left=-26;sun.shadow.camera.right=26;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.camera.near=.1;sun.shadow.camera.far=80;sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x9bc9c8,.8);fill.position.set(18,10,20);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xe5f7bd,.8);rim.position.set(0,10,-25);scene.add(rim);
  const material=(color,roughness=.65,metalness=.1)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const dark=material('#1c2828',.42,.72), bronze=material('#a49768',.35,.75), silver=material('#c2c9bb',.24,.87),stone=material('#adad94',.84,.06),pale=material('#dddcc5',.62,.18);
  const glow=new THREE.MeshStandardMaterial({color:'#dbeac0',emissive:'#d9f4a6',emissiveIntensity:1.6,roughness:.4,metalness:.12});
  const cyanGlow=new THREE.MeshStandardMaterial({color:'#bbebe4',emissive:'#89d9cc',emissiveIntensity:1.25,roughness:.5});
  function mesh(geometry,mat,parent=scene,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(w,h,d,mat,parent,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
  const cylinder=(rt,rb,h,mat,parent,x=0,y=0,z=0,n=64)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat,parent,x,y,z);
  const torus=(r,t,mat,parent,x=0,y=0,z=0)=>mesh(new THREE.TorusGeometry(r,t,12,100),mat,parent,x,y,z);
  function line(points,color='#d4e5b0',opacity=.55){const g=new THREE.BufferGeometry().setFromPoints(points);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(l);return l;}
  onProgress?.(.18);

  // Dense, organically warped surface with a separate stratified geological edge.
  const rings=70,segments=192,vertices=[],colors=[],indices=[];
  const cLow=new THREE.Color('#475b4c'),cHigh=new THREE.Color('#a0a88a'),cSand=new THREE.Color('#8d957a');
  for(let r=0;r<=rings;r++)for(let a=0;a<=segments;a++){const angle=a/segments*Math.PI*2,radius=r/rings,b=boundary(angle);const x=Math.cos(angle)*radius*b*18.7,z=Math.sin(angle)*radius*b*11.7,y=height(x,z);vertices.push(x,y,z);const c=cLow.clone().lerp(cHigh,THREE.MathUtils.clamp(.45+y*.29+(seed(x,z)-.5)*.08,0,1));if(radius>.85)c.lerp(cSand,(radius-.85)*2.5);colors.push(c.r,c.g,c.b);if(r<rings&&a<segments){const i=r*(segments+1)+a;indices.push(i,i+1,i+segments+1,i+1,i+segments+2,i+segments+1);}}
  const terrainGeometry=new THREE.BufferGeometry();terrainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeometry.setIndex(indices);terrainGeometry.computeVertexNormals();
  const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.03});
  const terrain=mesh(terrainGeometry,terrainMaterial);terrain.castShadow=false;terrain.receiveShadow=true;terrain.userData.terrain=true;
  const cliffVertices=[],cliffColors=[],cliffIndices=[];const layers=14;
  for(let l=0;l<=layers;l++)for(let a=0;a<=segments;a++){const ang=a/segments*Math.PI*2,b=boundary(ang),t=l/layers,scale=1+.035*Math.sin(t*Math.PI)-.1*t;const x=Math.cos(ang)*b*18.7*scale,z=Math.sin(ang)*b*11.7*scale;const y=height(Math.cos(ang)*b*18.7,Math.sin(ang)*b*11.7)-t*3.6+Math.sin(ang*18+l*.9)*.045;cliffVertices.push(x,y,z);const c=new THREE.Color(l%3===0?'#596354':'#384b43').lerp(new THREE.Color('#263c36'),t);cliffColors.push(c.r,c.g,c.b);if(l<layers&&a<segments){const i=l*(segments+1)+a;cliffIndices.push(i,i+1,i+segments+1,i+1,i+segments+2,i+segments+1);}}
  const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cliffVertices,3));cg.setAttribute('color',new THREE.Float32BufferAttribute(cliffColors,3));cg.setIndex(cliffIndices);cg.computeVertexNormals();mesh(cg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98,side:THREE.DoubleSide}));
  // Fine contour engravings follow the actual surface, rather than a screen overlay.
  const contourPoints=[];for(let target=.25;target<1.8;target+=.17){const step=.32;for(let x=-18;x<18;x+=step)for(let z=-11;z<11;z+=step){if(!contains(x,z,.91)||chapters.some(s=>Math.hypot(x-s.x,z-s.z)<2.55))continue;const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]],hits=[];for(let k=0;k<4;k++){const a=corners[k],b=corners[(k+1)%4],ha=height(...a)-target,hb=height(...b)-target;if((ha<0)!==(hb<0)){const t=ha/(ha-hb),px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t;hits.push(new THREE.Vector3(px,height(px,pz)+.014,pz));}}if(hits.length===2)contourPoints.push(...hits);}}
  const contours=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(contourPoints),new THREE.LineBasicMaterial({color:'#ecdfac',transparent:true,opacity:.12,depthWrite:false}));scene.add(contours);

  // A generated normal field gives the reflecting water slow, non-repeating ripples.
  const waterSize=256,normalData=new Uint8Array(waterSize*waterSize*4),waterHeights=new Float32Array(waterSize*waterSize);
  function periodicNoise(x,y,frequency){const px=x/waterSize*frequency,py=y/waterSize*frequency,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy,tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);const n=(a,b)=>seed((a+frequency)%frequency+31,(b+frequency)%frequency+17);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(n(ix,iy),n(ix+1,iy),tx),THREE.MathUtils.lerp(n(ix,iy+1),n(ix+1,iy+1),tx),ty);}
  for(let y=0;y<waterSize;y++)for(let x=0;x<waterSize;x++)waterHeights[y*waterSize+x]=periodicNoise(x,y,8)*.6+periodicNoise(x,y,16)*.28+periodicNoise(x,y,32)*.12;
  const wh=(x,y)=>waterHeights[((y+waterSize)%waterSize)*waterSize+(x+waterSize)%waterSize];
  for(let y=0;y<waterSize;y++)for(let x=0;x<waterSize;x++){const n=new THREE.Vector3((wh(x-1,y)-wh(x+1,y))*3,(wh(x,y-1)-wh(x,y+1))*3,1).normalize(),i=(y*waterSize+x)*4;normalData[i]=(n.x*.5+.5)*255;normalData[i+1]=(n.y*.5+.5)*255;normalData[i+2]=(n.z*.5+.5)*255;normalData[i+3]=255;}
  const normals=new THREE.DataTexture(normalData,waterSize,waterSize);normals.wrapS=normals.wrapT=THREE.RepeatWrapping;normals.needsUpdate=true;
  const water=new Water(new THREE.PlaneGeometry(500,500),{textureWidth:mobile?256:512,textureHeight:mobile?256:512,waterNormals:normals,sunDirection:new THREE.Vector3(-.4,.8,-.3).normalize(),sunColor:0xede5c3,waterColor:0x244b46,distortionScale:.7,fog:true,alpha:1});water.rotation.x=-Math.PI/2;water.position.y=-1.24;water.material.uniforms.size.value=1.7;scene.add(water);

  // Natural scatter: sculpted rock forms, fine reeds, and restrained ground detail.
  const rockGeometry=new THREE.IcosahedronGeometry(1,1);const rockCount=mobile?85:160,rocks=new THREE.InstancedMesh(rockGeometry,material('#707e65',.96,0),rockCount);const dummy=new THREE.Object3D();let rockN=0;
  for(let i=0;rockN<rockCount&&i<3000;i++){const a=seed(i,1)*Math.PI*2,r=.79+seed(i,2)*.27,x=Math.cos(a)*boundary(a)*18.7*r,z=Math.sin(a)*boundary(a)*11.7*r;if(chapters.some(s=>Math.hypot(x-s.x,z-s.z)<3))continue;const size=.18+seed(i,4)*.65;dummy.position.set(x,height(x,z)-size*.3,z);dummy.rotation.set(seed(i,5)*2,seed(i,6)*6,seed(i,7));dummy.scale.set(size*(.8+seed(i,8)),size*(.45+seed(i,9)),size);dummy.updateMatrix();rocks.setMatrixAt(rockN++,dummy.matrix);}rocks.count=rockN;rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
  const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.025,0,0,.025,0,0,-.014,.45,.01,.014,.45,.01,0,.8,.035],3));bladeGeometry.setIndex([0,1,2,1,3,2,2,3,4]);bladeGeometry.computeVertexNormals();
  const grassMaterial=new THREE.MeshStandardMaterial({color:'#a2aa76',roughness:.85,metalness:.15,side:THREE.DoubleSide});grassMaterial.onBeforeCompile=shader=>{shader.uniforms.atlasTime=clockUniform;shader.vertexShader='uniform float atlasTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(atlasTime * 0.8 + instanceMatrix[3].x * 0.7 + instanceMatrix[3].z) * position.y * position.y * 0.12;');};
  const grassCount=mobile?850:2000,grass=new THREE.InstancedMesh(bladeGeometry,grassMaterial,grassCount);let gn=0;
  for(let i=0;gn<grassCount&&i<20000;i++){const x=(seed(i,51)-.5)*36,z=(seed(i,62)-.5)*23,r=normalizedRadius(x,z);if(r>.89||r<.25||chapters.some(s=>Math.hypot(x-s.x,z-s.z)<2.8)||Math.sin(x*.6+z*.2)<-.4)continue;dummy.position.set(x,height(x,z),z);dummy.rotation.set(0,seed(i,9)*6.28,0);const s=.24+seed(i,14)*.6;dummy.scale.setScalar(s);dummy.updateMatrix();grass.setMatrixAt(gn++,dummy.matrix);}grass.count=gn;grass.receiveShadow=true;scene.add(grass);
  onProgress?.(.46);

  // Deliberately architectural landmarks: each is a different kinetic sculpture.
  const portalTexture=await new THREE.TextureLoader().loadAsync('/assets/images/echoes-hero.webp');portalTexture.colorSpace=THREE.SRGBColorSpace;portalTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  for(const s of chapters){
    const group=new THREE.Group();group.position.set(s.x,height(s.x,s.z),s.z);scene.add(group);landmarkObjects.set(s.id,group);
    const base=cylinder(2.05,2.15,.22,stone,group,0,.08,0);const rimRing=torus(1.94,.015,bronze,group,0,.21,0);rimRing.rotation.x=-Math.PI/2;
    cylinder(1.55,1.63,.13,dark,group,0,.255,0);
    if(s.sculpture==='arches'){
      for(let i=0;i<3;i++){const arch=torus(1.18-i*.2,.09,silver,group,(i-1)*.43,1.67,0);arch.rotation.y=(i-1)*.42;arch.scale.y=1.28;}
      cylinder(.1,.13,2.1,bronze,group,0,1.2,0);const orb=mesh(new THREE.SphereGeometry(.2,24,16),glow,group,0,2.46,0);animated.push(t=>orb.position.y=2.46+Math.sin(t*.7)*.09);
    }else if(s.sculpture==='relay'){
      const heights=[1.4,2.3,3.55,2.8,1.8];heights.forEach((h,i)=>{const angle=i/5*Math.PI*2,x=Math.cos(angle)*.85,z=Math.sin(angle)*.85;box(.52,h,.54,dark,group,x,h/2+.32,z);box(.015,h*.76,.02,glow,group,x-.17,h/2+.37,z+.283);for(let j=0;j<3;j++)box(.22,.018,.02,bronze,group,x+.07,.75+j*.23,z+.285);});
      const ring=torus(1.27,.014,glow,group,0,1.4,0);ring.rotation.x=Math.PI/2;animated.push(t=>{ring.position.y=1.7+Math.sin(t*.55)*.7;});
    }else if(s.sculpture==='orbits'){
      const core=mesh(new THREE.OctahedronGeometry(.55,1),silver,group,0,2.4,0);const orbit=new THREE.Group();group.add(orbit);orbit.position.y=2.4;
      for(let i=0;i<7;i++){const a=i/7*Math.PI*2,cube=box(.28,.28,.28,i%2?bronze:pale,orbit,Math.cos(a)*1.24,Math.sin(a*2)*.34,Math.sin(a)*1.24);cube.rotation.set(a,a*.3,.4);}
      const band=torus(1.35,.012,bronze,group,0,2.4,0);band.rotation.x=1.12;animated.push(t=>{orbit.rotation.y=t*.12;core.rotation.y=-t*.17;core.position.y=2.4+Math.sin(t*.8)*.08;});
      cylinder(.065,.1,1.7,bronze,group,0,1.16,0);
    }else if(s.sculpture==='pages'){
      const glass=new THREE.MeshPhysicalMaterial({color:'#b6cabc',metalness:.5,roughness:.24,transparent:true,opacity:.76});
      for(let i=0;i<7;i++){const page=box(.085,2.45,1.2,i===3?dark:glass,group,(i-3)*.32,1.69,Math.sin(i*.6)*.28);page.rotation.z=(i-3)*-.055;page.rotation.y=(i-3)*.14;box(.02,1.94,.025,glow,page,0,0,.61);}
      const arc=torus(1.52,.022,bronze,group,0,1.9,0);arc.rotation.y=Math.PI/2;
    }else if(s.sculpture==='network'){
      const network=new THREE.Group();group.add(network);network.rotation.y=-.35;
      for(let x=0;x<4;x++)for(let y=0;y<5;y++){box(.43,.43,.38,dark,network,(x-1.5)*.5,.63+y*.51,0);const light=box(.12,.045,.015,(x+y)%3?bronze:glow,network,(x-1.5)*.5,.63+y*.51,.2);if((x+y)%3===0)animated.push(t=>light.scale.x=.55+Math.sin(t*.8+x+y)**2*.65);}
      box(2.3,.09,.8,silver,network,0,3.02,0);cylinder(.07,.07,3.2,bronze,group,-1.48,1.8,0);cylinder(.07,.07,2.7,bronze,group,1.48,1.56,0);
    }else if(s.sculpture==='intelligence'){
      const knot=mesh(new THREE.TorusKnotGeometry(.74,.15,160,16,2,3),silver,group,0,2.15,0);const inner=mesh(new THREE.SphereGeometry(.3,32,24),cyanGlow,group,0,2.15,0);
      const band=torus(1.33,.018,bronze,group,0,2.15,0);band.rotation.x=.5;band.rotation.y=.5;const band2=torus(1.4,.011,silver,group,0,2.15,0);band2.rotation.x=1.6;animated.push(t=>{knot.rotation.y=t*.11;knot.rotation.x=t*.07;band.rotation.z=t*.035;inner.scale.setScalar(.95+Math.sin(t)*.04);});
      cylinder(.82,1.03,.5,dark,group,0,.54,0);cylinder(.45,.67,.3,bronze,group,0,.9,0);
    }else if(s.sculpture==='portal'){
      group.rotation.y=.38;box(.38,4.4,.52,dark,group,-1.43,2.5,0);box(.38,4.4,.52,dark,group,1.43,2.5,0);box(3.23,.36,.52,dark,group,0,4.53,0);
      box(.025,3.85,.04,glow,group,-1.22,2.53,.3);box(.025,3.85,.04,glow,group,1.22,2.53,.3);box(2.45,.025,.04,glow,group,0,4.46,.3);
      const picture=mesh(new THREE.PlaneGeometry(2.44,3.65),new THREE.MeshBasicMaterial({map:portalTexture,color:0xdde8c2,side:THREE.DoubleSide}),group,0,2.56,.025);picture.material.map=portalTexture.clone();picture.material.map.repeat.set(.46,1);picture.material.map.offset.x=.25;
      for(let i=0;i<4;i++)box(2.8+i*.22,.13,.3,stone,group,0,.38-i*.12,.5+i*.33);
      const point=new THREE.PointLight('#ddebab',4,7,2);point.position.set(0,2.1,1.4);group.add(point);
    }
    const hit=new THREE.Mesh(new THREE.SphereGeometry(1.95,12,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(s.x,height(s.x,s.z)+1.8,s.z);hit.userData.id=s.id;scene.add(hit);pickables.push(hit);colliders.push({x:s.x,z:s.z,r:1.6});
    // Delicate lights embedded in the approach, with no artificial road grid.
    for(let i=0;i<4;i++){const z=s.z+2.1+i*.42;if(!contains(s.x,z,.91))continue;const step=box(.46,.035,.14,pale,scene,s.x,height(s.x,z)+.025,z);}
  }
  // Low, warm path lights describe a continuous walk around the island.
  for(let i=0;i<chapters.length;i++){const a=chapters[i],b=chapters[(i+1)%chapters.length];for(let j=1;j<18;j++){const t=j/18,x=THREE.MathUtils.lerp(a.x,b.x,t),z=THREE.MathUtils.lerp(a.z,b.z,t),d=Math.min(Math.hypot(x-a.x,z-a.z),Math.hypot(x-b.x,z-b.z));if(d<2.2)continue;const block=box(.11,.017,.075,j%4===0?glow:bronze,scene,x,height(x,z)+.017,z);block.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}}

  // The visitor: a quiet, sculptural figure with a flowing cloak, not a cartoon sprite.
  const explorer=new THREE.Group();scene.add(explorer);const cloakGeometry=new THREE.CylinderGeometry(.1,.28,.65,16,6,true);const cloak=mesh(cloakGeometry,material('#dedec6',.72,.04),explorer,0,.46,0);cloak.scale.z=.72;
  const hood=mesh(new THREE.SphereGeometry(.135,24,16),dark,explorer,0,.87,0);hood.scale.set(1,1.1,.93);mesh(new THREE.SphereGeometry(.09,16,12),bronze,explorer,0,.86,.07);cylinder(.022,.022,.83,bronze,explorer,.29,.5,.07,10);mesh(new THREE.SphereGeometry(.045,12,8),glow,explorer,.29,.93,.07);
  const player={x:0,z:1,angle:0};explorer.position.set(player.x,height(player.x,player.z),player.z);
  const halo=mesh(new THREE.RingGeometry(.34,.38,64),new THREE.MeshBasicMaterial({color:'#e0e9b9',transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}),scene);halo.rotation.x=-Math.PI/2;
  const playerLight=new THREE.PointLight('#e2efb8',1.4,3,2);explorer.add(playerLight);playerLight.position.y=1;
  const trailPoints=Array.from({length:25},()=>new THREE.Vector3(0,height(0,1)+.04,1));const trailGeometry=new THREE.BufferGeometry().setFromPoints(trailPoints);const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:'#d9e7a2',transparent:true,opacity:.24,depthWrite:false}));scene.add(trail);

  for(const f of fragments){const g=new THREE.Group();g.position.set(f.x,height(f.x,f.z)+.65,f.z);const shard=mesh(new THREE.OctahedronGeometry(.15,0),glow,g);const ring=torus(.3,.01,bronze,g);ring.rotation.x=.6;const beam=mesh(new THREE.CylinderGeometry(.025,.06,.7,10),new THREE.MeshBasicMaterial({color:'#e8efb2',transparent:true,opacity:.24,depthWrite:false}),g,0,-.35,0);g.visible=false;scene.add(g);fragmentObjects.set(f.id,g);animated.push(t=>{shard.rotation.y=t*.45;g.position.y=height(f.x,f.z)+.62+Math.sin(t*1.1+f.x)*.1;});}
  // Dust catches the backlight; rendering stays bounded on mobile hardware.
  const particleCount=mobile?70:150,particlePositions=[];for(let i=0;i<particleCount;i++)particlePositions.push((seed(i,87)-.5)*38,1+seed(i,76)*5,(seed(i,15)-.5)*25);const particles=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(particlePositions,3)),new THREE.PointsMaterial({color:'#ebe9be',size:.028,transparent:true,opacity:.47,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(particles);

  const renderTarget=new THREE.WebGLRenderTarget(mount.clientWidth,mount.clientHeight,{type:THREE.HalfFloatType,samples:mobile?0:4});
  const composer=new EffectComposer(renderer,renderTarget);composer.setSize(mount.clientWidth,mount.clientHeight);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(mount.clientWidth,mount.clientHeight),.24,.55,1.25);composer.addPass(bloom);composer.addPass(new OutputPass());
  const grain=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float n=fract(sin(dot(vUv+mod(time,100.0),vec2(12.9898,78.233)))*43758.5453)-.5;c.rgb+=n*.016;gl_FragColor=c;}'});composer.addPass(grain);
  onProgress?.(.78);
  const labelRoot=document.querySelector('#landmark-labels'),labels=new Map();for(const s of chapters){const b=document.createElement('button');b.className='landmark-label';b.setAttribute('aria-label',`Explore ${s.name}, ${s.company}`);b.innerHTML=`<span>${s.number}</span><span class="landmark-label-text">${s.name}<small>${s.company.toUpperCase()}</small></span>`;b.addEventListener('click',()=>onSelect(s.id));labelRoot.append(b);labels.set(s.id,b);}
  function projectLabels(){const w=mount.clientWidth,h=mount.clientHeight;for(const s of chapters){const p=new THREE.Vector3(s.x,height(s.x,s.z)+s.height,s.z).project(camera),b=labels.get(s.id);const x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;const visible=p.z<1&&p.z>0&&x>15&&x<w-15&&y>115&&y<h-80;b.style.left=`${x}px`;b.style.top=`${y}px`;b.style.opacity=visible?'1':'0';b.style.pointerEvents=visible?'auto':'none';b.tabIndex=visible?0:-1;b.setAttribute('aria-hidden',String(!visible));b.classList.toggle('selected',selected===s.id);b.classList.toggle('near',nearby===s.id);}}
  function flyTo(target,offset,duration=1.6){tween={start:performance.now(),duration:reduced?0:duration*1000,fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),position:target.clone().add(offset),target};}
  function focus(id){selected=id;const s=chapters.find(c=>c.id===id);if(!s)return;const target=new THREE.Vector3(s.x,height(s.x,s.z)+1,s.z);const offset=mobile?new THREE.Vector3(11,10,16):new THREE.Vector3(13,10,17);if(!mobile)target.add(new THREE.Vector3(3,0,-1.5));flyTo(target,offset);walkTo(s.x,s.z+2.3);}
  function overview(){selected=null;flyTo(new THREE.Vector3(0,.5,0),mobile?new THREE.Vector3(43,39,55):new THREE.Vector3(25,22,31),1.9);}
  function valid(x,z){return contains(x,z,.935)&&!colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.14);}
  // Grid search only runs when a destination is chosen; rendering is independent.
  const gridStep=.65,gridX=66,gridZ=44,worldX=-21.45,worldZ=-14.3;
  const cell=(x,z)=>({x:Math.round((x-worldX)/gridStep),z:Math.round((z-worldZ)/gridStep)}),toWorld=c=>({x:worldX+c.x*gridStep,z:worldZ+c.z*gridStep}),cellId=c=>c.z*gridX+c.x;
  function walkTo(x,z){const start=cell(player.x,player.z),end=cell(x,z),startId=cellId(start),queue=[start],seen=new Set([startId]),parents=new Map();let pos=0,found=false;while(pos<queue.length){const a=queue[pos++];if(a.x===end.x&&a.z===end.z){found=true;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const b={x:a.x+dx,z:a.z+dz},id=cellId(b),p=toWorld(b);if(b.x>=0&&b.x<gridX&&b.z>=0&&b.z<gridZ&&!seen.has(id)&&valid(p.x,p.z)){seen.add(id);parents.set(id,a);queue.push(b);}}}if(!found){path=[];return false;}const route=[];let c=end;while(cellId(c)!==startId){route.push(toWorld(c));c=parents.get(cellId(c));if(!c)return false;}path=route.reverse();return true;}
  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.9),groundHit=new THREE.Vector3();
  function pick(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false)[0];}
  canvas.addEventListener('pointerdown',event=>{clickStart={x:event.clientX,y:event.clientY};gesture=true;});
  canvas.addEventListener('pointerup',event=>{gesture=false;if(!clickStart)return;const distance=Math.hypot(event.clientX-clickStart.x,event.clientY-clickStart.y);clickStart=null;if(distance>6)return;const hit=pick(event);if(hit){onSelect(hit.object.userData.id);return;}if(!entered)return;raycaster.ray.intersectPlane(groundPlane,groundHit);for(const f of fragments){const g=fragmentObjects.get(f.id);if(g.visible&&Math.hypot(groundHit.x-f.x,groundHit.z-f.z)<.9){pendingFragment=f.id;walkTo(f.x,f.z);return;}}if(valid(groundHit.x,groundHit.z))walkTo(groundHit.x,groundHit.z);});
  canvas.addEventListener('pointermove',event=>{if(gesture)return;const hit=pick(event);canvas.style.cursor=hit?'pointer':'grab';});
  canvas.addEventListener('pointercancel',()=>{gesture=false;clickStart=null;});controls.addEventListener('start',()=>{tween=null;});
  const isDialogOpen=()=>Boolean(document.querySelector('dialog[open]'));
  document.addEventListener('keydown',event=>{if(!entered||event.metaKey||event.ctrlKey||event.altKey||isDialogOpen()||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)||event.target.isContentEditable||(event.code==='Space'&&event.target.closest('button,a,summary')))return;const validKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyE','Space'];if(!validKeys.includes(event.code))return;event.preventDefault();keys.add(event.code);if((event.code==='KeyE'||event.code==='Space')&&!event.repeat){if(pendingNearbyFragment()){return;}if(nearby)onSelect(nearby);}});
  document.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now();});
  document.querySelectorAll('[data-direction]').forEach(button=>{const code={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'}[button.dataset.direction];button.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(code);button.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,()=>keys.delete(code)));});
  function pendingNearbyFragment(){for(const f of fragments){const group=fragmentObjects.get(f.id);if(group.visible&&Math.hypot(player.x-f.x,player.z-f.z)<1.3){group.visible=false;pendingFragment=null;onFragment(f.id);return true;}}return false;}
  let previousNear=null,trailTime=0;
  function updatePlayer(dt){let sx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),sz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));let dx=0,dz=0;if(sx||sz){path=[];pendingFragment=null;const forward=new THREE.Vector3().subVectors(controls.target,camera.position);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));dx=right.x*sx-forward.x*sz;dz=right.z*sx-forward.z*sz;}else if(path.length){const next=path[0],d=Math.hypot(next.x-player.x,next.z-player.z);if(d<.11){path.shift();if(!path.length&&pendingFragment)pendingNearbyFragment();}else{dx=(next.x-player.x)/d;dz=(next.z-player.z)/d;}}const length=Math.hypot(dx,dz);if(length){const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?4.9:2.8;dx=dx/length*speed*dt;dz=dz/length*speed*dt;if(valid(player.x+dx,player.z))player.x+=dx;if(valid(player.x,player.z+dz))player.z+=dz;player.angle=Math.atan2(dx,dz);explorer.rotation.y=THREE.MathUtils.lerp(explorer.rotation.y,player.angle,.2);cloak.rotation.z=Math.sin(elapsed*8)*.035;explorer.position.set(player.x,height(player.x,player.z)+Math.sin(elapsed*10)*.015,player.z);}else{cloak.rotation.z=0;explorer.position.y=height(player.x,player.z);}
    halo.position.set(player.x,height(player.x,player.z)+.022,player.z);halo.material.opacity=.26+Math.sin(elapsed*1.5)*.1;
    trailTime+=dt;if(trailTime>.055){trailTime=0;trailPoints.shift();trailPoints.push(new THREE.Vector3(player.x,height(player.x,player.z)+.035,player.z));trailGeometry.setFromPoints(trailPoints);}
    const close=chapters.map(s=>({s,d:Math.hypot(player.x-s.x,player.z-s.z)})).sort((a,b)=>a.d-b.d)[0];const fragment=fragments.find(f=>fragmentObjects.get(f.id).visible&&Math.hypot(player.x-f.x,player.z-f.z)<1.3);nearby=fragment?`fragment:${fragment.id}`:close.d<3.8?close.s.id:null;if(nearby!==previousNear){previousNear=nearby;onNearby(nearby);}
  }
  function updateTween(now){if(!tween)return;const t=tween.duration?Math.min(1,(now-tween.start)/tween.duration):1,e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;camera.position.lerpVectors(tween.fromPosition,tween.position,e);controls.target.lerpVectors(tween.fromTarget,tween.target,e);if(t===1)tween=null;}
  function render(now){requestAnimationFrame(render);if(document.hidden||paused){last=now;return;}const interval=lowPower||mobile?33:22;if(now-frame<interval)return;frame=now;const dt=Math.min(.05,(now-last)/1000);last=now;if(!reduced)elapsed+=dt;clockUniform.value=elapsed;if(entered&&!isDialogOpen())updatePlayer(dt);updateTween(now);controls.update();if(!reduced){water.material.uniforms.time.value=elapsed*.28;animated.forEach(update=>update(elapsed));particles.rotation.y=Math.sin(elapsed*.03)*.035;grain.uniforms.time.value=elapsed;}projectLabels();composer.render();}
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);projectLabels();}
  new ResizeObserver(resize).observe(mount);
  await renderer.compileAsync(scene,camera);onProgress?.(1);composer.render();projectLabels();mount.classList.add('ready');requestAnimationFrame(render);
  return {
    enter(){entered=true;overview();canvas.focus({preventScroll:true});},
    focus,
    overview,
    setProgress(ids){labels.forEach((el,id)=>el.classList.toggle('found',ids.includes(id)));},
    showFragments(found=[]){fragmentObjects.forEach((g,id)=>g.visible=!found.includes(id));},
    hideFragment(id){fragmentObjects.get(id).visible=false;},
    setLowPower(value){lowPower=value;renderer.setPixelRatio(value?1:Math.min(devicePixelRatio,mobile?1.25:1.35));composer.setPixelRatio(renderer.getPixelRatio());bloom.enabled=!value;renderer.shadowMap.enabled=!value;resize();},
    setPaused(value){paused=value;keys.clear();},
    collectNearby:pendingNearbyFragment,
    reset(){player.x=0;player.z=1;path=[];fragmentObjects.forEach(g=>g.visible=false);overview();},
    get nearby(){return nearby;}
  };
}
