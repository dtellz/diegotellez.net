const canvas = document.querySelector('#atlas-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, rotation = -.38, targetRotation = -.38, pointer = { x: 0, y: 0 }, dragging = false, lastX = 0, time = 0, previous = 0, mode = 'worlds', inView = true;
  const grid = 68, points = [], labels = { worlds: 'THE WORLD BUILDER', systems: 'THE SYSTEMS THINKER', intelligence: 'THE CURIOUS MIND' };
  for (let z = 0; z <= grid; z++) for (let x = 0; x <= grid; x++) points.push({ x: (x / grid - .5) * 2.7, z: (z / grid - .5) * 2.7, h: 0 });
  function terrain(x, z, t) {
    const r = Math.sqrt(x*x + z*z), fade = Math.max(0, 1 - Math.pow(r / 1.36, 6));
    if (mode === 'systems') return (Math.abs(Math.sin(x*4.2)*Math.cos(z*3.5))*.55 + .1) * fade;
    if (mode === 'intelligence') return (.24 + .2*Math.sin(r*9 - t*.3) + .45*Math.exp(-r*r*5)) * fade;
    return (Math.exp(-((x+.12)**2*3+(z-.04)**2*5))*.75 + Math.exp(-((x-.52)**2*17+(z+.3)**2*13))*.42 + Math.sin(x*8+z*4)*.065 + Math.sin(z*11-x*3)*.035 + .05) * fade;
  }
  function resize() { const rect = canvas.getBoundingClientRect();width = rect.width;height = rect.height;const dpr = Math.min(devicePixelRatio || 1, 1.7);canvas.width = width*dpr;canvas.height = height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw(); }
  function project(x,z,y) { const c=Math.cos(rotation),s=Math.sin(rotation),rx=x*c-z*s,rz=x*s+z*c;const scale=Math.min(width*.29,height*.4);return {x:width*.5+rx*scale+pointer.x*10,y:height*.54+rz*scale*.39-y*scale*.89+pointer.y*5,depth:rz}; }
  function draw() {
    ctx.clearRect(0,0,width,height);
    const moving = !reduced.matches && !document.documentElement.classList.contains('motion-paused');
    rotation += (targetRotation-rotation)*.045;
    points.forEach(p=>{ const h=terrain(p.x,p.z,time);p.h += (h-p.h)*.065;p.screen=project(p.x,p.z,p.h); });
    // The mesh is a parametric data surface; each mode uses a different height field.
    for (let z=0;z<=grid;z++) {
      ctx.beginPath();let started=false;
      for(let x=0;x<=grid;x++){const p=points[z*(grid+1)+x];if(Math.hypot(p.x,p.z)>1.31){started=false;continue;}const s=p.screen;if(!started){ctx.moveTo(s.x,s.y);started=true;}else ctx.lineTo(s.x,s.y);}
      const front=z/grid;ctx.strokeStyle=`rgba(184,209,153,${.12+front*.23})`;ctx.lineWidth=.65;ctx.stroke();
    }
    for(let x=0;x<=grid;x+=2){ctx.beginPath();let started=false;for(let z=0;z<=grid;z++){const p=points[z*(grid+1)+x];if(Math.hypot(p.x,p.z)>1.31){started=false;continue;}if(!started){ctx.moveTo(p.screen.x,p.screen.y);started=true;}else ctx.lineTo(p.screen.x,p.screen.y);}ctx.strokeStyle='rgba(164,190,143,.13)';ctx.lineWidth=.55;ctx.stroke();}
    // A fine perimeter marks the boundary of the field.
    ctx.beginPath();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,s=project(Math.cos(a)*1.38,Math.sin(a)*1.38,-.03);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y);}ctx.strokeStyle='rgba(192,217,157,.16)';ctx.lineWidth=.8;ctx.stroke();
    for(let i=0;i<42;i++){const n=(i*113+43)%points.length,p=points[n];if(Math.hypot(p.x,p.z)>1.17)continue;const a=.35+.5*Math.sin(time*.6+i)**2;ctx.fillStyle=`rgba(222,240,180,${a})`;ctx.fillRect(p.screen.x-1,p.screen.y-1,1.5,1.5);if(i%13===0){ctx.beginPath();ctx.arc(p.screen.x,p.screen.y,4,0,Math.PI*2);ctx.strokeStyle='rgba(211,236,171,.3)';ctx.stroke();}}
    const marker=project(.33,-.16,terrain(.33,-.16,time));ctx.beginPath();ctx.moveTo(marker.x,marker.y);ctx.lineTo(marker.x,marker.y-55);ctx.strokeStyle='rgba(212,232,139,.6)';ctx.stroke();ctx.fillStyle='#d4e88b';ctx.fillRect(marker.x-2,marker.y-59,4,4);
    if (!moving) previous=0;
  }
  function frame(now) {requestAnimationFrame(frame);if(document.hidden||!inView)return;const moving=!reduced.matches&&!document.documentElement.classList.contains('motion-paused');if(moving){if(now-previous<32)return;time+=.025;previous=now;if(!dragging)targetRotation+=.00065;}else if(!dragging&&Math.abs(rotation-targetRotation)<.001)return;draw();}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;if(dragging){targetRotation+=(e.clientX-lastX)*.007;lastX=e.clientX;}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>dragging=false));
  document.querySelectorAll('[data-terrain]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.terrain;document.querySelectorAll('[data-terrain]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelector('#atlas-location').textContent=labels[mode];if(reduced.matches||document.documentElement.classList.contains('motion-paused')){points.forEach(p=>p.h=terrain(p.x,p.z,time));draw();}}));
  new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;}).observe(canvas);resize();requestAnimationFrame(frame);
}
