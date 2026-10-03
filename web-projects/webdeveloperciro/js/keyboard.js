(() => {
'use strict';
const root=document.documentElement;
let keyboard=false, pending=0, focusTimers=[], lastOutsideNotice=null;
const groups=new Map();
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const shown=e=>{
if(!e?.isConnected||e.closest('[hidden],[inert]')||!e.getClientRects().length)return false;
const closed=e.closest('details:not([open])');
if(closed&&!e.closest('summary'))return false;
const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&cs.display!=='none';
};
const available=e=>shown(e)&&!e.matches(':disabled')&&e.getAttribute('aria-disabled')!=='true';
const focusable='a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex],iframe';
const proxy=e=>{
if(!(e instanceof Element))return e;
const r=e.getBoundingClientRect();
if(e.matches('input[type="radio"],input[type="checkbox"]')&&(r.width<4||r.height<4||Number(getComputedStyle(e).opacity)===0))return e.closest('label')||e;
return e;
};
const viewport=()=>({top:window.visualViewport?.offsetTop||0, left:window.visualViewport?.offsetLeft||0,
width:window.visualViewport?.width||innerWidth, height:window.visualViewport?.height||innerHeight});
const header=()=>$('.site-header');
const pinned=e=>{
if(!shown(e))return false;
const cs=getComputedStyle(e),r=e.getBoundingClientRect();
return cs.position==='fixed'||(cs.position==='sticky'&&r.top<=Math.max(0,parseFloat(cs.top)||0)+2);
};
function limits(target){
const v=viewport(),t=proxy(target).getBoundingClientRect();
let top=v.top+12,bottom=v.top+v.height-12;
const h=header(),band=$('.header-band')||h;
if(h&&band&&!h.contains(target)&&pinned(h))top=Math.max(top,band.getBoundingClientRect().bottom+12);
for(const rail of $$('.chapter-nav,.story-rail,.l-index-box')){
if(rail.contains(target)||!pinned(rail))continue;
const b=rail.getBoundingClientRect();
if(t.right>b.left&&t.leftv.top&&b.top<=top+2)top=Math.max(top,b.bottom+12);
}
const notice=$('#cookieNotice');
if(notice&&shown(notice)&&!notice.contains(target)&&!notice.classList.contains('is-menu-hidden')&&getComputedStyle(notice).position==='fixed'){
const n=notice.getBoundingClientRect();
if(t.leftn.left&&n.top>top+40)bottom=Math.min(bottom,n.top-12);
}
return{top,bottom,left:v.left+12,right:v.left+v.width-12};
}
function reveal(target,align=false){
if(!(target instanceof Element)||!shown(target)||(target.classList.contains('skip-link')&&!target.classList.contains('kb-skip-demo')))return;
const el=proxy(target);

for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
const cs=getComputedStyle(p),b=p.getBoundingClientRect(),r=el.getBoundingClientRect();
if(/auto|scroll/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+1){
if(r.topb.bottom-8&&r.height<=b.height-16)p.scrollTop+=r.bottom-b.bottom+8;
}
if(/auto|scroll/.test(cs.overflowX)&&p.scrollWidth>p.clientWidth+1){
if(r.leftb.right-8)p.scrollLeft+=r.right-b.right+8;
}
}
if(target.closest('dialog[open]')||(header()?.contains(target)&&pinned(header())))return;
const l=limits(target),r=el.getBoundingClientRect(),height=l.bottom-l.top;
if(height<40)return;

if(r.height>height&&target.matches('textarea,[contenteditable="true"]')&&r.bottom>l.top&&r.topl.bottom)dy=r.bottom-l.bottom;
else if(r.height>height&&r.top>l.bottom-44)dy=r.top-l.top;

if(Math.abs(dy)>1)window.scrollBy({top:dy,left:0,behavior:'instant'});
}
function schedule(target=document.activeElement,align=false){
cancelAnimationFrame(pending);focusTimers.forEach(clearTimeout);focusTimers=[];
pending=requestAnimationFrame(()=>{pending=0;if(document.activeElement===target){reveal(target,align);updateHint(target);}});

for(const delay of [100,320])focusTimers.push(setTimeout(()=>{
if(document.activeElement===target){reveal(target);updateHint(target);}
},delay));
}
function focusTarget(target,align=false){
if(!target)return;
if(!target.matches(focusable))target.setAttribute('tabindex','-1');
target.focus({preventScroll:true});schedule(target,align);
}
window.CiroKeyboard=Object.freeze({get isKeyboard(){return keyboard;},reveal:target=>schedule(target),focus:focusTarget});
let tip=null,tipId=0;
const helpText=(axis='horizontal')=>(axis==='vertical'?'↑ ↓':'← →')+' scegli · Invio attiva · Tab prosegui';
function updateHint(target){
if(!tip)return;
const group=target instanceof Element?target.closest('[data-kb-toolbar],[role="tablist"]'):null;
if(!keyboard||!group||!shown(group)||target.closest('dialog[open]')){tip.hidden=true;return;}
const g=group.getBoundingClientRect(),t=proxy(target).getBoundingClientRect(),v=viewport();
const state=groups.get(group),axis=state?state.axis():group.getAttribute('aria-orientation')||'horizontal';
tip.textContent=group.matches('[role="tablist"]')?(axis==='vertical'?'↑ ↓':'← →')+' cambia scheda · Tab prosegui':helpText(axis);
tip.hidden=false;
const w=tip.offsetWidth,h=tip.offsetHeight;
const safe=limits(target);
let x=Math.min(v.left+v.width-w-12,Math.max(v.left+12,t.left)),y=t.top-h-10;
if(yMath.min(v.top+v.height-8,safe.bottom)){tip.hidden=true;return;}
tip.style.left=Math.round(x)+'px';tip.style.top=Math.round(y)+'px';
}
function makeToolbar(group,label,selector='button',direction='auto'){
if(!group||groups.has(group)||group.matches('[role="tablist"]'))return;
const all=()=> $$(selector,group).filter(e=>e.closest('[data-kb-toolbar]')===group);
const items=()=>all().filter(available);
const axis=()=>{
if(direction!=='auto')return direction;
const b=items();if(b.length<2)return 'horizontal';
const x=b[0].getBoundingClientRect(),y=b[1].getBoundingClientRect();
return Math.abs(x.left-y.left)<5&&Math.abs(x.top-y.top)>5?'vertical':'horizontal';
};
group.setAttribute('role','toolbar');group.setAttribute('data-kb-toolbar','');
if(!group.hasAttribute('aria-label')&&!group.hasAttribute('aria-labelledby'))group.setAttribute('aria-label',label);
const hint=document.createElement('span');hint.id='kb-help-'+(++tipId);hint.className='kb-sr-help';
hint.textContent='Tab e Shift+Tab raggiungono tutti i controlli visibili. Le frecce aiutano a spostarsi nel gruppo; Invio o Spazio attivano il controllo. Home e Fine raggiungono il primo e l’ultimo.';
group.append(hint);group.setAttribute('aria-describedby',((group.getAttribute('aria-describedby')||'')+' '+hint.id).trim());
const state={axis,last:null};groups.set(group,state);
const sync=()=>{
const candidates=items().length?items():all().filter(b=>!b.disabled&&!b.hidden);
if(!candidates.length){for(const b of all())if(b.tabIndex!==-1)b.tabIndex=-1;return;}
const focused=candidates.includes(document.activeElement)?document.activeElement:null;
const remembered=candidates.find(b=>b===state.last);
const active=focused||remembered||candidates.find(b=>b.getAttribute('aria-pressed')==='true')||candidates[0];
for(const b of all()){
const visible=candidates.includes(b);
const n=visible?0:-1;
if(b.tabIndex!==n)b.tabIndex=n;
}
state.last=active;const a=axis();if(group.getAttribute('aria-orientation')!==a)group.setAttribute('aria-orientation',a);
};
group.addEventListener('focusin',event=>{if(items().includes(event.target)){state.last=event.target;sync();updateHint(event.target);}});
group.addEventListener('click',event=>{const b=event.target.closest('button');if(items().includes(b))state.last=b;queueMicrotask(sync);});
group.addEventListener('keydown',event=>{
if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return;
const b=items(),i=b.indexOf(event.target);if(i<0)return;
const a=axis();let next;
if(event.key===(a==='vertical'?'ArrowDown':'ArrowRight'))next=(i+1)%b.length;
else if(event.key===(a==='vertical'?'ArrowUp':'ArrowLeft'))next=(i+b.length-1)%b.length;
else if(event.key==='Home')next=0;else if(event.key==='End')next=b.length-1;
if(next===undefined)return;
event.preventDefault();event.stopPropagation();state.last=b[next];sync();b[next].focus({preventScroll:true});

});
new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||['aria-pressed','hidden','disabled'].includes(r.attributeName)))sync();})
.observe(group,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','hidden','disabled']});
state.sync=sync;sync();
}
let menuOpen=false,menuState=null;
function syncMenu(){
const h=header(),toggle=$('.mobile-toggle'),nav=$('#menu-principale');
if(!h||!toggle||!nav)return;
const open=toggle.getAttribute('aria-expanded')==='true'&&shown(toggle)&&getComputedStyle(nav).display!=='none';
if(open===menuOpen)return;
menuOpen=open;
if(open){
const host=$('.header-inner',h)||h;
menuState={host,attrs:['role','aria-modal','aria-label'].map(a=>[a,host.getAttribute(a)]),inert:[]};
const disable=el=>{if(!(el instanceof HTMLElement)||el===tip||el.matches('script,style,link'))return;menuState.inert.push([el,el.inert]);el.inert=true;};

for(let n=h;n&&n!==document.body;n=n.parentElement){for(const sib of n.parentElement.children)if(sib!==n)disable(sib);}
const protect=container=>{for(const child of container.children){
if(child===toggle||child===nav)continue;
if(child.contains(toggle)||child.contains(nav))protect(child);else disable(child);
}};
protect(host);
host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Menu principale');
} else if(menuState){
const {host,attrs,inert}=menuState;menuState=null;
for(const [el,value]of inert)el.inert=value;
for(const [attr,value]of attrs){if(value===null)host.removeAttribute(attr);else host.setAttribute(attr,value);}
}
}
const modalKeys=event=>{
if(event.altKey||event.ctrlKey||event.metaKey)return;
const d=$('dialog[open]');
if(d&&event.key==='Tab'){
const a=$$(focusable,d).filter(e=>available(e)&&e.tabIndex>=0),first=a[0],last=a.at(-1);
if(!first){event.preventDefault();d.focus();return;}
if(event.shiftKey&&(document.activeElement===first||!d.contains(document.activeElement))){event.preventDefault();last.focus();}
else if(!event.shiftKey&&(document.activeElement===last||!d.contains(document.activeElement))){event.preventDefault();first.focus();}

return;
}
if(!menuOpen)return;
const toggle=$('.mobile-toggle'),nav=$('#menu-principale');
if(event.key==='Escape'){
event.preventDefault();event.stopImmediatePropagation();toggle.click();syncMenu();toggle.focus({preventScroll:true});return;
}
if(event.key!=='Tab')return;
const a=[toggle,...$$(focusable,nav).filter(e=>available(e)&&e.tabIndex>=0)],first=a[0],last=a.at(-1);
if(event.shiftKey&&(document.activeElement===first||!a.includes(document.activeElement))){event.preventDefault();last.focus();}
else if(!event.shiftKey&&(document.activeElement===last||!a.includes(document.activeElement))){event.preventDefault();first.focus();}
};
function init(){
tip=document.createElement('div');tip.className='kb-group-help';tip.hidden=true;tip.setAttribute('aria-hidden','true');document.body.append(tip);
document.addEventListener('keydown',event=>{
if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&['Tab','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter',' ','Home','End'].includes(event.key)){
keyboard=true;root.classList.add('kb-navigation');
if(event.key==='Tab')schedule(document.activeElement);
}
modalKeys(event);
},true);
document.addEventListener('pointerdown',()=>{keyboard=false;root.classList.remove('kb-navigation');tip.hidden=true;},true);
document.addEventListener('focusin',event=>{
const target=event.target;
$$('.kb-focus-proxy').forEach(el=>el.classList.remove('kb-focus-proxy'));
const box=proxy(target);if(box!==target){box.classList.add('kb-focus-proxy');target.classList.add('kb-proxied');}
if(keyboard||target.matches?.(':focus-visible'))schedule(target);
else updateHint(target);
if(!target.closest?.('#cookieNotice'))lastOutsideNotice=target;
});
document.addEventListener('focusout',()=>queueMicrotask(()=>updateHint(document.activeElement)));
const toggle=$('.mobile-toggle');
if(toggle)new MutationObserver(syncMenu).observe(toggle,{attributes:true,attributeFilter:['aria-expanded']});
document.addEventListener('click',()=>syncMenu());
syncMenu();
const notice=$('#cookieNotice');
if(notice)new MutationObserver(()=>{
if(notice.hidden&&keyboard&&notice.contains(document.activeElement)){
const t=available(lastOutsideNotice)?lastOutsideNotice:$('#contenuto');focusTarget(t);
}
if(keyboard)schedule();
}).observe(notice,{attributes:true,attributeFilter:['hidden','class']});

document.addEventListener('click',event=>{
if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
const a=event.target.closest?.('a[href^="#"]');if(!a||a.hasAttribute('download'))return;
let id;try{id=decodeURIComponent(a.getAttribute('href').slice(1));}catch{return;}
const target=id?document.getElementById(id):$('#contenuto');if(!target)return;
event.preventDefault();
const index=a.closest('.l-index-box');if(index&&matchMedia('(max-width:820px)').matches)index.open=false;

requestAnimationFrame(()=>{
syncMenu();
if(!window.__CIRO_PREVIEW_ONLY__)try{history.pushState(null,'',a.getAttribute('href'));}catch(_){}
const point=target.matches('main,button,a,input,select,textarea,h1,h2,h3,h4')?target:target.querySelector('h1,h2,h3,h4')||target;
focusTarget(point,true);
});
},true);

const skips=[
['#laboratorio','#competenze','Salta il laboratorio'],
['[data-comparison]','#decidere','Salta il confronto interattivo'],
['[data-editorial-app]','#differenziare','Salta la prova del Quaderno'],
['body.services-page #ripensare','#gestire','Salta il modello 3D']
];
for(const [sel,to,label]of skips){
const box=$(sel);if(!box||!$(to))continue;
const link=document.createElement('a');link.className='skip-link kb-skip-demo';link.href=to;link.textContent=label;
const anchor=document.createElement('div');anchor.className='kb-skip-anchor';anchor.append(link);box.before(anchor);
}
const definitions=[
['.device-options','Dimensioni del laboratorio'],['.demo-switch','Vista della dimostrazione'],
['.principle-choices','Scelte progettuali'],
['[data-focus-project]','Spazio dedicato ai progetti','parent'],
['[data-compare-format]','Formato del confronto','parent'],
['[data-compare-value]','Vista del confronto','parent'],
['.s-inspect-options','Dettaglio da osservare'],
['[data-responsive-size]','Formati della dimostrazione','parent'],
['.r-map-tools','Percorso nella struttura'],
['.editorial-mobile-switch','Editor o anteprima'],['.editorial-cover-choices','Copertina della prova'],
['.editorial-devices','Formato dell’anteprima'],['.editorial-view-switch','Pagina da visualizzare'],
['[data-editorial-list]','Articoli della prova'],['.view-controls','Orientamento del modello 3D']
];
for(const [sel,label,parent]of definitions)for(const e of $$(sel))makeToolbar(parent?e.parentElement:e,label);
for(const el of $$('[role="tablist"]')){
const hint=document.createElement('span');hint.id='kb-tabs-help-'+(++tipId);hint.className='kb-sr-help';
hint.textContent='Usa le frecce per cambiare scheda. Tab lascia il gruppo e prosegue nella pagina. Home e Fine raggiungono la prima e l’ultima scheda.';el.append(hint);
el.setAttribute('aria-describedby',((el.getAttribute('aria-describedby')||'')+' '+hint.id).trim());
}
const responsive=()=>{
syncMenu();for(const s of groups.values())s.sync();
const active=document.activeElement;
if(keyboard&&active!==document.body&&!shown(active)&&active.closest?.('[data-editorial-app]')){
const selected=$('.editorial-mobile-switch button[aria-pressed="true"]');if(available(selected))selected.focus({preventScroll:true});
}
if(keyboard)schedule();
};
addEventListener('resize',responsive,{passive:true});window.visualViewport?.addEventListener('resize',responsive,{passive:true});
addEventListener('scroll',()=>{if(!tip.hidden)updateHint(document.activeElement);},{passive:true});
document.addEventListener('toggle',()=>{if(keyboard)schedule();},true);
addEventListener('pageshow',responsive);
addEventListener('pagehide',()=>{cancelAnimationFrame(pending);focusTimers.forEach(clearTimeout);});

root.classList.add('kb-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
