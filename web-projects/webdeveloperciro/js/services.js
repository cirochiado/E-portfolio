(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const small = matchMedia('(max-width: 900px)');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const feature = (name, init) => { try { init(); } catch (error) { console.error(`Servizi / ${name}:`, error); } };
const state = { route: 'nuovo-sito', needs: new Set(['richieste']) };
const routes = {
'nuovo-sito': { number: '01', title: 'Presentarti e ricevere contatti.', copy: 'Riuniamo descrizione dell’attività, servizi e canali di contatto.', label: 'Un sito da creare', anchor: '#progettare', action: 'Dalle esigenze alle funzioni', close: 'Definiamo\nil tuo sito.', invitation: 'Indicami l’obiettivo e le funzioni che ti interessano.' },
restyling: { number: '02', title: 'Una revisione mirata.', copy: 'Valutiamo contenuti, percorsi e interfaccia per individuare gli interventi.', label: 'Un sito da ripensare', anchor: '#ripensare', action: 'Guardiamo dentro il sito', close: 'Valutiamo\nil tuo sito.', invitation: 'Mandami l’indirizzo e descrivi cosa vorresti migliorare.' },
wordpress: { number: '03', title: 'Articoli e informazioni aggiornabili.', copy: 'La gestione si concentra sulle parti che aggiorni con maggiore frequenza.', label: 'Contenuti da gestire', anchor: '#gestire', action: 'Vediamo come funziona', close: 'Gestisci\nin autonomia.', invitation: 'Indicami i contenuti da aggiornare e la frequenza delle modifiche.' }
};
const needNames = { lavori: 'uno spazio per i lavori', richieste: 'un modulo di richiesta', articoli: 'un’area articoli', gestione: 'contenuti gestibili in autonomia' };
const needsSentence = () => {
const items = [...state.needs].map(k => needNames[k]);
return 'Presentazione, servizi e contatti' + (items.length ? '; ' + items.join(', ') : '') + '.';
};
const syncBrief = () => {
const r = routes[state.route];
$('[data-close-title]').textContent = r.close;
$('[data-close-title]').style.whiteSpace = 'pre-line';
$('[data-close-copy]').textContent = r.invitation;
$('[data-brief-route]').textContent = r.label;
$('[data-brief-needs]').textContent = needsSentence();
$('[data-contact-link]').href = `/contatti?servizio=${encodeURIComponent(state.route)}#modulo-contatti`;
};

feature('direzione', () => {
const group = $('.route-choices');
const compass = $('.compass');
const needle = $('.compass-needle', compass);
const angles = { 'nuovo-sito': 0, restyling: 125, wordpress: 238 };
let currentAngle = angles[state.route] ?? 0;
let animationFrame = 0;
const shortestDelta = (from, to) => ((((to - from) % 360) + 540) % 360) - 180;
const renderAngle = angle => {
currentAngle = angle;
needle.style.transform = `rotate(${angle}deg)`;
};
const settleAngle = angle => {
const canonical = ((angle % 360) + 360) % 360;
currentAngle = canonical;
needle.style.transform = `rotate(${canonical}deg)`;
};
const setNeedle = (value, immediate = false) => {
const target = angles[value];
if (typeof target !== 'number') return;
cancelAnimationFrame(animationFrame);
animationFrame = 0;
const destination = currentAngle + shortestDelta(currentAngle, target);
if (immediate || reduced.matches || (window.CiroMotion && !window.CiroMotion.allowed)) {
settleAngle(destination);
return;
}
const from = currentAngle;
const distance = destination - from;
const started = performance.now();
const duration = window.CiroVisual?.enabled ? 873 : (window.CiroMotion?.time('scene') || 360);
const tick = now => {
if (reduced.matches || (window.CiroMotion && !window.CiroMotion.allowed)) { animationFrame = 0; settleAngle(destination); return; }
const progress = Math.min(1, (now - started) / duration);
const eased = window.CiroVisual?.enabled ? window.CiroVisual.springProgress(progress) : 1 - Math.pow(1 - progress, 3);
renderAngle(from + distance * eased);
if (progress < 1) animationFrame = requestAnimationFrame(tick);
else {
animationFrame = 0;
settleAngle(destination);
}
};
animationFrame = requestAnimationFrame(tick);
};
const choose = (value, immediate = false) => {
if (!Object.prototype.hasOwnProperty.call(routes, value)) return;
state.route = value; const r = routes[value];
compass.dataset.route = value;
setNeedle(value, immediate);
$('[data-direction-number]').textContent = r.number;
$('[data-direction-title]').textContent = r.title;
$('[data-direction-copy]').textContent = r.copy;
const link = $('[data-direction-link]'); link.href = r.anchor;
link.replaceChildren(document.createTextNode(r.action + ' '));
const arrow = document.createElement('span'); arrow.textContent = '↘'; arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
syncBrief();
};
needle.style.transition = 'none';
group.addEventListener('change', event => choose(event.target.value));
reduced.addEventListener('change', () => choose(state.route, true));
const finishNeedle = () => { cancelAnimationFrame(animationFrame); animationFrame=0; settleAngle(angles[state.route]); };
addEventListener('pagehide',finishNeedle);
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishNeedle();});
group.disabled = false;
choose(state.route, true);
});
feature('struttura', () => {
const group = $('.needs'), board = $('.blueprint'), svg = $('.blueprint-lines');
let drawPending = false;
const draw = () => {
drawPending = false;
const box = board.getBoundingClientRect(), origin = $('[data-plan-node="home"]').getBoundingClientRect();
if (!box.width || !origin.width) return;
svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
svg.replaceChildren();
const x0 = origin.left + origin.width / 2 - box.left, y0 = origin.bottom - box.top;
$$('.plan-branches .plan-node:not([hidden])').forEach(node => {
const b = node.getBoundingClientRect(), x = b.left + b.width / 2 - box.left, y = b.top - box.top;
const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

const joint = y0 + 20;
path.setAttribute('d', `M ${x0} ${y0} V ${joint} H ${x} V ${y}`);
svg.append(path);
});
};
const scheduleDraw = () => { if (!drawPending) { drawPending = true; requestAnimationFrame(draw); } };
const update = () => {
state.needs = new Set($$('input:checked', group).map(input => input.value));
$('[data-plan-node="lavori"]').hidden = !state.needs.has('lavori');
$('[data-plan-node="articoli"]').hidden = !state.needs.has('articoli');
$('[data-plan-form]').hidden = !state.needs.has('richieste');
$('[data-plan-direct]').hidden = state.needs.has('richieste');
const manage = state.needs.has('gestione') || state.needs.has('articoli');
$('[data-plan-management]').hidden = !manage;
$('[data-plan-count]').textContent = `${3 + Number(state.needs.has('lavori')) + Number(state.needs.has('articoli'))} pagine` + (state.needs.has('richieste') ? ' + modulo' : '');
if (state.needs.has('articoli')) {
$('[data-plan-title]').textContent = 'Un archivio per le pubblicazioni.';
$('[data-plan-copy]').textContent = 'Gli articoli richiedono un archivio e un sistema di aggiornamento. Lo strumento adatto sarà valutato insieme.';
} else if (state.needs.has('gestione')) {
$('[data-plan-title]').textContent = 'Aggiornamenti gestibili dal pannello.';
$('[data-plan-copy]').textContent = 'Il pannello può riguardare soltanto i contenuti che modifichi. Strumento e manutenzione saranno concordati.';
} else {
$('[data-plan-title]').textContent = 'Presentazione e contatti.';
$('[data-plan-copy]').textContent = state.needs.has('richieste') ? 'Per questa combinazione può bastare una soluzione statica, con il modulo configurato e verificato separatamente.' : 'Per questa combinazione può bastare una soluzione statica; email e telefono restano i canali di contatto.';
}
syncBrief(); scheduleDraw();
};
group.addEventListener('change', update);
if ('ResizeObserver' in window) new ResizeObserver(scheduleDraw).observe(board);
else addEventListener('resize', scheduleDraw, { passive: true });
group.disabled = false; update();
});
feature('modello 3D', () => {
const stage = $('[data-model-stage]'), object = $('.site-object'), slider = $('#layer-spread'), flatButton = $('[data-flat]');
const supported = CSS.supports('transform-style', 'preserve-3d');
let angle = -27, flat = !supported || reduced.matches, dragging = false, startX = 0, startAngle = angle, pointerId = null;
const apply = () => {
const isFlat = flat || reduced.matches || !supported;
stage.classList.toggle('is-flat', isFlat);
object.style.setProperty('--layer-gap', `${Number(slider.value) * (innerWidth < 620 ? .68 : 1.1)}px`);
object.style.transform = `rotateX(53deg) rotateZ(${angle}deg)`;
$('#layer-value').textContent = `${slider.value}%`;
slider.disabled = isFlat;
$$('[data-rotate]').forEach(button => button.disabled = isFlat);
flatButton.disabled = reduced.matches || !supported;
flatButton.setAttribute('aria-pressed', String(isFlat));
flatButton.textContent = isFlat ? 'Torna alla prospettiva' : 'Vista frontale';
$('[data-view-indicator]').textContent = isFlat ? 'Livelli in vista frontale' : 'Vista in prospettiva';
$('[data-motion-note]').hidden = !reduced.matches;
};
slider.addEventListener('input', apply);
$$('[name=livello]').forEach(input => input.addEventListener('change', () => { stage.dataset.layer = input.value; }));
stage.dataset.layer = 'all';
$$('[data-rotate]').forEach(button => button.addEventListener('click', () => { angle = clamp(angle + Number(button.dataset.rotate), -65, 35); apply(); }));
flatButton.addEventListener('click', () => { flat = !flat; apply(); });
stage.addEventListener('pointerdown', event => {
if (flat || reduced.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
dragging = true; startX = event.clientX; startAngle = angle; pointerId = event.pointerId;
stage.classList.add('is-dragging'); stage.setPointerCapture(pointerId);
});
let dragFrame=0;
stage.addEventListener('pointermove', event => { if (!dragging) return; angle = clamp(startAngle + (event.clientX - startX) * .25, -65, 35); if(!dragFrame)dragFrame=requestAnimationFrame(()=>{dragFrame=0;if(dragging&&!document.hidden)apply();}); });
const release = () => { if(dragFrame){cancelAnimationFrame(dragFrame);dragFrame=0;apply();} dragging = false; stage.classList.remove('is-dragging'); if (pointerId !== null && stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId); pointerId = null; };
stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release); stage.addEventListener('lostpointercapture', release);
addEventListener('blur',release);addEventListener('pagehide',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
reduced.addEventListener('change', () => { release(); flat = reduced.matches || !supported; apply(); });
addEventListener('resize', apply, { passive: true });
stage.classList.add('model-live'); $('[data-model-controls]').hidden = false; apply();
});
feature('orari', () => {
const button = $('[data-update-hours]'), system = $('.hours-system'); let changed = false, timer;
button.addEventListener('click', () => {
changed = !changed;
const hours = changed ? '10:00 — 14:00' : '09:00 — 13:00';
$$('[data-hours]').forEach(node => node.textContent = hours);
button.replaceChildren(document.createTextNode(changed ? 'Ripristina l’orario iniziale ' : 'Posticipa di un’ora '));
const arrow = document.createElement('span'); arrow.textContent = changed ? '↶' : '↗'; arrow.setAttribute('aria-hidden', 'true'); button.append(arrow);
$('[data-hours-status]').textContent = `${changed ? 'Orario aggiornato' : 'Orario ripristinato'} nelle tre posizioni della simulazione locale.`;
clearTimeout(timer); system.classList.remove('did-update');
if (!reduced.matches) { void system.offsetWidth; system.classList.add('did-update'); timer = setTimeout(() => system.classList.remove('did-update'), 1050); }
});
button.hidden = false;
addEventListener('pagehide', () => clearTimeout(timer));
});
feature('condizioni d’uso', () => {
const group = $('.conditions'), bench = $('.stress-bench');
const update = () => {
const selected = new Set($$('input:checked', group).map(x => x.value));
bench.classList.toggle('is-large', selected.has('large'));
bench.classList.toggle('is-narrow', selected.has('narrow'));
bench.classList.toggle('is-quiet', selected.has('quiet') || reduced.matches);
const names = [];
if (selected.has('large')) names.push('testo al 200%');
if (selected.has('narrow')) names.push('spazio ridotto');
if (selected.has('quiet') || reduced.matches) names.push('movimento ridotto' + (reduced.matches ? ' (preferenza del dispositivo)' : ''));
$('[data-condition-note]').textContent = names.length ? 'Condizioni attive: ' + names.join(', ') + '. Nessuna informazione è stata tolta.' : 'Combina le condizioni e osserva l’adattamento.';
};
group.addEventListener('change', update); reduced.addEventListener('change', update);
group.disabled = false; update();
});
feature('riepilogo', () => {
const button = $('[data-save-brief]');
button.addEventListener('click', () => {
const text = ['LE ESIGENZE DEL MIO SITO', 'Webdeveloperciro — riepilogo orientativo', '', 'Situazione: ' + routes[state.route].label, 'Da considerare: ' + needsSentence(), '', 'Riepilogo orientativo, privo di valore di preventivo. Pagine e tecnologie saranno definite insieme.', 'Pagine, funzioni, materiali, revisioni, costi e manutenzione vengono concordati nel progetto.', '', 'Il riepilogo è conservato soltanto sul dispositivo.'].join('\r\n');
const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
const a = document.createElement('a'); a.href = url; a.download = 'il-mio-progetto-web.txt'; document.body.append(a); a.click(); a.remove();
setTimeout(() => URL.revokeObjectURL(url), 1500);
$('[data-download-status]').textContent = 'File di testo pronto sul dispositivo. Nessun invio online.';
});
button.hidden = false; syncBrief();
});
feature('avviso tecnico', () => {
const notice = $('#cookieNotice'), accept = $('#cookieAccept');
if (!notice || !accept) return;
let dismissed = false;
try { dismissed = localStorage.getItem('ccweb_cookie_notice_ok') === '1'; } catch (_) {  }
const reserve = () => root.style.setProperty('--notice-space', !notice.hidden && getComputedStyle(notice).position === 'fixed' ? `${Math.ceil(notice.getBoundingClientRect().height + 32)}px` : '0px');
notice.hidden = dismissed;
if ('ResizeObserver' in window) new ResizeObserver(reserve).observe(notice);
addEventListener('resize', reserve, { passive: true });
reserve();
accept.addEventListener('click', () => {
try { localStorage.setItem('ccweb_cookie_notice_ok', '1'); } catch (_) {  }
notice.hidden = true; reserve();
});
});
})();
