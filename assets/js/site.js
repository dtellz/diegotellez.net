import { openDownloadPuzzle } from './puzzle.js';

document.querySelectorAll('.download-trigger').forEach(button => button.addEventListener('click', openDownloadPuzzle));
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
const clock = document.querySelector('#local-time');
if (clock) { const update = () => clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Atlantic/Canary', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WESTERN ISLAND TIME'; update(); setInterval(update, 60000); }
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { paused ||= localStorage.getItem('dt-motion') === 'paused'; } catch {}
const motion = document.querySelector('.motion-toggle');
function setMotion() { document.documentElement.classList.toggle('motion-paused', paused);if(motion){motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Resume ambient animation':'Pause ambient animation');motion.querySelector('span').textContent=paused?'▷':'Ⅱ';motion.querySelector('.motion-label').textContent=paused?'Resume motion':'Pause motion';}document.dispatchEvent(new CustomEvent('motionchange',{detail:{paused}})); }
setMotion();motion?.addEventListener('click',()=>{paused=!paused;setMotion();try{localStorage.setItem('dt-motion',paused?'paused':'running');}catch{}});
const observer = new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
document.querySelectorAll('.section-heading,.featured-info,.project-row,.about-top,.about-grid,.capabilities,.contact-heading').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
document.querySelectorAll('dialog .dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
