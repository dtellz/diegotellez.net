let dialog;
const downloadUrl = '/assets/Diego-Tellez-CV.pdf';

export function openDownloadPuzzle() {
  if (!dialog) createPuzzle();
  dialog.showModal();
  draw();
}

let rings = [], draw = () => {};
function createPuzzle() {
  dialog = document.createElement('dialog');
  dialog.className = 'puzzle-dialog';
  dialog.setAttribute('aria-labelledby', 'puzzle-title');
  dialog.innerHTML = `<button class="dialog-close" aria-label="Close download puzzle">×</button><p class="eyebrow">A small detour before the destination</p><h2 id="puzzle-title">Find your true north.</h2><p>Three drifting rings. One guiding star. Turn each ring until its opening meets the star to unlock my CV.</p><div class="puzzle-stage"><canvas width="680" height="400" aria-label="Three concentric rings, each with an opening. Align the openings with the star directly above the center."></canvas></div><div class="puzzle-controls"><label>OUTER RING<input type="range" min="0" max="360" step="5" aria-label="Outer ring rotation"></label><label>MIDDLE RING<input type="range" min="0" max="360" step="5" aria-label="Middle ring rotation"></label><label>INNER RING<input type="range" min="0" max="360" step="5" aria-label="Inner ring rotation"></label></div><p class="puzzle-feedback" role="status" aria-live="polite">Use the sliders. Follow the light.</p><div class="puzzle-actions"><button class="button button-accent" id="puzzle-check">Open the archive</button><button class="quiet-link" id="puzzle-hint">A little guidance</button></div><details class="puzzle-alternative"><summary>Keyboard & accessibility help</summary><p>Tab to each ring and use the arrow keys. The angle is announced in degrees clockwise from north. Align all three openings to 0° (or 360°). There is no time limit.</p><p>You can also <a href="/resume/">read the complete résumé</a> or <a href="mailto:contact@diegotellez.net?subject=CV%20request">request a copy by email</a>.</p></details>`;
  document.body.append(dialog);
  const random = new Uint32Array(3);crypto.getRandomValues(random);
  rings = [...dialog.querySelectorAll('input')].map((input,i)=>{input.value=String(45+(random[i]%54)*5);input.setAttribute('aria-valuetext',`${input.value} degrees clockwise from north`);input.addEventListener('input',()=>{input.setAttribute('aria-valuetext',`${input.value} degrees clockwise from north`);draw();});return input;});
  const canvas=dialog.querySelector('canvas'), ctx=canvas.getContext('2d');
  draw=()=>{
    ctx.clearRect(0,0,680,400);const cx=340,cy=220;
    const halo=ctx.createRadialGradient(cx,cy,10,cx,cy,210);halo.addColorStop(0,'#d4e88b12');halo.addColorStop(1,'#d4e88b00');ctx.fillStyle=halo;ctx.fillRect(0,0,680,400);
    ctx.strokeStyle='#cfe69a18';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,30);ctx.lineTo(cx,385);ctx.moveTo(135,cy);ctx.lineTo(545,cy);ctx.stroke();
    for(let i=0;i<60;i++){const a=i*Math.PI/30,r=171;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*r,cy-Math.cos(a)*r);ctx.lineTo(cx+Math.sin(a)*(r+((i%5)?3:8)),cy-Math.cos(a)*(r+((i%5)?3:8)));ctx.strokeStyle='#b2c39a33';ctx.stroke();}
    rings.forEach((input,i)=>{const a=Number(input.value)*Math.PI/180-Math.PI/2,r=148-i*41,aligned=Number(input.value)<=10||Number(input.value)>=350;ctx.beginPath();ctx.arc(cx,cy,r,a+.14,a+Math.PI*2-.14);ctx.strokeStyle=aligned?'#d4e88b':['#69856c','#8f9e77','#bac69d'][i];ctx.lineWidth=2.5;ctx.stroke();for(const end of [a-.14,a+.14]){ctx.fillStyle=aligned?'#e9ffc1':'#b1c398';ctx.beginPath();ctx.arc(cx+Math.cos(end)*r,cy+Math.sin(end)*r,3.5,0,Math.PI*2);ctx.fill();}});
    ctx.fillStyle='#d4e88b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='27px Georgia';ctx.fillText('✦',cx,35);ctx.font='11px monospace';ctx.fillStyle='#81947d';ctx.fillText('N',cx,12);ctx.font='30px Georgia';ctx.fillStyle='#d4e88b';ctx.fillText('d t',cx,cy);ctx.font='9px monospace';ctx.fillStyle='#81947d';ctx.fillText('THE ARCHIVE',cx,cy+28);
  };
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('#puzzle-hint').addEventListener('click',()=>{dialog.querySelector('.puzzle-feedback').textContent='The star is at 12 o’clock. Move each break to the top. The ends of a slider meet at north.';});
  dialog.querySelector('#puzzle-check').addEventListener('click',()=>{
    const correct=rings.filter(r=>Number(r.value)<=10||Number(r.value)>=350).length;
    const feedback=dialog.querySelector('.puzzle-feedback');
    if(correct<3){feedback.textContent=`${correct} of 3 rings aligned. A little closer to north.`;return;}
    feedback.textContent='True north found. The archive is yours.';
    if(!dialog.querySelector('.cv-download')){const a=document.createElement('a');a.href=downloadUrl;a.download='Diego-Tellez-CV.pdf';a.className='button button-accent cv-download';a.textContent='Download CV · PDF';dialog.querySelector('.puzzle-actions').prepend(a);dialog.querySelector('#puzzle-check').hidden=true;a.focus();}
  });
}
