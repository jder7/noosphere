'use strict';
const layout=document.querySelector('#readerLayout');
const flow=document.querySelector('#pageFlow');
const toggle=document.querySelector('#tocToggle');
const links=Array.from(document.querySelectorAll('.toc-jump'));
const headings=links.map(a=>document.getElementById(decodeURIComponent(a.hash.slice(1))));
let scale=1;
function setToc(open){layout.classList.toggle('toc-closed',!open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Collapse table of contents':'Expand table of contents');toggle.textContent=open?'‹':'☰';document.querySelector('#toc').inert=!open;}
setToc(innerWidth>720);
toggle.addEventListener('click',()=>setToc(layout.classList.contains('toc-closed')));
let saved={};
try{saved=JSON.parse(localStorage.getItem('noosphere-reader')||'{}')||{};}catch{}
scale=Math.max(.85,Math.min(1.45,Number(saved.scale)||1));
layout.style.setProperty('--reader-scale',scale);
layout.classList.toggle('parchment',saved.light===true);
const theme=document.querySelector('#themeToggle');
theme.setAttribute('aria-pressed',String(layout.classList.contains('parchment')));
function save(){try{localStorage.setItem('noosphere-reader',JSON.stringify({scale,light:layout.classList.contains('parchment')}));}catch{}}
theme.addEventListener('click',()=>{layout.classList.toggle('parchment');theme.setAttribute('aria-pressed',String(layout.classList.contains('parchment')));save();});
for(const [id,delta] of [['fontMinus',-.1],['fontPlus',.1]])document.getElementById(id).addEventListener('click',()=>{scale=Math.max(.85,Math.min(1.45,Number((scale+delta).toFixed(2))));layout.style.setProperty('--reader-scale',scale);save();});
let current='';
function updateSection(){
 const top=flow.getBoundingClientRect().top+55;
 let index=0;
 for(let i=0;i<headings.length;i++){if(headings[i].getBoundingClientRect().top<=top)index=i;else break;}
 if(!headings.length)return;
 const id=headings[index].id;
 links.forEach((a,i)=>{a.classList.toggle('is-current',i===index);if(i===index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 document.querySelector('#sectionStatus').textContent=links[index].textContent;
 current=id;
}
let scheduled=false;
flow.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{updateSection();scheduled=false;});},{passive:true});
function jumpToHash(){const id=decodeURIComponent(location.hash.slice(1));let target=document.getElementById(id);let fallback=id;
 while(!target&&fallback.includes('-')){fallback=fallback.slice(0,fallback.lastIndexOf('-'));target=document.getElementById(fallback);}
 if(id&&!target){target=document.querySelector('#bookText');fallback='bookText';}
 if(target){target.scrollIntoView({block:'start'});if(id!==fallback)history.replaceState(null,'','#'+fallback);}
 updateSection();}
window.addEventListener('hashchange',jumpToHash);
links.forEach(a=>a.addEventListener('click',()=>{if(innerWidth<=720)setToc(false);}));
function editionUrl(value){const url=new URL(value,location.href);const section=current||location.hash.slice(1);if(section)url.hash=section;return url.href;}
document.querySelector('#bookLanguage').addEventListener('change',e=>{location.href=editionUrl(e.target.value);});
document.querySelectorAll('[data-edition-link]').forEach(a=>a.addEventListener('click',()=>{a.href=editionUrl(a.href);}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setToc(false);});
requestAnimationFrame(jumpToHash);
