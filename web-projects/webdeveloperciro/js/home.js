(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const mobileTabs = matchMedia('(max-width: 900px)');
const feature = (name, init) => { try { init(); } catch (error) { console.error(`${name}:`, error); } };

feature('contenuti-in-autonomia', () => {
const root = $('#cms-demo'), input = $('#cms-title'), preview = $('#cms-preview');
if (!root || !input || !preview) return;
const title = $('#cms-preview-title'), status = $('#cms-status'), buttons = $$('[data-cms-layout]', root);
let announceTimer = 0;
input.addEventListener('input', () => {

title.textContent = input.value.trim() || 'Una nuova idea.';
clearTimeout(announceTimer);
announceTimer = setTimeout(() => { status.textContent = 'Titolo aggiornato nell’anteprima.'; }, 650);
});
buttons.forEach(button => button.addEventListener('click', () => {
const layout = button.dataset.cmsLayout;
preview.dataset.layout = layout;
buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
status.textContent = layout === 'compact' ? 'Composizione compatta attiva.' : 'Composizione in evidenza attiva.';
}));
$('[data-cms-controls]', root).hidden = false;
window.addEventListener('pagehide', () => clearTimeout(announceTimer));
});
feature('restyling', () => {
const root = $('#restyle-demo'), preview = $('#restyle-preview'), status = $('#restyle-status');
if (!root || !preview || !status) return;
const buttons = $$('[data-restyle-view]', root);
buttons.forEach(button => button.addEventListener('click', () => {
const view = button.dataset.restyleView;
preview.dataset.view = view;
buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
status.textContent = view === 'before'
? 'Prima: titolo, testo e collegamento hanno un peso visivo simile.'
: 'Dopo: titolo in evidenza, testo distanziato e collegamento riconoscibile.';
}));
$('[data-restyle-controls]', root).hidden = false;
});
feature('laboratorio', () => {
const lab = $('#laboratorio'), frame = $('#demo-browser'), scene = $('#demo-scene');
const tabs = $$('.lab-tabs [role="tab"]'), panels = $$('.lab-panel');
if (!lab || !frame || !tabs.length) return;
const action = $('#specimen-action'), feedback = $('#interaction-feedback'), toast = $('#demo-toast');
let mode = 'struttura', grid = false, layers = false, dark = false, count = 0, device = 'desktop', turn = false;
let toastTimer = 0;
const updateSize = () => { $('#viewport-size').textContent = String(Math.round($('#demo-viewport').clientWidth)); };
const orientation = () => $('.lab-tabs').setAttribute('aria-orientation', mobileTabs.matches ? 'horizontal' : 'vertical');
function selectMode(next, focus = false) {
mode = next;

tabs.forEach(tab => {
const selected = tab.id === `tab-${mode}`;
tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
if (selected && focus) tab.focus({preventScroll: true});
});
panels.forEach(panel => { panel.hidden = panel.id !== `panel-${mode}`; });
lab.dataset.mode = mode;
scene.classList.toggle('show-grid', mode === 'struttura' && grid);
scene.classList.toggle('is-exploded', mode === 'struttura' && layers);
action.disabled = mode !== 'interazioni';
frame.dataset.device = mode === 'responsive' ? device : 'desktop';
toast.hidden = true; clearTimeout(toastTimer); updateSize();
}
tabs.forEach((tab, index) => {
tab.addEventListener('click', () => selectMode(tab.id.slice(4)));
tab.addEventListener('keydown', event => {
const nextKey = mobileTabs.matches ? 'ArrowRight' : 'ArrowDown';
const prevKey = mobileTabs.matches ? 'ArrowLeft' : 'ArrowUp';
let target;
if (event.key === nextKey) target = (index + 1) % tabs.length;
if (event.key === prevKey) target = (index + tabs.length - 1) % tabs.length;
if (event.key === 'Home') target = 0;
if (event.key === 'End') target = tabs.length - 1;
if (target === undefined) return;
event.preventDefault(); selectMode(tabs[target].id.slice(4), true);
});
});
$('#grid-toggle').addEventListener('click', event => {
grid = !grid; event.currentTarget.setAttribute('aria-pressed', String(grid));
event.currentTarget.firstChild.textContent = grid ? 'Nascondi la griglia ' : 'Mostra la griglia ';
scene.classList.toggle('show-grid', mode === 'struttura' && grid);
});
$('#layers-toggle').addEventListener('click', event => {
layers = !layers; event.currentTarget.setAttribute('aria-pressed', String(layers));
event.currentTarget.firstChild.textContent = layers ? 'Ricomponi i livelli ' : 'Separa i livelli ';
scene.classList.toggle('is-exploded', mode === 'struttura' && layers);
});
$('#tone-toggle').addEventListener('click', event => {
dark = !dark; frame.dataset.tone = dark ? 'dark' : 'light';
event.currentTarget.setAttribute('aria-pressed', String(dark));
event.currentTarget.firstChild.textContent = dark ? 'Tema chiaro ' : 'Tema scuro ';
feedback.textContent = dark ? 'Tema scuro attivo. Il pulsante nell’anteprima è utilizzabile.' : 'Tema chiaro attivo.';
});
$('#rotate-toggle').addEventListener('click', event => {
turn = !turn; event.currentTarget.setAttribute('aria-pressed', String(turn));
event.currentTarget.firstChild.textContent = turn ? 'Ripristina la forma ' : 'Ruota la forma ';
$('#sculpture').dataset.turned = String(turn);
$('#sculpture').style.transform = turn ? 'rotateY(27deg) rotateZ(22deg)' : '';
feedback.textContent = turn ? 'Rotazione applicata alla geometria vettoriale.' : 'Orientamento iniziale ripristinato.';
});
action.addEventListener('click', () => {
count++; clearTimeout(toastTimer);
feedback.textContent = count === 1 ? 'Azione ricevuta: il pulsante e l’avviso si sono aggiornati.' : `Azioni ricevute: ${count}.`;
action.firstChild.textContent = count % 2 ? 'Azione ricevuta ' : 'Prova ancora ';
toast.hidden = false;
toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2800);
});
$$('.device-options button').forEach(button => button.addEventListener('click', () => {
device = button.dataset.device;
$$('.device-options button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
frame.dataset.device = device; updateSize();
}));
if ('ResizeObserver' in window) { new ResizeObserver(updateSize).observe($('#demo-viewport')); }
else window.addEventListener('resize', updateSize, {passive:true});
frame.addEventListener('transitionend', updateSize);
mobileTabs.addEventListener('change', orientation);
orientation(); $('[data-tabs]').hidden = false; $('[data-lab-controls]').hidden = false; selectMode(mode);
window.addEventListener('pagehide', () => clearTimeout(toastTimer));
});
feature('materia', () => {
const art = $('.specimen-art'), sculpture = $('#sculpture');
if (!art || !sculpture) return;
let raf = 0, x = 0, y = 0;
function reset() { sculpture.classList.remove('pointer-live'); cancelAnimationFrame(raf); raf = 0; sculpture.style.transform = sculpture.dataset.turned === 'true' ? 'rotateY(27deg) rotateZ(22deg)' : ''; }
art.addEventListener('pointermove', event => {
if (motion.matches || !fine.matches || event.pointerType !== 'mouse' || $('#laboratorio').dataset.mode !== 'interazioni') return;
const r = art.getBoundingClientRect(); x = (event.clientX-r.left)/r.width-.5; y=(event.clientY-r.top)/r.height-.5;
sculpture.classList.add('pointer-live');
if (raf) return;
raf = requestAnimationFrame(() => {raf=0; if(motion.matches || document.hidden)return;sculpture.style.transform=`rotateX(${-y*18}deg) rotateY(${x*26}deg) rotateZ(${-4+x*8}deg)`;});
}, {passive:true});
art.addEventListener('pointerleave', reset); motion.addEventListener('change', reset); fine.addEventListener('change', reset);
document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); }); window.addEventListener('blur', reset); window.addEventListener('pagehide', reset);
});
feature('tastiera', () => {
const input = $('#demo-name'), button = $('#demo-greet'), response = $('#demo-response');
const stage = $('.key-stage'), demo = $('.keyboard-demo');
const focusStep = $('#keyboard-step-focus'), actionStep = $('#keyboard-step-action');
if (!input || !button || !stage || !focusStep || !actionStep) return;
let usedTab = false, acted = false, pressTimer = 0;
const step = (element, done, text) => {
element.dataset.state = done ? 'done' : 'waiting';
$('small', element).textContent = text;
};
const press = className => {
clearTimeout(pressTimer);
stage.classList.remove('key-tab-active', 'key-enter-active');
if (motion.matches) return;
stage.classList.add(className);
pressTimer = setTimeout(() => stage.classList.remove('key-tab-active', 'key-enter-active'), 200);
};
input.addEventListener('focus', () => {
usedTab = false; acted = false;
stage.classList.remove('key-tab-done', 'key-enter-done');
step(focusStep, false, 'Premi Tab dal campo');
step(actionStep, false, 'Poi attiva il pulsante');
});
input.addEventListener('keydown', event => {
if (event.key === 'Tab' && !event.shiftKey) { usedTab = true; press('key-tab-active'); }
});
button.addEventListener('focus', () => {
stage.classList.add('key-tab-done');
step(focusStep, true, usedTab ? '✓ Raggiunto con Tab' : '✓ Focus raggiunto');
if (!acted) step(actionStep, false, 'Premi Invio o Spazio');
});
button.addEventListener('keydown', event => {
if (event.key === 'Enter' || event.key === ' ') press('key-enter-active');
if (event.key === 'Tab' && event.shiftKey) press('key-tab-active');
});
button.addEventListener('click', () => {
acted = true;
stage.classList.add('key-tab-done', 'key-enter-done');
step(focusStep, true, usedTab ? '✓ Raggiunto con Tab' : '✓ Controllo raggiunto');
step(actionStep, true, '✓ Azione completata');
press('key-enter-active');
const name = input.value.trim();
response.textContent = name
? `Ciao ${name}. Percorso completato: controllo raggiunto, azione attivata. Nessun dato inviato o salvato.`
: 'Percorso completato: controllo raggiunto, azione attivata. Nessun dato inviato o salvato.';
});
window.addEventListener('blur', () => stage.classList.remove('key-tab-active','key-enter-active'));
window.addEventListener('pagehide', () => clearTimeout(pressTimer));
button.disabled = false;
$('[data-keyboard-progress]', demo).hidden = false;
});
feature('dettagli', () => {
const buttons = $$('[data-principle]'), panels = $$('.principle-panel');
if (!buttons.length) return;
function show(index) {buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index))); panels.forEach((p,i)=>{p.hidden=i!==index;});}
buttons.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.principle))));
show(0);$('.principle-panels').classList.add('enhanced');$('[data-principle-controls]').hidden=false;
});
feature('capitoli', () => {
const links=$$('.chapter-nav a'), sections=links.map(a=>$(a.hash)).filter(Boolean);
if(!('IntersectionObserver' in window))return;
let raf=0;
const update=()=>{raf=0;let current=sections[0];for(const section of sections)if(section.getBoundingClientRect().top<=innerHeight*.3)current=section;
links.forEach(a=>{if(a.hash==='#'+current.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});};
const request=()=>{if(!raf)raf=requestAnimationFrame(update);};
window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request,{passive:true});update();
});
feature('avviso', () => {
const notice=$('#cookieNotice'), button=$('#cookieAccept');if(!notice||!button)return;
let saved=false;try{saved=localStorage.getItem('ccweb_cookie_notice_ok')==='1';}catch(_){}
notice.hidden=saved;
button.addEventListener('click',()=>{try{localStorage.setItem('ccweb_cookie_notice_ok','1');}catch(_){}notice.hidden=true;});
});
})();
