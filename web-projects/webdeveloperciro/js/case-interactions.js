(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set();
const safe = (label, fn) => { try { fn(); } catch (err) { console.error(label, err); } };
const enter = el => {
if (window.CiroMotion) return window.CiroMotion.enter(el);
if (!el || motion.matches || !el.animate) return;
const a = el.animate([{opacity:.5, transform:'translateY(6px)'}, {opacity:1, transform:'none'}], {duration:280, easing:'ease-out'});
animations.add(a); a.finished.then(() => animations.delete(a), () => animations.delete(a));
};
const stop = () => { animations.forEach(a => a.cancel()); animations.clear(); };
motion.addEventListener?.('change', () => { if (motion.matches) stop(); });
addEventListener('pagehide', stop);
safe('ingressi', () => {
$$('[data-proof]').forEach(portal => {
const button = $('[data-proof-toggle]', portal), label = $('[data-proof-label]', portal);
const original = button.firstChild.textContent;
let showResult = true;
const select = () => {
portal.classList.toggle('is-schema', !showResult);
button.setAttribute('aria-pressed', String(showResult));
button.firstChild.textContent = showResult ? original : 'Mostra il risultato ';
label.textContent = showResult ? 'Schermata del risultato' : 'Schema esplicativo, non una schermata';
$('.portal-result', portal).setAttribute('aria-hidden', String(!showResult));
$('.portal-schematic', portal).setAttribute('aria-hidden', String(showResult));
};
button.addEventListener('click', () => { showResult = !showResult; select(); });
portal.classList.add('proof-ready'); $('.r-proof-tools', portal).hidden = false; select();
});
const board = $('[data-portal]');
if (!board) return;
const range = $('#portal-range', board);
const set = () => {
const n = Math.max(38, Math.min(62, Number(range.value)));
board.style.setProperty('--balance', n + '%');
range.setAttribute('aria-valuetext', `${n}% Autolavaggio, ${100-n}% Cerco e Informo`);
};
range.addEventListener('input', set);
$('[data-balance-reset]', board).addEventListener('click', () => { range.value = '50'; set(); });
$('.portal-adjust', board).hidden = false; set();
});
safe('documento d’archivio', () => {
const box = $('[data-audit]'); if (!box) return;
const notes = $$('[data-audit-note]', box);
const sync = () => {
const active = notes.find(n => n.open)?.dataset.auditNote;
$$('[data-evidence]', box).forEach(e => e.classList.toggle('is-pointed', e.dataset.evidence === active));
};
notes.forEach(n => n.addEventListener('toggle', sync)); sync();
});
safe('percorsi', () => {
const box = $('[data-journey]'); if (!box) return;
const radios = $$('input[name=intent]', box), views = $$('[data-route]', box);
const select = (animate = true) => {
const value = radios.find(r => r.checked)?.value || 'wash';
views.forEach(view => { view.hidden = view.dataset.route !== value; });
$('[data-journey-status]', box).textContent = value === 'wash' ? 'Lavaggio: passaggi del tunnel, opzioni e prenotazione degli interni.' : 'Parcheggio: area, condizioni e disponibilità.';
if (animate) enter(views.find(v => !v.hidden));
};
radios.forEach(r => r.addEventListener('change', () => select()));
box.classList.add('journey-ready'); $('.r-intents', box).hidden = false; select(false);
});
safe('mappa', () => {
const map = $('[data-r-map]'); if (!map) return;
const nodes = $$('[data-route-node]', map), buttons = $$('[data-map-route]', map);
const labels = {person:'Home → Chi sono → Contatti',services:'Home → Servizi → Contatti',read:'Home → Quaderno → Articolo'};
const select = (key, openNode = true) => {
nodes.forEach(n => {
n.classList.toggle('on-route', n.dataset.routeNode === key);
if (openNode) n.open = n.dataset.routeNode === key;
});
buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mapRoute === key)));
$('[data-map-status]', map).textContent = labels[key];
};
buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.mapRoute)));
nodes.forEach(n => n.addEventListener('toggle', () => { if (n.open) select(n.dataset.routeNode, false); }));
$('.r-map-tools', map).hidden = false; select('services');
});
safe('finestra responsive', () => {
$$('[data-responsive]').forEach(component => {
const controls = $('.responsive-controls', component), range = $('input[type=range]', controls);
const pad = $('.responsive-pad', component), win = $('.responsive-window', component);
const output = $('[data-width-output]', component), ruler = $('[data-width-ruler]', component), buttons = $$('[data-responsive-size]', component);
let ratio = 1, maximum = 1000, minimum = 280;
const report = () => {
const actual = Math.round(win.getBoundingClientRect().width);
output.value = `${actual} px`; ruler.textContent = `${actual} PX`;
};
const setWidth = (value, fromRange = false) => {
const v = Math.max(minimum, Math.min(maximum, Number(value) || maximum));
range.value = String(Math.round(v)); range.setAttribute('aria-valuetext', `${Math.round(v)} pixel di larghezza della prova`);
win.style.transition = fromRange ? 'none' : ''; win.style.width = `${v}px`;
buttons.forEach(b => b.setAttribute('aria-pressed', String(Math.abs(v - Math.max(minimum, maximum*Number(b.dataset.responsiveSize))) < 2)));
requestAnimationFrame(report);
};
const measure = () => {
maximum = Math.max(1, Math.min(1000, Math.floor(pad.getBoundingClientRect().width)));
minimum = Math.min(280, maximum); range.min = String(minimum); range.max = String(maximum); range.disabled = maximum <= minimum;
setWidth(maximum*ratio, true);
};
range.addEventListener('input', () => { ratio = Number(range.value)/maximum; setWidth(range.value, true); });
buttons.forEach(b => b.addEventListener('click', () => { ratio = Number(b.dataset.responsiveSize); setWidth(maximum*ratio); }));
controls.hidden = false; measure();
if ('ResizeObserver' in window) { new ResizeObserver(measure).observe(pad); new ResizeObserver(report).observe(win); }
else addEventListener('resize', measure, {passive:true});
win.addEventListener('transitionend', report);
const action = $('[data-spec-action]', component), status = $('[data-spec-status]', component);
if (action) action.hidden = false;
action?.addEventListener('click', () => {
status.textContent = 'Opzioni evidenziate: tunnel, interni e posti auto. Nessuna prenotazione eseguita.';
$('.spec-cards', component).classList.add('spec-highlight'); enter($('.spec-cards', component));
});
});
});
safe('Quaderno', () => {
const app = $('[data-r-app]'); if (!app) return;
const form = $('[data-app-editor]', app), title = $('#app-title', app), cat = $('#app-category', app), body = $('#app-text', app);
const list = $('[data-app-list]', app), error = $('#app-title-error', app), status = $('[data-app-status]', app);
const dirty = $('[data-app-dirty]', app), state = $('[data-app-state]', app), preview = $('.r-app-preview', app);
const coverButtons = $$('[data-cover]', app), art = $('[data-preview-art]', app), live = $('.r-live-article', app);
const range = $('#app-width', app), pad = $('.r-app-preview-pad', app), win = $('[data-app-window]', app), width = $('[data-app-width]', app);
const defaults = [
{id:1,published:{title:'Un pomeriggio all’aperto.',category:'Riflessioni',body:'Un taccuino, qualche idea e il tempo per osservarle. Questo è un testo di esempio: puoi riscriverlo e vedere come cambia la pagina.',cover:'horizon'}},
{id:2,published:{title:'Appunti da raccogliere.',category:'Appunti',body:'Una frase incontrata per caso, un dettaglio da non dimenticare. Questo secondo esempio è pronto per essere modificato.',cover:'arch'}}
];
const clone = v => JSON.parse(JSON.stringify(v));
let entries, selectedId = 1, counter = 2, view = 'card';
const entry = () => entries.find(e => e.id === selectedId);
const stage = name => {
$$('[data-app-stage]', app).forEach(e => {
const current = e.dataset.appStage === name; e.classList.toggle('is-current', current);
if(current) e.setAttribute('aria-current','step'); else e.removeAttribute('aria-current');
});
};
const clearError = () => { error.hidden = true; error.textContent = ''; title.removeAttribute('aria-invalid'); };
const isDirty = e => JSON.stringify(e.draft) !== JSON.stringify(e.published);
const renderList = () => {
const restoreFocusId = list.contains(document.activeElement) ? document.activeElement.closest('[data-entry-id]')?.dataset.entryId : null;
const fragment = document.createDocumentFragment();
entries.forEach(e => {
const button = document.createElement('button'); button.type = 'button'; button.dataset.entryId = String(e.id);
button.setAttribute('aria-pressed', String(e.id === selectedId));
const label = document.createElement('strong'); label.textContent = (e.published ? e.published.title : e.draft.title.trim()) || 'Nuovo esempio';
const sub = document.createElement('span'); sub.textContent = isDirty(e) ? 'Bozza modificata · da simulare' : e.published ? 'Esempio nell’elenco' : 'Nuovo esempio';
button.append(label,sub); button.addEventListener('click', () => select(e.id)); fragment.append(button);
});
list.replaceChildren(fragment);
if(restoreFocusId) $('[data-entry-id=\"'+restoreFocusId+'\"]', list)?.focus({preventScroll:true});
$('[data-app-new]', app).disabled = entries.length >= 6;
};
const renderPreview = () => {
const d = entry().draft;
$('[data-preview-title]', app).textContent = d.title || 'Il tuo titolo';
$('[data-preview-category]', app).textContent = d.category;
$('[data-preview-body]', app).textContent = d.body;
art.className = 'r-demo-art art-' + d.cover;
coverButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cover === d.cover)));
const changed = isDirty(entry());
dirty.textContent = changed ? 'Modifiche solo nella prova. La simulazione aggiornerà l’elenco.' : 'Nessuna modifica in attesa.';
state.value = changed ? 'Modifiche nella prova' : 'Contenuto di esempio';
};
const select = (id, announce = true) => {
selectedId = id; const d = entry().draft;
title.value = d.title; cat.value = d.category; body.value = d.body;
clearError(); renderList(); renderPreview(); stage('list');
if(announce) status.textContent = `Selezionato: ${d.title || 'nuovo esempio'}. Puoi modificarlo; nulla sarà inviato online.`;
};
const update = () => {
const d = entry().draft; d.title = title.value; d.category = cat.value; d.body = body.value;
if(title.value.trim()) clearError(); renderPreview(); renderList(); stage('edit');
};
[title,body].forEach(input => input.addEventListener('input', update)); cat.addEventListener('change', update);
coverButtons.forEach(b => b.addEventListener('click', () => {
entry().draft.cover = b.dataset.cover; renderPreview(); renderList(); stage('edit');
status.textContent = `Copertina ${b.textContent.toLowerCase()}: aggiornata nell’anteprima locale.`;
}));
const sizePreview = () => {
const maximum = Math.max(1, Math.floor(pad.clientWidth));
const minimum = Math.min(235, maximum); const ratio = Number(range.value) / 100;
win.style.width = Math.max(minimum, Math.round(maximum * ratio)) + 'px';
requestAnimationFrame(() => {
const actual = Math.round(win.getBoundingClientRect().width);
width.value = actual + ' px'; range.setAttribute('aria-valuetext', `${actual} pixel di larghezza reale`);
});
range.disabled = maximum <= minimum;
};
range.addEventListener('input', sizePreview);
if('ResizeObserver' in window) new ResizeObserver(sizePreview).observe(pad); else addEventListener('resize', sizePreview, {passive:true});
const setView = which => {
view = which; live.dataset.view = view;
$$('[data-app-view]',app).forEach(b => b.setAttribute('aria-pressed',String(b.dataset.appView === view)));
$('[data-app-view-label]',app).textContent = view === 'card' ? 'Scheda nell’elenco' : 'Pagina articolo';
stage('preview'); status.textContent = view === 'card' ? 'Vista scheda: un riepilogo per l’elenco degli articoli.' : 'Vista articolo: lo stesso contenuto in una pagina di lettura.';
sizePreview();
};
$$('[data-app-view]',app).forEach(b => b.addEventListener('click', () => setView(b.dataset.appView)));
$('[data-app-preview]',app).addEventListener('click', () => {
stage('preview'); preview.focus();
preview.scrollIntoView({block:'start',behavior:motion.matches ? 'instant' : 'smooth'});
status.textContent = 'Anteprima locale. Puoi cambiare tipo di pagina e larghezza senza perdere il testo.';
});
form.addEventListener('submit', event => {
event.preventDefault(); // Deliberately no network, storage or WordPress call.
update();
if(!title.value.trim()) {
error.textContent = 'Scrivi un titolo per simulare la pubblicazione.'; error.hidden = false; title.setAttribute('aria-invalid','true'); title.focus();
status.textContent = 'Simulazione non eseguita: manca il titolo.'; return;
}
entry().draft.title = entry().draft.title.trim(); title.value = entry().draft.title;
entry().published = clone(entry().draft); renderList(); renderPreview(); stage('publish'); const publishedButton = list.querySelector('[data-entry-id=\"'+selectedId+'\"]'); if(publishedButton){ publishedButton.classList.add('is-published-flash'); setTimeout(()=>publishedButton.classList.remove('is-published-flash'),1800); }
state.value = 'Simulazione completata';
status.textContent = `“${entry().published.title}” è aggiornato nell’elenco di questa prova. Non è stato pubblicato su Internet. Puoi continuare a modificarlo.`;
});
$('[data-app-new]',app).addEventListener('click', () => {
if(entries.length >= 6) {status.textContent = 'La prova contiene al massimo sei esempi. Ripristina per ricominciare.'; return;}
const d = {title:'',category:'Appunti',body:'',cover:'horizon'};
entries.push({id:++counter,published:null,draft:d}); select(counter,false); stage('edit'); title.focus();
status.textContent = 'Nuovo esempio. Scrivi il titolo e prova il contenuto nell’anteprima.';
});
const reset = announce => {
entries = clone(defaults).map(e => ({...e,draft:clone(e.published)})); counter = 2;
select(1,false); range.value = '100'; setView('card'); stage('list');
status.textContent = announce ? 'Prova ripristinata. Le modifiche temporanee sono state eliminate.' : 'Scegli un esempio o creane uno, modifica il contenuto e prova la simulazione. Nessun dato viene inviato.';
};
$('[data-app-reset]',app).addEventListener('click', () => reset(true));
form.hidden = false; $$('[data-js-tools]',app).forEach(el => el.hidden = false);
app.classList.add('app-ready'); $('.r-app-hint', app).hidden = false; reset(false); sizePreview();
});
safe('transizioni progressive', () => {
if (window.CiroMotion) return; // Use the same native dissolve on every page.

const assign = key => {
if(motion.matches) return;
const node = key === 'auto' ? $('.portal-auto .portal-result, .r-result-wide .r-image-open') : $('.portal-cerco .portal-result, .r-cei-identity .r-image-open');
if(node) node.style.viewTransitionName = 'project-preview';
};
$$('a[data-project-link]').forEach(a => a.addEventListener('click', () => {
if(a.pathname.includes('autolavaggio')) assign('auto'); else if(a.pathname.includes('cerco-e-informo')) assign('cei');
}));
addEventListener('pageshow', () => $$('[style*="view-transition-name"]').forEach(n => n.style.removeProperty('view-transition-name')));
});
})();

(() => {
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const feature = (name, fn) => {try {fn();} catch(e) {console.error(name,e);}};
feature('project focus', () => {
const board=$('.s-portals'), controls=$('[data-js-choice]');
if (!board || !controls) return;
const buttons=$$('[data-focus-project]',controls);
buttons.forEach(button=>button.addEventListener('click',()=>{
board.dataset.projectFocus=button.dataset.focusProject;
buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
controls.hidden=false;
});
feature('authentic comparison', () => {
const component=$('[data-comparison]'); if(!component) return;
const formats=$('[data-compare-formats]',component), panels=$$('[data-compare-panel]',component);
const formatButtons=$$('[data-compare-format]',formats);
const announce = document.createElement('span');announce.className='sr-only';announce.setAttribute('role','status');component.append(announce);
let activeFormat=matchMedia('(max-width:650px)').matches?'mobile':'desktop';
const setFormat = (format, user=false) => {
if(!panels.some(p=>p.dataset.comparePanel===format))return;
activeFormat=format;
panels.forEach(panel=>{panel.hidden=panel.dataset.comparePanel!==format;});
formatButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.compareFormat===format)));
if(user) announce.textContent='Confronto '+(format==='mobile'?'telefono: due catture a 390 × 844 pixel.':'computer: due catture a 1440 × 1000 pixel.');
};
panels.forEach(panel=>{
const stage=$('.s-compare-stage',panel), before=$('.s-before img',panel), after=$('.s-after img',panel);
const controls=$('.s-compare-controls',panel), input=$('input[type=range]',controls), output=$('[data-split-label]',controls), divider=$('[data-drag-divider]',panel);
let loaded=false, pointer=null;
const setSplit=value=>{
const n=Math.max(0,Math.min(100,Number(value)||0));
panel.classList.remove('is-paired');input.value=String(n);stage.style.setProperty('--split',n+'%');output.textContent=n+'% prima';
input.setAttribute('aria-valuetext',n+'% della versione precedente visibile');
$$('[data-compare-value]',controls).forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.compareValue)===n)));
};
const paired=()=>{panel.classList.add('is-paired');output.textContent='Muovi per sovrapporre';$$('[data-compare-value]',controls).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compareValue==='pair')));};
const fail=()=>{
panel.classList.remove('compare-ready');controls.hidden=true;loaded=false;
announce.textContent='Una delle catture non è disponibile. Restano i collegamenti alle immagini originali.';
};
const activate=()=>{
if(loaded||!before.complete||!after.complete||!before.naturalWidth||!after.naturalWidth)return;
const a=before.naturalWidth/before.naturalHeight,b=after.naturalWidth/after.naturalHeight;
if(Math.abs(a/b-1)>.005){announce.textContent='Formati diversi: le immagini vengono presentate affiancate, senza deformazioni.';return;}
loaded=true;stage.style.setProperty('--proof-ratio',`${before.naturalWidth} / ${before.naturalHeight}`);
panel.classList.add('compare-ready');controls.hidden=false; if(panel.dataset.comparePanel==='desktop')paired();else setSplit(0);
};
[before,after].forEach(image=>{image.draggable=false;image.addEventListener('load',activate);image.addEventListener('error',fail);});
input.addEventListener('input',()=>setSplit(input.value));
$$('[data-compare-value]',controls).forEach(button=>button.addEventListener('click',()=>button.dataset.compareValue==='pair'?paired():setSplit(button.dataset.compareValue)));

const move=event=>{const r=stage.getBoundingClientRect();if(r.width>0)setSplit(Math.round(100*(event.clientX-r.left)/r.width));};
divider.addEventListener('pointerdown',event=>{
if(!loaded||event.button!==0)return;event.preventDefault();pointer=event.pointerId;
divider.setPointerCapture(pointer);stage.classList.add('is-dragging');move(event);
});
divider.addEventListener('pointermove',event=>{if(pointer===event.pointerId)move(event);});
const end=event=>{if(pointer!==event.pointerId)return;pointer=null;stage.classList.remove('is-dragging');if(divider.hasPointerCapture(event.pointerId))divider.releasePointerCapture(event.pointerId);};
divider.addEventListener('pointerup',end);divider.addEventListener('pointercancel',end);divider.addEventListener('lostpointercapture',()=>{pointer=null;stage.classList.remove('is-dragging');});
const interrupt=()=>{if(pointer!==null)end({pointerId:pointer});};
addEventListener('blur',interrupt);addEventListener('pagehide',interrupt);document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
activate();
});
formatButtons.forEach(button=>button.addEventListener('click',()=>setFormat(button.dataset.compareFormat,true)));
const notes=$$('[data-inspect-text]',component), noteControls=$('.s-inspect-options',component), noteButtons=$$('[data-inspect]',noteControls);
const inspect=(name,user=false)=>{
component.dataset.inspectActive=name;
notes.forEach(note=>note.hidden=note.dataset.inspectText!==name);
noteButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.inspect===name)));
component.classList.toggle('has-inspection',user);
if(user){const note=notes.find(n=>!n.hidden);announce.textContent=note?note.textContent:'';}
};
noteButtons.forEach(button=>button.addEventListener('click',()=>inspect(button.dataset.inspect,true)));
component.classList.add('is-enhanced');formats.hidden=false;noteControls.hidden=false;setFormat(activeFormat);inspect('message');
});
feature('keyboard origin for anchors',()=>{

$$('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{
if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
const target=document.getElementById(a.hash.slice(1));
if(!target || a.closest('dialog'))return;
if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
requestAnimationFrame(()=>target.focus({preventScroll:true}));
}));
});
})();
