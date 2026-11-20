'use strict';
/* Noösphere — an immersive concept for The Living Scriptorium.
   Source passages and export documents are design DEMONSTRATIONS, never authentic scripture.
   Metadata and original titles are illustrative; verify any published edition and its licensing. */
const LIBRARY=[
{id:'tao',title:'Tao Te Ching',original:'道德經',lang:'zh-Hant',dir:'ltr',tradition:'DAOIST THOUGHT',source:'Classical Chinese',era:'Ancient China',glow:'#8bede9',glyph:'vesica',chapters:['The Unnamed Source','The Way of Opposites','The Quiet Center','Returning'],ideas:['the elusive character of the unnameable source','mutual emergence and polarity','the disposition of attentive stillness','the movement of return'],summary:'A spare, enduring inquiry into the Way, naturalness, receptivity, and the relationship between opposites.'},
{id:'gita',title:'Bhagavad Gītā',original:'भगवद्गीता',lang:'sa',dir:'ltr',tradition:'VEDIC / HINDU',source:'Sanskrit',era:'Ancient India',glow:'#f1cca0',glyph:'lotus',chapters:['The Question of Action','Knowledge','Action without Attachment','The Inner Discipline'],ideas:['the tension between responsibility and uncertainty','the pursuit of understanding','action freed from attachment to reward','discipline in the life of thought'],summary:'A dialogue exploring duty, knowledge, devotion, and inner freedom on the eve of a momentous battle.'},
{id:'dhammapada',title:'Dhammapada',original:'धम्मपद',lang:'pi',dir:'ltr',tradition:'BUDDHIST',source:'Pāli (Devanagari title)',era:'Early Buddhist literature',glow:'#d9c1f3',glyph:'wheel',chapters:['Twin Verses','Wakefulness','The Mind','The Way'],ideas:['the shaping influence of thought','the practice of alertness','the training of attention','a life of discernment'],summary:'Compact teachings on mind, conduct, impermanence, and the disciplined path of awakening.'},
{id:'quran',title:'The Qurʾān',original:'القرآن الكريم',lang:'ar',dir:'rtl',tradition:'ISLAMIC',source:'Arabic',era:'7th century CE',glow:'#97e6ce',glyph:'star',chapters:['Al-Fātiḥah','Al-Baqarah','Āl ʿImrān','An-Nisāʾ'],ideas:['the opening request for guidance','covenant and human conduct','faith and endurance','justice and community'],summary:'The foundational scripture of Islam, transmitted through recitation and studied in its Arabic language and many translations.'},
{id:'sefer',title:'Sefer Yetzirah',original:'ספר יצירה',lang:'he',dir:'rtl',tradition:'JEWISH MYSTICAL',source:'Hebrew',era:'Late antiquity / early medieval',glow:'#d3b8ff',glyph:'rings',chapters:['Ten Sefirot','The Letters','The Three Mothers','The Seven Doubles'],ideas:['number and the imagination of order','letters as instruments of symbolic thought','the family of elemental forms','correspondence in a structured cosmos'],summary:'A brief yet influential work exploring the symbolic relationships between letters, numbers, and creation.'},
{id:'enneads',title:'The Enneads',original:'Ἐννεάδες',lang:'grc',dir:'ltr',tradition:'NEOPLATONIC',source:'Ancient Greek',era:'3rd century CE',glow:'#b7c5ff',glyph:'orbits',chapters:['On Beauty','On the Virtues','On Dialectic','On Intellect'],ideas:['the idea of intelligible beauty','qualities of character and the soul','the disciplined pursuit of truth','intellect and the question of unity'],summary:'Plotinus’s philosophical investigations of soul, intellect, beauty, and the highest source of being.'},
{id:'upanishads',title:'The Upanishads',original:'उपनिषद्',lang:'sa',dir:'ltr',tradition:'VEDIC',source:'Sanskrit',era:'Ancient India',glow:'#ffdab4',glyph:'triad',chapters:['Īśa','Kena','Kaṭha','Muṇḍaka'],ideas:['participation in the world and understanding','the ground of mind and perception','wisdom and mortality','different avenues of knowledge'],summary:'A collection of dialogues and reflections on consciousness, self, knowledge, and ultimate reality.'}
];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n2=i=>String(i+1).padStart(2,'0');
const state={scene:'archive',focus:0,book:0,page:0,toc:innerWidth>720,light:false,scale:1,readerLang:'en',lastWheel:0,touchY:null};
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
function exportLinks(b){return `<div class="format-links"><span>AVAILABLE EDITIONS</span>${['PDF','MD','DOCX'].map(ext=>`<a href="editions/${b.id}.${ext.toLowerCase()}" download="${b.id}.${ext.toLowerCase()}" title="Download demonstration ${ext} edition">${ext}</a>`).join('')}</div>`}
function showDetail(i){state.book=i;const b=LIBRARY[i];$('#detailCrown').innerHTML=emblem(b.glyph);$('#detailVolume').innerHTML=crystalBook(b);
 $('#detailText').innerHTML=`<div class="detail-eyebrow">✦ &nbsp; PRESERVED FORM / VOLUME ${n2(i)}</div><h1>${esc(b.title)}</h1><div class="detail-native" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</div><p class="detail-description">${esc(b.summary)}</p><div class="detail-facts"><span>${esc(b.tradition)}</span><span>${esc(b.source)}</span><span>${esc(b.era)}</span></div><button id="openText" class="detail-open">OPEN THE MANUSCRIPT <span>↗</span></button>${exportLinks(b)}<div class="detail-toc-label">THE TEXT / CHAPTER CONSTELLATION</div><div class="detail-toc">${b.chapters.map((ch,j)=>`<button class="chapter-cell" data-chapter="${j}"><span class="chapter-num">${n2(j)}</span><span class="chapter-title">${esc(ch)}</span></button>`).join('')}</div>`;
 $('#openText').addEventListener('click',()=>showReader(0));$$('[data-chapter]').forEach(el=>el.addEventListener('click',()=>showReader(Number(el.dataset.chapter))));showScene('details');}
function pageCopy(b,i){
 if(state.readerLang==='ro')return [
  `Această pagină este o demonstrație editorială despre ideile abordate în ${b.title}. Ea ilustrează felul în care o ediție digitală poate păstra caracterul limbii și al tradiției din care provine lucrarea. Pasajul este creat pentru prezentarea interfeței și nu constituie un citat sau o traducere a manuscrisului.`,
  `Fiecare text sacru poartă propria istorie de voci, limbi și interpretări. În biblioteca finală, o ediție verificată va înlocui acest exemplu. Pagina rămâne deliberat liniștită, astfel încât lectura să fie experiența centrală.`
 ];
 return [
  `This is an editorial demonstration considering ${b.ideas[i]}. It shows how a digital edition might preserve the dignity of its original language and thought. These are newly written example passages, not a quotation or translation of the historical manuscript.`,
  `Every sacred text carries its own history of voices, languages, and interpretations. In the finished library, a verified edition would take the place of this sample. The page is deliberately quiet, so that reading remains the central experience.`
 ];}
function pageHtml(b,i){const text=pageCopy(b,i);return `<section class="page-section" data-page="${i}" aria-label="Page ${i+1}: ${esc(b.chapters[i])}"><article class="page-sheet"><div class="sheet-overline">THE LIVING SCRIPTORIUM &nbsp; · &nbsp; AN ILLUMINATED EDITION</div><div class="sheet-emblem">${emblem(b.glyph)}</div><h2>${esc(b.chapters[i])}</h2><div class="sheet-subtitle">${esc(b.title)} &nbsp; / &nbsp; ${n2(i)}</div><span class="sheet-rule"></span>${i===0?`<div class="sheet-native" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</div>`:''}<div class="sheet-paragraphs" lang="${state.readerLang}">${text.map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="sheet-sample-note">${state.readerLang==='ro'?'TEXT EXEMPLIFICATIV · NU REPREZINTĂ UN TEXT SACRU SAU O TRADUCERE AUTENTICĂ':'ILLUSTRATIVE TEXT · NOT AN AUTHENTIC SACRED TEXT OR TRANSLATION'}</div><div class="sheet-bottom"><span>THE NOÖSPHERE EDITION</span><span>— ${n2(i)} —</span><span>${esc(b.source.toUpperCase())}</span></div></article></section>`}
function showReader(page=0){const b=LIBRARY[state.book];state.page=page;$('#readingTitle').textContent=b.title;
 $('#tocInner').innerHTML=`<div class="toc-eyebrow">THE TEXT &nbsp; / &nbsp; ${n2(state.book)}</div><h2>${esc(b.title)}</h2><div class="toc-original" lang="${b.lang}" dir="${b.dir}">${esc(b.original)}</div><div class="toc-divider"></div><div class="toc-nav-label">CHAPTERS / CONTENTS</div>${b.chapters.map((ch,i)=>`<button class="toc-jump" data-page-target="${i}"><span>${n2(i)}</span><span>${esc(ch)}</span></button>`).join('')}<button class="toc-return" id="tocArchive">← RETURN TO THE ARCHIVE</button>`;
 $('#pageFlow').innerHTML=b.chapters.map((ch,i)=>pageHtml(b,i)).join('');$$('[data-page-target]').forEach(el=>el.addEventListener('click',()=>{goPage(Number(el.dataset.pageTarget));if(innerWidth<=720)toggleToc(false)}));$('#tocArchive').addEventListener('click',backArchive);
 $('#languageToggle').textContent=state.readerLang.toUpperCase();$('#readerLayout').classList.toggle('parchment',state.light);$('#readerLayout').style.setProperty('--reader-scale',state.scale);toggleToc(state.toc);showScene('reader');requestAnimationFrame(()=>goPage(page,false));}
function goPage(i,smooth=true){const flow=$('#pageFlow');state.page=Math.min(LIBRARY[state.book].chapters.length-1,Math.max(0,i));flow.scrollTo({top:state.page*flow.clientHeight,behavior:smooth?'smooth':'instant'});updatePageStatus()}
function updatePageStatus(){$('#pageCounter').textContent=`${n2(state.page)} / ${String(LIBRARY[state.book].chapters.length).padStart(2,'0')}`;$$('.toc-jump').forEach((el,j)=>el.classList.toggle('is-current',j===state.page))}
function toggleToc(open){state.toc=open;$('#readerLayout').classList.toggle('toc-closed',!open);$('#tocToggle').textContent=open?'‹':'☰';$('#tocToggle').setAttribute('aria-expanded',String(open));$('#tocToggle').setAttribute('aria-label',open?'Collapse table of contents':'Expand table of contents')}
function backArchive(){showScene('archive');setFocus(state.book)}
$('#brandRoot').addEventListener('click',backArchive);$('#brandRoot').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();backArchive()}});
$('#detailsReturn').addEventListener('click',backArchive);$('#readerBack').addEventListener('click',()=>showDetail(state.book));$('#readerToArchive').addEventListener('click',backArchive);$('#tocToggle').addEventListener('click',()=>toggleToc(!state.toc));$('#themeToggle').addEventListener('click',()=>{state.light=!state.light;$('#readerLayout').classList.toggle('parchment',state.light)});
$('#languageToggle').addEventListener('click',()=>{state.readerLang=state.readerLang==='en'?'ro':'en';if(state.scene==='reader')showReader(state.page)});
$('#fontPlus').addEventListener('click',()=>{state.scale=Math.min(1.45,Number((state.scale+.1).toFixed(2)));$('#readerLayout').style.setProperty('--reader-scale',state.scale)});
$('#fontMinus').addEventListener('click',()=>{state.scale=Math.max(.85,Number((state.scale-.1).toFixed(2)));$('#readerLayout').style.setProperty('--reader-scale',state.scale)});
$('#pageFlow').addEventListener('scroll',()=>{if(state.scene!=='reader')return;const f=$('#pageFlow'),v=Math.min(LIBRARY[state.book].chapters.length-1,Math.max(0,Math.round(f.scrollTop/Math.max(1,f.clientHeight))));if(v!==state.page){state.page=v;updatePageStatus()}},{passive:true});
let resizeTimeout;window.addEventListener('resize',()=>{clearTimeout(resizeTimeout);resizeTimeout=setTimeout(()=>{if(state.scene==='archive')setFocus(state.focus);if(state.scene==='reader')goPage(state.page,false);resizeParticles()},130)},{passive:true});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='Escape'){if(state.scene==='reader')showDetail(state.book);else if(state.scene==='details')backArchive();return}if(state.scene==='archive'){if(['ArrowDown','ArrowRight'].includes(e.key)){e.preventDefault();setFocus(state.focus+1)}if(['ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();setFocus(state.focus-1)}}else if(state.scene==='reader'){if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();goPage(state.page+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goPage(state.page-1)}}});
/* A restrained dimensional particle field with no library dependency. */
const canvas=$('#particles'),ctx=canvas.getContext('2d');let W=0,H=0,DPR=1,stars=[];const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function rnd(i){const v=Math.sin(i*127.1+19.31)*43758.5453;return v-Math.floor(v)}
function resizeParticles(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);stars=Array.from({length:Math.min(155,Math.floor(W*H/4700))},(_,i)=>({x:rnd(i+23)*W,y:rnd(i+510)*H,r:.35+rnd(i+260)*1.1,o:.07+rnd(i+390)*.32,p:rnd(i+710)*6.28}));}
function animate(t){ctx.clearRect(0,0,W,H);stars.forEach(st=>{const x=st.x+Math.sin(t*.00015+st.p)*4,y=st.y+Math.cos(t*.00011+st.p)*3;ctx.beginPath();ctx.arc(x,y,st.r,0,Math.PI*2);ctx.fillStyle=`rgba(181,255,231,${st.o})`;ctx.fill()});if(!reduced)requestAnimationFrame(animate)}
canopy();initialiseArchive();resizeParticles();requestAnimationFrame(animate);
