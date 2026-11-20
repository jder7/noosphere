'use strict';
/* The catalog is generated from library.json and repository-owned editions. */
const LIBRARY=window.NOOSPHERE_CATALOG;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n2=i=>String(i+1).padStart(2,'0');
const state={scene:'archive',focus:0,book:0,lastWheel:0,touchY:null};
const motifs={
vesica:'<circle cx="70" cy="44" r="39"/><circle cx="70" cy="96" r="39"/><circle cx="44" cy="70" r="39"/><circle cx="96" cy="70" r="39"/><circle cx="52" cy="52" r="39"/><circle cx="88" cy="52" r="39"/><circle cx="52" cy="88" r="39"/><circle cx="88" cy="88" r="39"/>',
lotus:Array.from({length:12},(_,i)=>`<ellipse cx="70" cy="41" rx="13" ry="32" transform="rotate(${i*30} 70 70)"/>`).join('')+'<circle cx="70" cy="70" r="20"/>',
wheel:'<circle cx="70" cy="70" r="51"/><circle cx="70" cy="70" r="18"/>'+Array.from({length:8},(_,i)=>`<path d="M70 20V120" transform="rotate(${i*22.5} 70 70)"/>`).join(''),
star:'<path d="M70 12L128 70L70 128L12 70Z M29 29H111V111H29Z"/><circle cx="70" cy="70" r="34"/><circle cx="70" cy="70" r="23"/>',
rings:'<circle cx="70" cy="70" r="50"/><circle cx="70" cy="37" r="33"/><circle cx="70" cy="103" r="33"/><path d="M70 10V130M10 70H130"/>',
orbits:'<ellipse cx="70" cy="70" rx="57" ry="27" transform="rotate(45 70 70)"/><ellipse cx="70" cy="70" rx="57" ry="27" transform="rotate(-45 70 70)"/><ellipse cx="70" cy="70" rx="57" ry="27"/><circle cx="70" cy="70" r="17"/>',
triad:'<path d="M70 15L118 106H22Z M70 125L22 34H118Z"/><circle cx="70" cy="70" r="37"/><circle cx="70" cy="70" r="21"/>'};
function emblem(name){return `<svg viewBox="0 0 140 140" fill="none" stroke="currentColor" stroke-width=".85" aria-hidden="true"><circle cx="70" cy="70" r="60" stroke-opacity=".39"/>${motifs[name]||motifs.vesica}<circle cx="70" cy="70" r="2.5" fill="currentColor"/></svg>`}
function crystalBook(b){return `<div class="crystal-book" style="--aura:${b.glow}"><div class="crystal-book-shell"><div class="book-top"></div><div class="spine"></div><div class="pages-edge"></div><div class="face"><span class="face-prism"></span><span class="face-top">THE LIVING SCRIPTORIUM</span><div class="face-art">${emblem(b.glyph)}</div><span class="face-rule"></span><span class="face-title">${esc(b.title)}</span><span class="face-native" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</span><span class="face-bottom">${esc(b.tradition)}</span></div></div></div>`}
function canopy(){
 const svg=$('#neuralCanopy');let paths=[],dots=[];
 // Neural tree: topological family of connected circles with a bilateral structure.
 for(let i=0;i<7;i++){
   const radius=43+i*31; paths.push(`<circle cx="500" cy="205" r="${radius}" fill="none" stroke="#a6f1df" stroke-opacity="${.42-i*.041}" stroke-width=".6"/>`);
 }
 for(let i=0;i<20;i++){
   const a=(i/20)*2*Math.PI;const x=500+268*Math.cos(a),y=205+188*Math.sin(a);
   paths.push(`<path d="M500 205 Q ${500+125*Math.cos(a+.38)} ${205+115*Math.sin(a+.38)} ${x.toFixed(1)} ${y.toFixed(1)}" stroke="${i%2?'#b1a1e7':'#93eed4'}" stroke-opacity=".28" stroke-width=".75" fill="none"/>`);
   dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${i%3?'#9bf2df':'#cfb5f4'}" fill-opacity=".7"/>`);
 }
 for(let i=0;i<9;i++){
  let a=(i/9)*Math.PI*2,x=500+128*Math.cos(a),y=205+128*Math.sin(a);
  paths.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="61" fill="none" stroke="#a6f7e1" stroke-opacity=".36" stroke-width=".7"/>`);
 }
 paths.push('<path d="M500 8V600M370 205H630" stroke="#aeffe3" stroke-opacity=".38" stroke-width=".8"/>');
 paths.push('<path d="M500 205 C390 375 620 388 500 530 M500 205 C620 375 380 388 500 530" stroke="#aeffe3" stroke-opacity=".37" fill="none"/>');
 paths.push('<path d="M500 37L644 287H356Z M500 373L356 123H644Z" stroke="#d3cbf4" stroke-opacity=".38" stroke-width=".8" fill="none"/>');
 svg.innerHTML=`<defs><radialGradient id="ncore"><stop stop-color="#bcffe1" stop-opacity=".4"/><stop offset="1" stop-color="#90e3d2" stop-opacity="0"/></radialGradient></defs><circle cx="500" cy="205" r="160" fill="url(#ncore)"/>${paths.join('')}${dots.join('')}<circle cx="500" cy="205" r="6" fill="#f7fff1"/><circle cx="500" cy="205" r="20" fill="none" stroke="#a2f6e9" stroke-width=".8"/>`;
}
function initialiseArchive(){
 $('#floatingArchive').innerHTML=LIBRARY.map((b,i)=>`<div class="archive-volume" data-index="${i}" role="button" tabindex="0" aria-label="Select ${esc(b.title)}">${crystalBook(b)}</div>`).join('');
 $('#archiveSequence').innerHTML=LIBRARY.map((b,i)=>`<button data-index="${i}" title="${esc(b.title)}" aria-label="Focus ${esc(b.title)}">${emblem(b.glyph)}</button>`).join('');
 $$('.archive-volume').forEach(el=>{const activate=()=>{const i=Number(el.dataset.index);if(state.focus===i)showDetail(i);else setFocus(i)};el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}})});
 $$('#archiveSequence button').forEach(el=>el.addEventListener('click',()=>setFocus(Number(el.dataset.index))));
 $('#archive').addEventListener('wheel',e=>{if(state.scene!=='archive'||Math.abs(e.deltaY)<5)return;e.preventDefault();const now=Date.now();if(now-state.lastWheel<420)return;state.lastWheel=now;setFocus(state.focus+(e.deltaY>0?1:-1))},{passive:false});
 $('#archive').addEventListener('touchstart',e=>{state.touchY=e.touches[0].clientY},{passive:true});
 $('#archive').addEventListener('touchend',e=>{if(state.scene!=='archive'||state.touchY===null)return;const d=state.touchY-e.changedTouches[0].clientY;if(Math.abs(d)>40)setFocus(state.focus+(d>0?1:-1));state.touchY=null},{passive:true});
 setFocus(0);
}
function setFocus(i){
 state.focus=(i+LIBRARY.length)%LIBRARY.length;
 const b=LIBRARY[state.focus];const mobile=innerWidth<=720;
 $$('.archive-volume').forEach((el,j)=>{
  let diff=j-state.focus;const count=LIBRARY.length;if(diff>count/2)diff-=count;if(diff< -count/2)diff+=count;
  const a=Math.abs(diff),sign=Math.sign(diff);const x=a===0?(mobile?0:-60):sign*(mobile?140+(a-1)*82:235+(a-1)*125);
  const y=a===0?0:(mobile?(-18-a*19):(a%2?-46:65)-a*9);
  const scale=a===0?(mobile?1.05:1.19):Math.max(.25,(mobile?.52:.76)-a*(mobile?.10:.14));
  el.style.setProperty('--offset-x',`${x}px`);el.style.setProperty('--offset-y',`${y}px`);
  el.style.setProperty('--depth',`${a===0?160:-a*92}px`);el.style.setProperty('--rotate-y',`${a===0?-13:(sign>0?-29:34)}deg`);el.style.setProperty('--rotate-z',`${a===0?-2:sign*8}deg`);
  el.style.setProperty('--scale',scale);el.style.setProperty('--opacity',a===0?1:a===1?.64:a===2?.33:.13);
  el.style.setProperty('--brightness',a===0?1:.73);el.style.setProperty('--level',5-a);
  el.classList.toggle('is-selected',a===0);el.setAttribute('aria-hidden',a>2?'true':'false');el.tabIndex=a>2?-1:0;
 });
 $$('#archiveSequence button').forEach((el,j)=>el.classList.toggle('is-current',j===state.focus));
 $('#archiveIndex').innerHTML=`${n2(state.focus)} <i>/ ${String(LIBRARY.length).padStart(2,'0')}</i>`;
 $('#activeBook').style.setProperty('--aura',b.glow);
 $('#activeBook').innerHTML=`<div class="signal-label">✧ &nbsp; TRANSMISSION ${n2(state.focus)} / ${String(LIBRARY.length).padStart(2,'0')}</div><div class="active-original" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</div><h2 class="active-name">${esc(b.title)}</h2><div class="active-culture">${esc(b.tradition)} &nbsp; · &nbsp; ${esc(b.source)}</div><p class="active-abstract">${esc(b.summary)}</p><button id="enterVolume" class="active-activate">ENTER THIS VOLUME <span class="arrow">↗</span></button>`;
 $('#enterVolume').addEventListener('click',()=>showDetail(state.focus));
}
function showScene(id){state.scene=id;document.body.dataset.scene=id;$$('.scene').forEach(el=>{const isCurrent=el.id===id;el.hidden=!isCurrent;el.classList.toggle('current',isCurrent)});}
function exportLinks(b){return `<div class="format-links"><span>ENGLISH EDITION</span>${Object.entries(b.downloads).map(([ext,url])=>`<a href="${esc(url)}" download>${ext.toUpperCase()}</a>`).join('')}</div>`}
function showDetail(i){state.book=i;const b=LIBRARY[i];$('#detailCrown').innerHTML=emblem(b.glyph);$('#detailVolume').innerHTML=crystalBook(b);
 const languages=b.editions.filter(ed=>!ed.variant).map(ed=>`<a href="${esc(ed.url)}" lang="en">${esc(({en:'English',ro:'Romanian',zh:'Chinese'})[ed.language]||ed.language)}</a>`).join('');
 const special=b.editions.filter(ed=>ed.variant).map(ed=>`<a href="${esc(ed.url)}">${esc(ed.label)} · ${esc(ed.language.toUpperCase())}</a>`).join('');
 $('#detailText').innerHTML=`<div class="detail-eyebrow">PRESERVED FORM / VOLUME ${n2(i)}</div><h1>${esc(b.title)}</h1><div class="detail-native" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</div><p class="detail-description">${esc(b.summary)}</p><div class="detail-facts"><span>${esc(b.author)}</span><span>${esc(b.tradition)}</span></div><a href="${esc(b.url)}" class="detail-open">READ BOOK</a>${exportLinks(b)}<div class="edition-links"><h2>Translations</h2>${languages}</div>${special?`<div class="edition-links"><h2>Special editions</h2>${special}</div>`:''}<div class="detail-toc-label">CONTENTS</div><div class="detail-toc">${b.chapters.map(ch=>`<a class="chapter-cell" href="${esc(b.url)}#${esc(ch.id)}"><span class="chapter-title">${esc(ch.title)}</span></a>`).join('')}</div>`;
 showScene('details');const hash='#book/'+b.id;if(location.hash!==hash)location.hash=hash;}
function backArchive(){showScene('archive');setFocus(state.book);if(location.hash)location.hash='';}
function restoreRoute(){const id=decodeURIComponent(location.hash.slice(1)).replace(/^book\//,'');const i=LIBRARY.findIndex(b=>b.id===id);if(i>=0){setFocus(i);showDetail(i)}else{showScene('archive')}}
$('#brandRoot').addEventListener('click',backArchive);$('#brandRoot').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();backArchive()}});
$('#detailsReturn').addEventListener('click',backArchive);
window.addEventListener('hashchange',restoreRoute);
let resizeTimeout;window.addEventListener('resize',()=>{clearTimeout(resizeTimeout);resizeTimeout=setTimeout(()=>{if(state.scene==='archive')setFocus(state.focus);resizeParticles()},130)},{passive:true});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='Escape'&&state.scene==='details'){backArchive();return}if(state.scene==='archive'){if(['ArrowDown','ArrowRight'].includes(e.key)){e.preventDefault();setFocus(state.focus+1)}if(['ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();setFocus(state.focus-1)}}});
/* A restrained dimensional particle field with no library dependency. */
const canvas=$('#particles'),ctx=canvas.getContext('2d');let W=0,H=0,DPR=1,stars=[];const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function rnd(i){const v=Math.sin(i*127.1+19.31)*43758.5453;return v-Math.floor(v)}
function resizeParticles(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);stars=Array.from({length:Math.min(155,Math.floor(W*H/4700))},(_,i)=>({x:rnd(i+23)*W,y:rnd(i+510)*H,r:.35+rnd(i+260)*1.1,o:.07+rnd(i+390)*.32,p:rnd(i+710)*6.28}));}
function animate(t){ctx.clearRect(0,0,W,H);stars.forEach(st=>{const x=st.x+Math.sin(t*.00015+st.p)*4,y=st.y+Math.cos(t*.00011+st.p)*3;ctx.beginPath();ctx.arc(x,y,st.r,0,Math.PI*2);ctx.fillStyle=`rgba(181,255,231,${st.o})`;ctx.fill()});if(!reduced)requestAnimationFrame(animate)}
canopy();initialiseArchive();restoreRoute();resizeParticles();requestAnimationFrame(animate);
