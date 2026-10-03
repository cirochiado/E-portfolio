(() => {
'use strict';
if(window.CiroVisual) return;
const root=document.documentElement, $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)'), fine=matchMedia('(hover:hover) and (pointer:fine)'), contrast=matchMedia('(forced-colors:active)');
const rhythm=1.30;
const immediate=new Set(['field-focus','contact-guidance','menu-link']);
const paced=(ms,name='')=>Math.round(ms*(immediate.has(name)?1:rhythm));
const running=new Map(), observers=[], scheduled=new Set(), transient=new Set(), depthNodes=new Map(), events={};
let sleeping=document.hidden, scrollFrame=0, printing=false;
const ease='cubic-bezier(.19,1,.22,1)', inView=el=>{if(!el||!el.isConnected||!el.getClientRects().length)return false;const r=el.getBoundingClientRect();return (r.width>0||r.height>0)&&r.bottom>=0&&r.toproot.classList.contains('kb-navigation')||window.CiroKeyboard?.isKeyboard===true;
const permitted=()=>!reduce.matches&&!contrast.matches&&!sleeping&&!document.hidden&&!printing&&!keyboard();
const record=name=>events[name]=(events[name]||0)+1;

const entries=new Set(), entryOwners=new WeakMap(), naturalTransforms=new WeakMap();
let preparing=null,prepareOffset=0,startingEntry=null,earlyIntro=null,entrancesReady=false;
const hasPainted=()=>document.readyState==='complete'||performance.getEntriesByType?.('paint').some(e=>e.name==='first-contentful-paint');
const boxVisible=r=>r.width>0&&r.height>0&&r.bottom>0&&r.top0&&r.left['done','skipped'].includes(g.state);
const describe=el=>el?.id?'#'+el.id:el?.tagName.toLowerCase()+'.'+[...(el?.classList||[])].join('.');
function entrySnapshot(){return [...entries].map(g=>({id:g.id,anchor:describe(g.el),state:g.state,reason:g.reason,starts:g.starts,effects:g.items.map(i=>i.name)}));}
function entryEnded(g){
if(!g||g.state!=='playing')return;
if(g.items.every(i=>i.a.playState==='finished'||i.a.playState==='idle')){
g.state='done';g.reason='finished';g.observer?.disconnect();
}
}
function finishEntry(g,reason='skipped'){
if(!g||finalEntry(g))return;
g.state='done';g.reason=reason;g.observer?.disconnect();g.accents.length=0;
for(const {el,a}of g.items){a.cancel();if(entryOwners.get(el)===g)entryOwners.delete(el);}
}
function finishRelated(target,reason){
if(!target?.closest)return;
const region=target.closest('.lab,.exploded-workshop,.s-comparison,.s-journey,.r-map,.editorial-demo,.drafting-table,.compass,.r-index-showcase,.principles-layout,.scope-machine,.phase,.rail-station,.handover-folder');
for(const g of entries){
if(finalEntry(g))continue;
if(g.el.contains(target)||target.contains(g.el)||g.items.some(i=>i.el.contains(target)||target.contains(i.el))||
(region&&(region.contains(g.el)||g.el.contains(region))))finishEntry(g,reason);
}
}
function canPrepareTarget(el,g){
if(g.blocked||!el.isConnected||!el.getClientRects().length)return false;
if(g.intro)return inView(el);
if(entryOwners.has(el)&&!finalEntry(entryOwners.get(el)))return false;

if(g.painted&&boxVisible(el.getBoundingClientRect())){g.blocked=true;return false;}
return true;
}
function playEntry(g){
if(!g||g.state!=='pending'||!entrancesReady)return;
if(!permitted()){finishEntry(g,'policy');return;}
if(!g.el.isConnected||!g.el.getClientRects().length){finishEntry(g,'hidden-or-removed');return;}
g.state='playing';g.starts++;g.observer?.disconnect();
startingEntry=g;
try{
for(const {el,a,name}of g.items){
if(!el.getClientRects().length){a.cancel();continue;}
a.play();record(name);
}
for(const fn of g.accents.splice(0))fn();
}catch(_){finishEntry(g,'play-fallback');}
finally{startingEntry=null;}
if(!g.items.length){g.state='done';g.reason='accent-finished';}else entryEnded(g);
}
function entryPosition(g){
const r=g.el.getBoundingClientRect();
const visibleHeight=Math.min(innerHeight,r.bottom)-Math.max(0,r.top);

const minimum=Math.min(120,innerHeight*.18,Math.max(1,r.height*g.threshold));
return {r,ready:boxVisible(r)&&visibleHeight>=minimum};
}
function checkEntries(){
if(!entrancesReady)return;
for(const g of entries){
if(g.state!=='pending'||g.intro)continue;
const {r,ready}=entryPosition(g);
if(r.bottom<=0){finishEntry(g,'passed-by-fast-scroll');continue;}
if(ready)playEntry(g);
}
}
function registerEntry(el,fn,threshold=.15,intro=false){
if(!el)return null;
const g={id:entries.size+1,el,items:[],accents:[],threshold,state:'preparing',reason:'',starts:0,observer:null,intro,painted:hasPainted(),blocked:false};entries.add(g);
const r=el.getBoundingClientRect();
if(!permitted()||!el.animate||typeof window.IntersectionObserver!=='function'){
g.state='skipped';g.reason='fallback-or-policy';return g;
}
if(!el.getClientRects().length||r.width<=0||r.height<=0){g.state='skipped';g.reason='initially-hidden';return g;}
if(!intro&&(r.bottom<=0||(g.painted&&boxVisible(r)))){g.state='skipped';g.reason=r.bottom<=0?'already-passed':'already-visible';return g;}
const previous=preparing;preparing=g;
try{fn();}catch(_){g.blocked=true;}finally{preparing=previous;}
if(g.blocked){finishEntry(g,'visible-target-or-prepare-fallback');return g;}
if(!g.items.length&&!g.accents.length){g.state='skipped';g.reason='no-effect';return g;}
g.state='pending';

if(!intro){
try{
g.observer=new IntersectionObserver(()=>{if(entrancesReady)checkEntries();},{threshold:[0,.05,.1,.15,.2,.3,.5,1]});
g.observer.observe(el);observers.push(g.observer);
}catch(_){finishEntry(g,'observer-fallback');}
}
return g;
}
function cancel(el){const group=running.get(el);if(group)for(const a of [...group])a.cancel();}
function animate(el,frames,opts={},name='motion'){
if(!el||!el.animate||!permitted()||(!preparing&&!inView(el)))return null;
if(preparing && !canPrepareTarget(el,preparing))return null;
if(!preparing&&!startingEntry)finishRelated(el,'explicit-effect');

if(!opts.allowFocus&&el.contains(document.activeElement)&&document.activeElement!==document.body)return null;
window.CiroMotion?.cancel(el);
cancel(el);
const timing={duration:opts.duration||700,delay:(opts.delay||0)+prepareOffset,easing:opts.easing||ease,fill:'backwards',...opts};
timing.delay=(opts.delay||0)+prepareOffset;

timing.duration=paced(timing.duration,name);timing.delay=paced(timing.delay,name);
try{
const group=preparing;
if(group&&!naturalTransforms.has(el))naturalTransforms.set(el,getComputedStyle(el).transform);
if(group)frames=frames.map((f,i)=>i===0&&f.opacity!==undefined?{...f,opacity:0}:f);
const a=el.animate(frames,timing);
if(group){a.pause();a.currentTime=0;group.items.push({el,a,name});entryOwners.set(el,group);}
if(!running.has(el))running.set(el,new Set());running.get(el).add(a);if(!group)record(name);
const end=()=>{const group=running.get(el);group?.delete(a);if(!group?.size)running.delete(el);};
a.finished.then(()=>{end();entryEnded(group);},()=>{end();entryEnded(group);});return a;
}catch(_){return null;}
}
function after(ms,fn){if(preparing){const previous=prepareOffset;prepareOffset+=ms;try{fn();}finally{prepareOffset=previous;}return null;}const id=setTimeout(()=>{scheduled.delete(id);if(permitted())fn();},ms>=80?paced(ms):ms);scheduled.add(id);return id;}
function resetDepth(){for(const [el,data]of depthNodes){el.style.transform=data.inline;el.classList.remove('mv-depth-live');}for(const el of $$('[data-mv-arrow]'))el.style.removeProperty('translate');}
function stop(){for(const group of entries)finishEntry(group,'policy-or-interruption');for(const set of running.values())for(const a of set)a.cancel();running.clear();for(const id of scheduled)clearTimeout(id);scheduled.clear();for(const el of transient)el.remove();transient.clear();resetDepth();}
function policy(){root.classList.toggle('mv-quiet',!permitted());if(!permitted())stop();queueScroll();}
const stableText=new Set(['editorial-entry','hero-eyebrow','hero-support','hero-action','hero-title','portal-title']);
function fade(el,delay=0,duration=850,name='editorial-entry'){
return animate(el,[{opacity:.25},{opacity:1}],{duration,delay},name);
}
function lift(el,delay=0,distance=30,duration=850,name='editorial-entry'){
if(stableText.has(name)) return fade(el,delay,duration,name);
const move=fine.matches?distance:Math.min(distance,18);
return animate(el,[{opacity:0,translate:`0 ${move}px`},{opacity:1,translate:'0 0'}],{duration,delay},name);
}
function wipe(el,delay=0,side='bottom',name='image-reveal'){
const start=side==='left'?'inset(0 100% 0 0)':side==='right'?'inset(0 0 0 100%)':'inset(0 0 100% 0)';
return animate(el,[{opacity:.25,clipPath:start,translate:'0 20px'},{opacity:1,clipPath:'inset(0 0 0 0)',translate:'0 0'}],{duration:1050,delay},name);
}
function settle(el,delay=0,kind='sheet'){
if(!el)return;const original=getComputedStyle(el).transform;const base=original==='none'?'':original;
const start=kind==='sheet'?' translateY(38px) rotateZ(-4deg) scale(.97)':' translateY(36px) rotateX(10deg) scale(.96)';
animate(el,[{opacity:.1,transform:base+start},{opacity:1,transform:original}],{duration:1150,delay},kind+'-entry');
}
function watch(el,fn,threshold=.15){return registerEntry(el,fn,threshold);}
function watchAccent(el,fn,threshold=.1){

if(!el||!permitted())return;
if(typeof window.IntersectionObserver!=='function'){if(inView(el))fn();return;}
const observer=new IntersectionObserver(list=>{for(const e of list){if(!e.isIntersecting)continue;observer.disconnect();const ready=window.CiroTypography?.ready||Promise.resolve({stable:true});ready.then(t=>{if(t.stable&&permitted())fn();});}}, {threshold:Math.min(threshold,.1)});
observer.observe(el);observers.push(observer);
}
function draw(path,delay=0,duration=1000){
if(!path||!permitted()||(!preparing&&!inView(path)))return;
if(preparing&&!canPrepareTarget(path,preparing))return;
let length;try{length=path.getTotalLength();}catch{return;}
if(!length)return;
const saved=path.style.strokeDasharray;path.style.strokeDasharray=`${length} ${length}`;
const a=animate(path,[{strokeDashoffset:length},{strokeDashoffset:0}],{duration,delay,easing:'cubic-bezier(.42,0,.18,1)'},'vector-draw');
const restore=()=>{path.style.strokeDasharray=saved;};if(a)a.finished.then(restore,restore);else restore();
}
function drawAll(sel,delay=0){$$(sel).forEach((el,i)=>draw(el,delay+i*95));}
function rule(el,delay=0){
if(preparing){preparing.accents.push(()=>rule(el,delay));return;}
if(!el||!permitted()||!inView(el))return;el.classList.add('mv-rule-host');
const ink=document.createElement('span');ink.className='mv-rule-ink';ink.setAttribute('aria-hidden','true');el.append(ink);transient.add(ink);
const a=animate(ink,[{transform:'scaleX(0)',opacity:.9},{transform:'scaleX(1)',opacity:.9,offset:.82},{transform:'scaleX(1)',opacity:0}],{duration:1300,delay},'line-draw');
const end=()=>{ink.remove();transient.delete(ink);};if(a)a.finished.then(end,end);else end();
}
function pulse(el,name='state-emphasis',delay=0){
if(preparing){preparing.accents.push(()=>pulse(el,name,delay));return;}
if(!el)return;const original=getComputedStyle(el).boxShadow;
animate(el,[{boxShadow:'0 0 0 0 rgba(167,205,244,0)'},{boxShadow:'0 0 0 6px rgba(167,205,244,.32)',offset:.25},{boxShadow:original}],{duration:850,delay,allowFocus:true},name);
}
function signal(host,source,targets){
if(!host||!source||!permitted()||!inView(host))return;
const hb=host.getBoundingClientRect(),sr=source.getBoundingClientRect();if(!hb.width||!hb.height)return;
host.classList.add('mv-signal-host');
const overlay=document.createElement('div');overlay.className='mv-signal-overlay';overlay.setAttribute('aria-hidden','true');host.append(overlay);transient.add(overlay);
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${hb.width} ${hb.height}`);svg.setAttribute('width','100%');svg.setAttribute('height','100%');overlay.append(svg);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
targets.filter(Boolean).forEach((target,i)=>{
const tr=target.getBoundingClientRect();if(!tr.width||!inView(target))return;
const horizontal=tr.left>sr.right+8;
const sx=clamp((horizontal?sr.right:sr.left+sr.width/2)-hb.left,8,hb.width-8),sy=clamp((horizontal?sr.top+sr.height/2:sr.bottom)-hb.top,8,hb.height-8);
const ex=clamp((horizontal?tr.left:tr.left+tr.width/2)-hb.left,8,hb.width-8),ey=clamp((horizontal?tr.top+tr.height/2:tr.top)-hb.top,8,hb.height-8);
const mx=horizontal?(sx+ex)/2:sx,my=horizontal?sy:(sy+ey)/2;
const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('class','mv-signal-path');p.setAttribute('d',`M${sx},${sy} L${mx},${my} L${horizontal?mx:ex},${horizontal?ey:my} L${ex},${ey}`);svg.append(p);draw(p,i*140,780);
const dot=document.createElement('i');dot.className='mv-packet';dot.style.transform=`translate(${sx-7}px,${sy-5}px)`;overlay.append(dot);
const a=animate(dot,[{transform:`translate(${sx-7}px,${sy-5}px)`,opacity:0},{transform:`translate(${sx-7}px,${sy-5}px)`,opacity:1,offset:.08},{transform:`translate(${mx-7}px,${my-5}px)`,opacity:1,offset:.42},{transform:`translate(${(horizontal?mx:ex)-7}px,${(horizontal?ey:my)-5}px)`,opacity:1,offset:.75},{transform:`translate(${ex-7}px,${ey-5}px)`,opacity:0}],{duration:850,delay:i*140,easing:'ease-in-out'},'content-flow');
after(620+i*140,()=>pulse(target,'flow-arrival'));
});
after(1500,()=>{overlay.remove();transient.delete(overlay);});
}

function intro(replay=false){
if(!permitted()||scrollY>90||document.body.matches('.l-document'))return;
const h=$('main h1');if(!h)return;const contact=document.body.matches('.contact-page');

const painted=performance.getEntriesByType?.('paint').some(e=>e.name==='first-contentful-paint');
const revealType=replay||!painted;
if(revealType)fade(h,60,1050,'hero-title');
if(revealType)animate($('em',h),[{opacity:.18},{opacity:1}],{delay:contact?150:380,duration:700},'hero-accent');
const eyebrow=$('.hero-meta,.opening-copy>.eyebrow,.r-index-heading>.eyebrow,.r-case-heading .eyebrow,.s-cei-title>.eyebrow,.m-hero-copy>.eyebrow,.c-hero-body>.eyebrow,.utility-grid .eyebrow');
if(revealType)lift(eyebrow,0,12,500,'hero-eyebrow');
const leads=$$('.hero-intro>p,.hero-intro>.eyebrow,.opening-lead,.opening-note,.s-index-deck>p,.r-case-aside>p,.s-cei-title>p,.m-hero-copy>p,.c-hero-bottom>p,.utility-grid>div>p');
if(revealType)leads.forEach((el,i)=>lift(el,280+i*110,22,800,'hero-support'));
if(revealType)$$('.intro-links,.opening-copy>.text-link,.s-cei-title>.text-link,.m-hero-copy>.text-link,.c-write-link').forEach(el=>lift(el,550,14,650,'hero-action'));
if(document.body.matches('.home-page')){
drawAll('.title-orbit path',320);animate($('.title-orbit'),[{rotate:'-45deg',opacity:0},{rotate:'0deg',opacity:1}],{duration:1200,delay:350},'home-orbit');
$$('.hero-arc').forEach((el,i)=>animate(el,[{opacity:0,translate:`${35+i*20}px ${-24-i*10}px`},{opacity:1,translate:'0 0'}],{duration:1500,delay:100+i*120},'home-arc'));
}
if(document.body.matches('.services-page')){
drawAll('.compass-drawing circle[fill="none"]',240);
animate($('.compass-needle'),[{transform:'rotate(-58deg)'},{transform:'rotate(12deg)',offset:.6},{transform:'rotate(-3deg)',offset:.82},{transform:'rotate(0deg)'}],{duration:1350,delay:360},'compass-intro');
$$('.route-choice').forEach((el,i)=>lift(el,420+i*100,16,720,'compass-choice'));
}
if(document.body.matches('.r-cei'))settle($('.s-cei-paper'),460,'sheet');
if(document.body.matches('.r-auto'))rule($('.r-case-facts'),560);
if(document.body.matches('.method-page')){
drawAll('.trace-spine',300);$$('.trace-stops li').forEach((el,i)=>lift($('a>span:not(.trace-dot)',el),370+i*115,13,620,'trace-stop'));
}
if($('.error-number'))animate($('.error-number'),[{opacity:0,scale:'.86',rotate:'-7deg'},{opacity:1,scale:'1.025',rotate:'1deg',offset:.75},{opacity:1,scale:'1',rotate:'0deg'}],{duration:1250,delay:200},'404-assembly');
if($('.utility-note'))settle($('.utility-note'),350,'sheet');
}
function editorial(){
if(document.body.matches('.l-document'))return;

$$('.section-intro h2,.access-title h2,.detail-heading h2,.r-chapter-head h2,.s-conclusion h2,.section-heading h2,.restoration-copy h2,.resilience-copy h2,.delivery-layout h2,.m-heading h2,.m-agreement-heading h2,.m-close h2,.service-close h2,.finale h2,.c-direct h2,.c-after h2').forEach(el=>watch(el,()=>lift(el,0,28,850)));
$$('.section-rule,.section-meta,.hero-close,.m-hero-tail,.c-hero-tail,.s-index-close .wrap').forEach(el=>watchAccent(el,()=>rule(el),.1));
}
function home(){
if(!document.body.matches('.home-page'))return;
watch($('.demo-browser'),()=>{
settle($('.demo-browser'),80,'browser');
animate($('.sculpture img'),[{opacity:0,rotate:'-20deg',scale:'.82'},{opacity:1,rotate:'3deg',scale:'1.03',offset:.76},{opacity:1,rotate:'0deg',scale:'1'}],{duration:1300,delay:150},'home-sculpture');
},.18);
watchAccent($('.expertise-list'),()=>$$('.expertise-item').forEach((e,i)=>rule(e,i*130)),.1);
watch($('.principle-art'),()=>wipe($('.principle-art'),100,'left','principle-entry'));
watch($('.contact-orb'),()=>animate($('.contact-orb-rings'),[{scale:'.7',opacity:0,rotate:'-35deg'},{scale:'1',opacity:1,rotate:'0deg'}],{duration:1300},'contact-orbit'));
document.addEventListener('click',e=>{
if(e.target.closest?.('.lab-tabs button'))after(0,()=>{
rule($('.workspace-top'));const active=$('.lab-panel:not([hidden]) .panel-copy');lift(active,40,16,650,'laboratory-panel');
animate($('.sculpture img'),[{scale:'.94',rotate:'-5deg'},{scale:'1',rotate:'0deg'}],{duration:650},'laboratory-sculpture');
});
if(e.target.closest?.('.principle-choices button'))after(0,()=>wipe($('.principle-panel:not([hidden]) .principle-art'),40,'left','principle-change'));
});
}
function projectIndex(){
if(!document.body.matches('.r-index'))return;
$$('.s-portal').forEach((portal,i)=>watch(portal,()=>{
lift($('.s-portal-line',portal),0,12,500,'portal-label');lift($('h2',portal),100,24,700,'portal-title');
},.08));
$$('.s-portal').forEach((portal,i)=>{
const visual=$('.s-preview-browser,.s-preview-paper',portal),note=$('.s-portal-note',portal);
watch(visual,()=>settle(visual,100,i?'sheet':'browser'),.22);
watchAccent(note,()=>rule(note,50),.25);
});
for(const el of $$('.s-preview-browser,.s-preview-paper')){
const host=el.closest('a'),base=naturalTransforms.get(el)||getComputedStyle(el).transform;depthNodes.set(el,{inline:el.style.transform,base:base==='none'?'':base});let raf=0,x=0,y=0;
host.addEventListener('pointermove',event=>{
if(event.pointerType!=='mouse'||!fine.matches||!permitted())return;
const r=host.getBoundingClientRect();x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));y=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(!permitted())return;finishRelated(el,'pointer-depth');cancel(el);el.classList.add('mv-depth-live');el.style.transform=depthNodes.get(el).base+` rotateX(${-y*2.5}deg) rotateY(${x*3.8}deg) translateZ(8px)`;});
},{passive:true});
const reset=()=>{cancelAnimationFrame(raf);raf=0;el.classList.remove('mv-depth-live');el.style.transform=depthNodes.get(el).inline;};
host.addEventListener('pointerleave',reset);host.addEventListener('pointercancel',reset);host.addEventListener('focusin',reset);
}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-focus-project]'))after(280,()=>$$('.s-portal').filter(inView).forEach(p=>rule($('.s-portal-note',p))));});
}
function autoCase(){
if(!document.body.matches('.r-auto'))return;
const compare=$('.s-compare-panel:not([hidden])');
watch(compare,()=>{
wipe($('.s-before .s-photo',compare),0,'left','compare-before');wipe($('.s-after .s-photo',compare),230,'right','compare-after');
},.13);
document.addEventListener('click',e=>{
if(e.target.closest?.('[data-compare-format]'))after(0,()=>{const p=$('.s-compare-panel:not([hidden])');wipe($('.s-before .s-photo',p),0,'left','compare-format');wipe($('.s-after .s-photo',p),130,'right','compare-format');});
if(e.target.closest?.('[data-inspect]'))after(0,()=>pulse($('.s-inspect-copy'),'compare-annotation'));
});
watch($('.s-journey'),()=>$$('.s-route:not([hidden]) .s-route-steps li').forEach((el,i)=>lift(el,i*160,20,700,'journey-step')),.18);
document.addEventListener('change',e=>{if(e.target.matches('input[name="intent"]'))after(0,()=>$$('.s-route:not([hidden]) .s-route-steps li').forEach((el,i)=>lift(el,i*150,18,600,'journey-choice')));});
$$('.s-route-proof figure').forEach(e=>watch(e,()=>wipe($('img',e),90,'left','proof-image'),.1));
}
function cercoCase(){
if(!document.body.matches('.r-cei'))return;
watch($('.r-map'),()=>{
lift($('.r-map-root'),0,14,550,'map-root');$$('.r-map-node').forEach((n,i)=>lift(n,160+i*130,24,700,'map-node'));
});
$$('.s-cei-pages .r-shot').forEach((el,i)=>watch(el,()=>settle(el,80,i?'sheet':'browser'),.15));
document.addEventListener('click',e=>{
if(e.target.closest?.('[data-editorial-view],[data-editorial-entry]'))after(0,()=>{
const reader=$('[data-editorial-reader]');animate(reader,[{opacity:.2,translate:'10px 0'},{opacity:1,translate:'0 0'}],{duration:480},'quaderno-page-turn');
});
if(e.target.closest?.('[data-map-route]'))after(0,()=>pulse($('.r-map-node[open]'),'map-choice'));
});

document.addEventListener('submit',e=>{if(e.target.closest('.editorial-demo'))after(0,()=>{if(!$('.editorial-demo [aria-invalid="true"]'))pulse($('[data-editorial-screen]'),'quaderno-published');});});
}
function services(){
if(!document.body.matches('.services-page'))return;
watch($('.blueprint'),()=>{
$$('.plan-node:not([hidden])').forEach((el,i)=>{animate(el,[{opacity:0},{opacity:1}],{duration:700,delay:i*160},'blueprint-node');$$('.node-bars i,.node-tiles i',el).forEach((bar,j)=>animate(bar,[{scale:'.2 1',opacity:0},{scale:'1 1',opacity:1}],{duration:600,delay:i*160+j*70},'blueprint-component'));});animate($('.blueprint-lines'),[{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:1000,delay:220},'blueprint-paths-entry');
});
$('.needs')?.addEventListener('change',()=>after(40,()=>{
drawAll('.blueprint-lines path');$$('.plan-extra:not([hidden]),.management-band:not([hidden])').forEach((el,i)=>animate(el,[{opacity:.1},{opacity:1}],{duration:650,delay:60+i*100},'blueprint-grow'));
}));
const stage=$('[data-model-stage]'),object=$('.site-object');
watch(stage,()=>{
if(stage.classList.contains('is-flat'))return;

const gap=parseFloat(object.style.getPropertyValue('--layer-gap'))||40;
$$('.site-layer',stage).forEach((el,i)=>{
const original=getComputedStyle(el).transform,base=original==='none'?'':original;
animate(el,[{opacity:.2,transform:base+` translateZ(${(i-1)*-Math.max(0,gap-8)}px)`},{opacity:1,transform:base+` translateZ(${(i-1)*Math.min(26,gap*.35)}px)`,offset:.56},{opacity:1,transform:original}],{duration:1650,delay:i*90},'3d-open-settle');
});
},.22);
const cancelModel=()=>$$('.site-layer',stage||document).forEach(cancel);
$('.exploded-workshop')?.addEventListener('pointerdown',cancelModel,{passive:true,capture:true});
$('.exploded-workshop')?.addEventListener('keydown',cancelModel,true);
$('.route-choices')?.addEventListener('change',()=>after(0,()=>{
const selected=$('.route-choice input:checked')?.closest('label');pulse(selected,'compass-selection');lift($('.direction-line>div'),20,12,650,'compass-description');
}));
$('[data-update-hours]')?.addEventListener('click',()=>after(0,()=>signal($('.hours-system'),$('.hours-edit'),$$('.hours-destinations>div'))));
watch($('.handover-folder'),()=>settle($('.handover-folder'),40,'sheet'));
$('.folder-content')?.addEventListener('toggle',e=>{if(e.target.open)$$('.folder-content dl>div').forEach((el,i)=>lift(el,i*110,20,650,'delivery-sheet'));});
}
function method(){
if(!document.body.matches('.method-page'))return;
$$('.rail-station').forEach(st=>watch(st,()=>{
const c=$('.rail-input.client',st),m=$('.rail-input.maker',st);
animate(c,[{opacity:.1,translate:'0 -22px'},{opacity:1,translate:'0 0'}],{duration:800},'collaboration-client');
lift(m,160,22,800,'collaboration-maker');$$('.rail-junction i',st).forEach((el,i)=>animate(el,[{scale:'1 0'},{scale:'1 1'}],{duration:850,delay:180+i*120},'collaboration-join'));
pulse($('.shared-decision',st),'collaboration-decision',380);
},.2));
for(const phase of $$('.phase'))watch($('.brief-paper,.outline-sheet,.type-specimen,.build-artifact,.release-strip',phase)||phase,()=>{
const item=$('.brief-paper,.outline-sheet,.type-specimen,.build-artifact,.release-strip',phase);
if(phase.classList.contains('phase-style')){
$$('.type-pair>*,.specimen-colors i',phase).forEach((el,i)=>lift(el,i*90,22,700,'typography-assembly'));
}else if(phase.classList.contains('phase-order')){
$$('.outline-sheet li',phase).forEach((el,i)=>wipe(el,i*160,'left','outline-draw'));
}else if(phase.classList.contains('phase-build'))wipe(item,0,'left','code-reveal');
else settle(item,0,'sheet');
},.16);
const line=$('.evidence-line');if(line){const ink=document.createElement('i');ink.className='mv-evidence-progress';ink.setAttribute('aria-hidden','true');line.prepend(ink);}
$('.scope-machine')?.addEventListener('click',e=>{
if(!e.target.closest('[data-scope-answer],[data-scope-another]'))return;
after(0,()=>{const box=$('.scope-machine'),key=box.dataset.scopeState;
if(['included','review','later'].includes(key))signal(box,$('.request-ticket'),[$(`[data-scope-exit="${key}"]`)]);
else if(e.target.closest('[data-scope-another]'))wipe($('.request-ticket'),0,'left','request-ticket');
});
});
const release=$('.release-demo');
if(release)new MutationObserver(()=>{
const key=release.dataset.releaseStage;
if(['recheck','ready','done'].includes(key)){
const dot=$$('[data-release-dot].current',release).at(-1);pulse(dot,'release-gate');
if(key==='done')animate($('.issue-marker',release),[{scale:'.4',opacity:.1},{scale:'1.1',opacity:1,offset:.7},{scale:'1',opacity:1}],{duration:720},'release-confirmation');
}
}).observe(release,{attributes:true,attributeFilter:['data-release-stage']});
}
function contact(){
if(!document.body.matches('.contact-page'))return;
const select=$('#servizio');
select?.addEventListener('change',()=>after(0,()=>animate($('.c-context-copy'),[{opacity:.3,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:420},'contact-guidance')));

const form=$('form[name="contatti"]');form?.addEventListener('focusin',e=>{
if(!e.target.matches('input:not([type=checkbox]),textarea,select'))return;
const computed=getComputedStyle(e.target).boxShadow;
animate(e.target,[{boxShadow:'0 0 0 0 rgba(167,205,244,0)'},{boxShadow:'0 0 0 4px rgba(167,205,244,.18)',offset:.45},{boxShadow:computed}],{duration:500,allowFocus:true},'field-focus');
});
}
function micro(){
for(const el of $$('.text-link,.s-portal-action,.c-channel,.c-write-link,.header-cta')){
if(el.closest('.l-document,.site-footer'))continue;
const arrow=$('span[aria-hidden],.c-channel-arrow',el);if(!arrow)continue;arrow.setAttribute('data-mv-arrow','');
let raf=0,x=0,y=0;
el.addEventListener('pointermove',e=>{
if(e.pointerType!=='mouse'||!fine.matches||!permitted())return;
const r=el.getBoundingClientRect();x=Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)*.03));y=Math.max(-3,Math.min(3,(e.clientY-r.top-r.height/2)*.08));
if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(permitted())arrow.style.translate=`${x}px ${y}px`;});
},{passive:true});
const clear=()=>{cancelAnimationFrame(raf);raf=0;arrow.style.removeProperty('translate');};el.addEventListener('pointerleave',clear);el.addEventListener('focusin',clear);el.addEventListener('pointercancel',clear);
}
const menu=$('#menu-principale');if(menu)new MutationObserver(()=>{
if(menu.classList.contains('open')&&permitted())$$('a',menu).forEach((el,i)=>lift(el,40+i*45,12,420,'menu-link'));
}).observe(menu,{attributes:true,attributeFilter:['class']});
}
function updateScroll(){
scrollFrame=0;if(sleeping||document.hidden)return;
checkEntries();
const allowed=permitted();
for(const arc of $$('.hero-arc')){
if(allowed&&fine.matches&&inView(arc)){arc.style.translate=`0 ${-Math.min(scrollY*.045,38)}px`;}else arc.style.removeProperty('translate');
}
const line=$('.evidence-line');if(line){
const r=line.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight*.62-r.top)/Math.max(1,r.height-100)));
line.style.setProperty('--mv-track',allowed?progress.toFixed(4):'1');
for(const phase of $$('.phase',line)){const b=phase.getBoundingClientRect();phase.classList.toggle('mv-phase-current',b.topinnerHeight*.38);}
}
}
function queueScroll(){if(!scrollFrame&&!sleeping&&!document.hidden)scrollFrame=requestAnimationFrame(updateScroll);}

document.addEventListener('pointerdown',e=>{
finishRelated(e.target,'pointer-input');
for(const [el]of running)if(el.contains(e.target)||e.target.contains?.(el))cancel(el);
const region=e.target.closest?.('.lab,.exploded-workshop,.s-compare-panel,.editorial-demo');
if(region)for(const [el]of running)if(region.contains(el))cancel(el);
},{passive:true,capture:true});
document.addEventListener('focusin',e=>{finishRelated(e.target,'focus');for(const [el,animations]of running)if(el.contains(e.target)&&[...animations].some(a=>a.effect.getKeyframes().some(f=>f.transform||f.translate||f.clipPath)))cancel(el);});
document.addEventListener('input',e=>finishRelated(e.target,'input'),true);
document.addEventListener('change',e=>finishRelated(e.target,'change'),true);
document.addEventListener('keydown',e=>{if(['Tab','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key))stop();},true);
reduce.addEventListener('change',policy);fine.addEventListener('change',()=>{resetDepth();policy();});contrast.addEventListener('change',policy);
new MutationObserver(policy).observe(root,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{sleeping=document.hidden;policy();});
addEventListener('pagehide',()=>{sleeping=true;stop();cancelAnimationFrame(scrollFrame);scrollFrame=0;});
addEventListener('pageshow',e=>{sleeping=document.hidden;policy();if(e.persisted)stop();});
addEventListener('beforeprint',()=>{printing=true;policy();});addEventListener('afterprint',()=>{printing=false;policy();});
addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',()=>{for(const group of entries)finishEntry(group,'resize');resetDepth();queueScroll();},{passive:true});
window.CiroVisual=Object.freeze({rhythm,get enabled(){return permitted();},get activeAnimations(){return [...running.values()].reduce((n,set)=>n+[...set].filter(a=>a.playState==='running').length,0);},get entrances(){return entrySnapshot();},get events(){return {...events};},cancelAll:stop,replayIntro:()=>{stop();intro(true);},springProgress:t=>t>=1?1:1-Math.exp(-7*t)*Math.cos(10*t)});
let visualStarted=false;
function init(typography){
if(visualStarted)return;visualStarted=true;
entrancesReady=!!(!typography||typography.stable);policy();
if(!entrancesReady||window.CiroTypography?.interacted){stop();return;}

if(earlyIntro){if(entrancesReady&&!window.CiroTypography?.interacted)playEntry(earlyIntro);else finishEntry(earlyIntro,'typography-or-input');}
checkEntries();
queueScroll();
}
const start=()=>{
root.classList.add('mv-ready');policy();
try{editorial();home();projectIndex();autoCase();cercoCase();services();method();contact();micro();}catch(_){stop();}
if(!hasPainted()&&permitted()&&scrollY<=90&&!window.CiroTypography?.interacted){
earlyIntro=registerEntry($('main h1'),()=>intro(true),0,true);
}
const typography=window.CiroTypography;
if(typography?.ready)typography.ready.then(init,()=>init({stable:false}));
else init();
};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();
