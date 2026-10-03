(() => {
const COOKIE_NAME = 'tiziano_cookie_consent';
const CONSENT_FORMAT = 1;
const MAX_AGE = 60 * 60 * 24 * 180; // 180 giorni
const readConsent = () => {
const prefix = `${COOKIE_NAME}=`;
const raw = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(prefix));
if (!raw) return null;
try {
const parsed = JSON.parse(decodeURIComponent(raw.slice(prefix.length)));
if (!parsed || parsed.format !== CONSENT_FORMAT) return null;
return {
necessary: true,
external: parsed.external === true,
format: CONSENT_FORMAT,
ts: parsed.ts || null
};
} catch (_) {
return null;
}
};
const writeConsent = (prefs) => {
const value = encodeURIComponent(JSON.stringify({
format: CONSENT_FORMAT,
necessary: true,
external: prefs.external === true,
ts: Date.now()
}));
const secure = location.protocol === 'https:' ? '; Secure' : '';
document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
};
const banner = document.getElementById('tiziano-cookie-banner');
const modal = document.getElementById('tiziano-cookie-modal');
const externalToggle = document.getElementById('tiziano-consent-external');
if (!banner || !modal || !externalToggle) return;
let consent = readConsent();
let lastFocus = null;
const placeholderMarkup = `
`;
const applyExternalContent = (allowed) => {
document.querySelectorAll('[data-tiziano-external]').forEach(container => {
const src = container.getAttribute('data-map-src');
if (!src) return;
if (allowed) {
if (container.querySelector('iframe')) return;
const iframe = document.createElement('iframe');
iframe.src = src;
iframe.loading = 'lazy';
iframe.title = 'Mappa Google Maps - Autolavaggio Tiziano';
iframe.referrerPolicy = 'no-referrer-when-downgrade';
iframe.setAttribute('allowfullscreen', '');
container.replaceChildren(iframe);
container.classList.add('is-loaded');
} else {
if (!container.querySelector('.map-consent-inner')) {
container.innerHTML = placeholderMarkup;
}
container.classList.remove('is-loaded');
}
});
};
const emitChange = () => {
document.dispatchEvent(new CustomEvent('tiziano:consent-change', {
detail: { consent: consent ? { ...consent } : null }
}));
};
const applyConsent = () => {
applyExternalContent(Boolean(consent && consent.external));
document.documentElement.dataset.tizianoConsent = consent ? 'set' : 'unset';
emitChange();
};

const panel = modal.querySelector('.tiziano-cookie-panel');
const isolated = new Map();
let backgroundObserver = null;
let originMap = null;
let previousPageFocus = null;
let pageFocusBeforeSettings = null;
const isAvailable = (element) => element instanceof HTMLElement && element.isConnected
&& !element.closest('[hidden], [inert], [aria-hidden="true"]')
&& getComputedStyle(element).visibility !== 'hidden'
&& element.getClientRects().length > 0;
const focusElement = (element, preventScroll = false) => {
if (!isAvailable(element)) return false;
element.focus({ preventScroll });
return document.activeElement === element;
};
const focusableInPanel = () => Array.from(panel.querySelectorAll(
'a[href], button, input, select, textarea, summary, [tabindex]'
)).filter(element => !element.disabled && element.tabIndex >= 0 && isAvailable(element));
const isolate = (element) => {
if (!(element instanceof HTMLElement) || element === modal || element.contains(modal)
|| /^(SCRIPT|STYLE|LINK)$/.test(element.tagName) || isolated.has(element)) return;
isolated.set(element, { inert: element.getAttribute('inert'), hidden: element.getAttribute('aria-hidden') });
element.setAttribute('inert', '');
element.setAttribute('aria-hidden', 'true');
};
const disableBackground = () => {

for (let node = modal; node && node.parentElement; node = node.parentElement) {
Array.from(node.parentElement.children).forEach(sibling => { if (sibling !== node) isolate(sibling); });
if (node.parentElement === document.body) break;
}
if ('MutationObserver' in window) {
backgroundObserver = new MutationObserver(records => records.forEach(record => {
record.addedNodes.forEach(node => isolate(node));
}));
backgroundObserver.observe(document.body, { childList: true });
}
};
const restoreBackground = () => {
if (backgroundObserver) { backgroundObserver.disconnect(); backgroundObserver = null; }
isolated.forEach((state, element) => {
if (state.inert === null) element.removeAttribute('inert');
else element.setAttribute('inert', state.inert);
if (state.hidden === null) element.removeAttribute('aria-hidden');
else element.setAttribute('aria-hidden', state.hidden);
});
isolated.clear();
};
const returnFocus = () => {
if (focusElement(lastFocus)) return;

if (originMap && originMap.isConnected) {
if (focusElement(originMap.querySelector('iframe'))) return;
if (focusElement(originMap.querySelector('.tiziano-cookie-open'))) return;
}

if (focusElement(pageFocusBeforeSettings, true)) return;
focusElement(document.getElementById('main-content'), true);
};
const hideBanner = () => { banner.hidden = true; };
const showBanner = () => { banner.hidden = false; };
const openSettings = (trigger) => {
if (!modal.hidden) return;
lastFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
originMap = lastFocus instanceof Element ? lastFocus.closest('[data-tiziano-external]') : null;
pageFocusBeforeSettings = previousPageFocus;
externalToggle.checked = Boolean(consent && consent.external);

window.scrollTo({ left: window.scrollX, top: window.scrollY, behavior: 'instant' });
hideBanner();
modal.hidden = false;
modal.setAttribute('aria-hidden', 'false');
document.body.classList.add('cookie-modal-open');
panel.scrollTop = 0;
focusElement(panel.querySelector('.tiziano-cookie-close'), true);

disableBackground();
};
const dismissSettings = () => {
restoreBackground();
document.body.classList.remove('cookie-modal-open');
modal.hidden = true;
modal.setAttribute('aria-hidden', 'true');
};
const closeSettings = () => {
if (modal.hidden) return;
dismissSettings();
if (!consent) showBanner();
returnFocus();
};
const save = (external) => {
const wasModal = !modal.hidden;
const fromBanner = banner.contains(document.activeElement);
consent = { necessary: true, external: external === true, format: CONSENT_FORMAT, ts: Date.now() };
writeConsent(consent);
hideBanner();
if (wasModal) dismissSettings();
applyConsent();
if (wasModal) returnFocus();
else if (fromBanner) {
if (!focusElement(previousPageFocus, true)) focusElement(document.getElementById('main-content'), true);
}
};
document.addEventListener('click', (event) => {
if (!(event.target instanceof Element)) return;
const openTrigger = event.target.closest('.tiziano-cookie-open');
if (openTrigger) { event.preventDefault(); openSettings(openTrigger); return; }
const actionEl = event.target.closest('[data-cookie-action]');
if (!actionEl) return;
const action = actionEl.getAttribute('data-cookie-action');
if (action === 'accept') save(true);
if (action === 'reject') save(false);
if (action === 'settings') openSettings(actionEl);
if (action === 'save') save(externalToggle.checked);
if (action === 'close-settings') closeSettings();
});
document.addEventListener('keydown', (event) => {
if (modal.hidden) return;
if (event.key === 'Escape') {
event.preventDefault();
event.stopPropagation();
closeSettings();
return;
}
if (event.key !== 'Tab') return;
const controls = focusableInPanel();
const first = controls[0], last = controls[controls.length - 1];
if (!first) {
event.preventDefault();
focusElement(document.getElementById('tiziano-cookie-settings-title'));
} else if (!panel.contains(document.activeElement)
|| (event.shiftKey && document.activeElement === first)
|| (!event.shiftKey && document.activeElement === last)) {
event.preventDefault();
focusElement(event.shiftKey ? last : first);
}
}, true);
document.addEventListener('focusin', (event) => {
if (!modal.hidden && !panel.contains(event.target)) {
focusElement(focusableInPanel()[0]);
} else if (modal.hidden && !banner.contains(event.target) && !modal.contains(event.target)) {
previousPageFocus = event.target;
}
}, true);
window.TizianoConsent = {
get: () => consent ? { ...consent } : null,
has: category => category === 'necessary' || Boolean(consent && consent[category] === true),
open: () => openSettings(document.activeElement),
onChange: callback => {
if (typeof callback !== 'function') return () => {};
const handler = event => callback(event.detail.consent);
document.addEventListener('tiziano:consent-change', handler);
return () => document.removeEventListener('tiziano:consent-change', handler);
}
};
applyConsent();
if (!consent) showBanner();
document.documentElement.classList.add('tiziano-consent-ready');
})();

(() => {
const elements = Array.from(document.querySelectorAll('.reveal'));
const journey = document.querySelector('.journey');
const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const running = new Set();
let observer;
elements.forEach(el => el.classList.add('visible'));
if (journey) journey.classList.add('in-view');
if ((reduce && reduce.matches) || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
try {
observer = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (!entry.isIntersecting) return;
observer.unobserve(entry.target);
if ((reduce && reduce.matches) || entry.target.contains(document.activeElement)) return;
try {
const animation = entry.target.animate([
{ opacity: 0, transform: 'translateY(16px)' },
{ opacity: 1, transform: 'translateY(0)' }
], { duration: 480, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'none' });
running.add(animation);
animation.onfinish = animation.oncancel = () => running.delete(animation);
} catch (_) {  }
});
}, { threshold: 0, rootMargin: '0px 0px 30px 0px' });
elements.forEach(el => {

if (el.getBoundingClientRect().top >= window.innerHeight) observer.observe(el);
});
document.addEventListener('focusin', event => {
for (const animation of running) {
if (animation.effect && animation.effect.target.contains(event.target)) animation.cancel();
}
});
if (reduce && reduce.addEventListener) reduce.addEventListener('change', event => {
if (!event.matches) return;
observer.disconnect();
for (const animation of running) animation.cancel();
});
} catch (_) {
if (observer) observer.disconnect();
for (const animation of running) animation.cancel();
}
})();

(function(){
var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
var records = Array.from(document.querySelectorAll('.hero-meta strong')).map(function(el){
var finalText = el.textContent.trim();
var match = finalText.match(/^(\d+)(.*)$/);
return { el:el, finalText:finalText, target:match ? parseInt(match[1],10) : null,
suffix:match ? match[2] : '', timer:null, frame:null };
});
if (!records.length) return;
function finish(record){
if (record.timer !== null) clearTimeout(record.timer);
if (record.frame !== null) cancelAnimationFrame(record.frame);
record.timer = record.frame = null;
if (record.el.textContent !== record.finalText) record.el.textContent = record.finalText;
}
function stopAll(){ records.forEach(finish); }
function animate(record){
if ((reduced && reduced.matches) || record.target === null) { finish(record); return; }
var start = null;
function tick(now){
if (reduced && reduced.matches) { finish(record); return; }
if (start === null) start = now;
var progress = Math.min((now - start) / 900, 1);
var eased = 1 - Math.pow(1 - progress, 3);
record.el.textContent = Math.round(record.target * eased) + record.suffix;
if (progress < 1) record.frame = requestAnimationFrame(tick);
else finish(record);
}
record.frame = requestAnimationFrame(tick);
}
function start(){
if (reduced && reduced.matches) { stopAll(); return; }
records.forEach(function(record,i){
record.timer = setTimeout(function(){ record.timer = null; animate(record); },250+i*130);
});
}
function changed(event){ if (event.matches) stopAll(); }
if (reduced) {
if (reduced.addEventListener) reduced.addEventListener('change', changed);
else if (reduced.addListener) reduced.addListener(changed);
}
if (document.readyState === 'complete') start();
else window.addEventListener('load', start, { once:true });
window.addEventListener('pagehide', stopAll);
})();

(function(){
var msg = document.getElementById('tzf-msg');
if(!msg) return;
function autoGrow(){
msg.style.height = 'auto';
msg.style.height = msg.scrollHeight + 'px';
}
msg.addEventListener('input', autoGrow);
autoGrow();
msg.classList.add('is-autogrow');
})();

(() => {
const header = document.querySelector('body > header');
const root = document.documentElement;
const skip = document.querySelector('.skip-link');
const main = document.getElementById('main-content');
const sticky = document.querySelector('.sticky-cta');
const banner = document.getElementById('tiziano-cookie-banner');
if (!header || !main) return;
const updateOffsets = () => {
const height = Math.ceil(header.getBoundingClientRect().height);
root.style.setProperty('--tiziano-header-height', height + 'px');
const footerHeight = sticky && sticky.getClientRects().length ? Math.ceil(sticky.getBoundingClientRect().height) : 0;
root.style.setProperty('--tiziano-bottom-clearance', (footerHeight + 16) + 'px');
};
updateOffsets();
if ('ResizeObserver' in window) {
const observer = new ResizeObserver(updateOffsets);
observer.observe(header);
if (sticky) observer.observe(sticky);
} else window.addEventListener('resize', updateOffsets, { passive:true });
if (skip) skip.addEventListener('click', (event) => {
event.preventDefault();
updateOffsets();
main.focus({ preventScroll:true });
main.scrollIntoView({ block:'start', behavior:'instant' });
});
const checkHash = () => {
if (!location.hash) return;
let id;
try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
const target = document.getElementById(id);
if (!target || !main.contains(target)) return;
const heading = target.matches('h1,h2,h3') ? target : target.querySelector('h1,h2,h3');
const visibleTop = (heading || target).getBoundingClientRect().top;

if (visibleTop >= 0 && visibleTop < header.getBoundingClientRect().bottom + 8) {
target.scrollIntoView({ block:'start', behavior:'instant' });
}
};
window.addEventListener('load', () => { updateOffsets(); checkHash(); }, { once:true });
window.addEventListener('hashchange', () => requestAnimationFrame(checkHash));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateOffsets);
document.addEventListener('focusin', event => {
const element = event.target;
if (!(element instanceof HTMLElement) || element === main || !main.contains(element)) return;

if (document.body.classList.contains('cookie-modal-open')) return;
try { if (!element.matches(':focus-visible')) return; } catch (_) {}
requestAnimationFrame(() => {
if (document.activeElement !== element) return;
const rect = element.getBoundingClientRect();
const top = header.getBoundingClientRect().bottom + 10;
let bottom = window.innerHeight - 10;
if (sticky && sticky.getClientRects().length) bottom = Math.min(bottom, sticky.getBoundingClientRect().top - 10);
if (banner && !banner.hidden && banner.getClientRects().length) bottom = Math.min(bottom, banner.getBoundingClientRect().top - 10);
if (bottom <= top + 40) return;
let delta = 0;
if (rect.top < top) delta = rect.top - top;
else if (rect.bottom > bottom) delta = Math.min(rect.bottom - bottom, rect.top - top);
if (delta) window.scrollBy({ top:delta, behavior:'instant' });
});
});
})();
