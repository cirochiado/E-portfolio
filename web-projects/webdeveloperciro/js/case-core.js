(() => {
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const small = matchMedia('(max-width: 900px)');
const feature = (name, initialize) => {
try { initialize(); } catch (error) { console.error(`Blocco 2 / ${name}:`, error); }
};
const animations = new Set();
const animateIn = element => {
if (window.CiroMotion) return window.CiroMotion.enter(element);
if (!element || reduce.matches || !element.animate) return;
const animation = element.animate(
[{ opacity: .5, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }],
{ duration: 420, easing: 'cubic-bezier(.2,.75,.2,1)' }
);
animations.add(animation);
animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
};
const cancelMotion = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
reduce.addEventListener?.('change', () => { if (reduce.matches) cancelMotion(); });
window.addEventListener('pagehide', cancelMotion);
let headerBottom = () => Math.max(0, $('.header-band')?.getBoundingClientRect().bottom || 0);

feature('capitoli del racconto', () => {
const rail = $('.story-rail');
if (!rail) return;
const toggle = $('.rail-toggle', rail), nav = $('nav', rail), current = $('[data-rail-current]', rail);
const links = $$('a[href^="#"]', nav);
const entries = links.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter(entry => entry.section);
let frame = 0;
const setOpen = open => {
rail.classList.toggle('rail-open', open);
toggle.setAttribute('aria-expanded', String(open));
$('span[aria-hidden]', toggle).textContent = open ? '−' : '＋';
};
toggle.addEventListener('click', () => setOpen(!rail.classList.contains('rail-open')));
links.forEach(link => link.addEventListener('click', () => setOpen(false)));
document.addEventListener('keydown', event => {
if (event.key === 'Escape' && rail.classList.contains('rail-open')) {
event.preventDefault(); setOpen(false); toggle.focus({ preventScroll: true });
}
});
document.addEventListener('pointerdown', event => {
if (rail.classList.contains('rail-open') && !rail.contains(event.target)) setOpen(false);
}, { passive: true });
document.addEventListener('focusin', event => {
if (rail.classList.contains('rail-open') && !rail.contains(event.target)) setOpen(false);
});
small.addEventListener?.('change', () => setOpen(false));
const update = () => {
frame = 0;
const cut = headerBottom() + (small.matches ? 80 : 50);
let active = entries[0];
entries.forEach(entry => { if (entry.section.getBoundingClientRect().top <= cut) active = entry; });
entries.forEach(entry => {
if (entry === active) entry.link.setAttribute('aria-current', 'location');
else entry.link.removeAttribute('aria-current');
});
const number = String(entries.indexOf(active) + 1).padStart(2, '0');
current.textContent = `${number} / ${active.section.dataset.chapter}`;
};
const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
document.addEventListener('toggle', schedule, true);
rail.classList.add('rail-ready');
setOpen(false); update();
});
feature('viste con schede', () => {
$$('[data-tabs]').forEach(component => {
const list = $('[data-tabs-list]', component);
const buttons = $$('button[data-target]', list);
const panels = buttons.map(button => document.getElementById(button.dataset.target));
if (!buttons.length || panels.some(panel => !panel || !component.contains(panel))) return;
const select = (index, animate = true) => {
buttons.forEach((button, i) => {
button.setAttribute('aria-selected', String(i === index));
button.tabIndex = i === index ? 0 : -1;
panels[i].hidden = i !== index;
});
if (animate) animateIn(panels[index]);
};
buttons.forEach((button, index) => {
button.setAttribute('role', 'tab');
button.setAttribute('aria-controls', panels[index].id);
panels[index].setAttribute('role', 'tabpanel');
panels[index].setAttribute('aria-labelledby', button.id);
panels[index].tabIndex = 0;
button.addEventListener('click', () => select(index));

button.addEventListener('keydown', event => {
let next;
if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
else if (event.key === 'Home') next = 0;
else if (event.key === 'End') next = buttons.length - 1;
else return;
event.preventDefault();
buttons.forEach((other, i) => { other.tabIndex = i === next ? 0 : -1; });
buttons[next].focus({ preventScroll: true });
});
});
list.setAttribute('role', 'tablist');
list.setAttribute('aria-orientation', 'horizontal');
select(0, false); component.classList.add('tabs-ready'); list.hidden = false;
});
});
feature('pagine e mappa', () => {
$$('[data-switch]').forEach((component, componentIndex) => {
const controls = $('[data-switch-controls]', component);
const buttons = $$('button[data-target]', controls);
const panels = buttons.map(button => document.getElementById(button.dataset.target));
if (!buttons.length || panels.some(panel => !panel || !component.contains(panel))) return;
const status = document.createElement('p');
status.className = 'sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true');
component.append(status);
const select = (index, announce = true) => {
buttons.forEach((button, i) => {
button.setAttribute('aria-pressed', String(i === index));
panels[i].hidden = i !== index;
});
if (announce) {
status.textContent = `Vista selezionata: ${buttons[index].textContent.replace(/\s+/g, ' ').replace(/[→0-9]/g, '').trim()}.`;
animateIn(panels[index]);
}
};
buttons.forEach((button, index) => {
if (!button.id) button.id = `page-switch-${componentIndex}-${index}`;
panels[index].setAttribute('role', 'region'); panels[index].setAttribute('aria-labelledby', button.id);
button.addEventListener('click', () => select(index));
});
select(0, false); controls.hidden = false;
});
});
feature('galleria', () => {
const dialog = $('#project-gallery'), image = $('#gallery-image');
const anchors = $$('a[data-gallery]');
if (!dialog || !image || typeof dialog.showModal !== 'function' || !anchors.length) return;
const items = [];
anchors.forEach(anchor => {
if (!items.some(item => item.url === anchor.getAttribute('href'))) {
const thumb = $('img', anchor);
items.push({ url: anchor.getAttribute('href'), title: anchor.dataset.title || thumb?.alt || 'Schermata del progetto',
caption: anchor.dataset.caption || '', width: thumb?.getAttribute('width') || 1906, height: thumb?.getAttribute('height') || 915 });
}
});
let index = 0, trigger = null, previousOverflow = '';
const errorMessage = $('.dialog-image-error', dialog);
const show = nextIndex => {
index = (nextIndex + items.length) % items.length;
const item = items[index];
$('#gallery-title').textContent = item.title;
$('#gallery-caption').textContent = item.caption;
$('#gallery-count').textContent = `${index + 1} / ${items.length}`;
$('#gallery-original').setAttribute('href', item.url);
image.hidden = false; errorMessage.hidden = true;
image.alt = item.title; image.width = Number(item.width); image.height = Number(item.height);
image.src = item.url;
$('[data-gallery-prev]', dialog).disabled = items.length < 2;
$('[data-gallery-next]', dialog).disabled = items.length < 2;
};
image.addEventListener('error', () => { image.hidden = true; errorMessage.hidden = false; });
image.addEventListener('load', () => { image.hidden = false; errorMessage.hidden = true; });
anchors.forEach(anchor => anchor.addEventListener('click', event => {
if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0) return;
const next = items.findIndex(item => item.url === anchor.getAttribute('href'));
if (next < 0) return;
show(next);
try { dialog.showModal(); } catch (_) { return; }
event.preventDefault(); trigger = anchor;
previousOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';
$('[data-close-gallery]', dialog).focus({ preventScroll: true });
}));
$('[data-close-gallery]', dialog).addEventListener('click', () => dialog.close());
$('[data-gallery-prev]', dialog).addEventListener('click', () => show(index - 1));
$('[data-gallery-next]', dialog).addEventListener('click', () => show(index + 1));
dialog.addEventListener('keydown', event => {
if (event.key === 'Tab') {
const focusable = $$('button:not([disabled]),a[href],[tabindex="0"]', dialog).filter(el => el.getClientRects().length > 0);
const first = focusable[0], last = focusable[focusable.length - 1];
if (first && event.shiftKey && document.activeElement === first) {
event.preventDefault(); last.focus();
} else if (last && !event.shiftKey && document.activeElement === last) {
event.preventDefault(); first.focus();
}
}
if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
});
dialog.addEventListener('click', event => {
if (event.target !== dialog) return;
const box = dialog.getBoundingClientRect();
if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
document.body.style.overflow = previousOverflow;
if (trigger?.isConnected) trigger.focus({ preventScroll: true });
});
});
feature('confronto reale', () => {
$$('[data-comparison]').forEach(component => {
const before = $('[data-before] img', component), after = $('[data-after] img', component);

if (component.dataset.beforeReady !== 'true' || !before?.getAttribute('src') || !after?.getAttribute('src')) return;
const controls = $('.compare-controls', component), slider = $('input[type="range"]', controls), output = $('[data-split-value]', controls);
let ready = false;
const activate = () => {
if (ready || !before.complete || !after.complete || !before.naturalWidth || !after.naturalWidth) return;
const beforeRatio = before.naturalWidth / before.naturalHeight, afterRatio = after.naturalWidth / after.naturalHeight;
if (Math.abs(beforeRatio / afterRatio - 1) > .025) {
$('.pending-note', component).textContent = 'Le schermate hanno proporzioni diverse. Occorre allineare formato e sezione prima di attivare il confronto.';
return;
}
ready = true;
const change = value => {
const clamped = Math.max(0, Math.min(100, Number(value) || 0));
slider.value = String(clamped); output.textContent = `${clamped}%`;
slider.setAttribute('aria-valuetext', `${clamped}% della versione precedente visibile`);
component.style.setProperty('--split', `${clamped}%`);
$$('[data-split]', controls).forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.split) === clamped)));
};
slider.addEventListener('input', () => change(slider.value));
$$('[data-split]', controls).forEach(button => button.addEventListener('click', () => change(button.dataset.split)));
component.style.setProperty('--compare-aspect', `${after.naturalWidth}/${after.naturalHeight}`);
component.classList.add('compare-ready'); controls.hidden = false;
$('.pending-note', component).hidden = true;
change(50);
};
before.addEventListener('load', activate); after.addEventListener('load', activate); activate();
});
});
feature('quaderno dimostrativo', () => {
const component = $('#quaderno-demo');
if (!component) return;
const title = $('#quaderno-titolo'), category = $('#quaderno-categoria'), text = $('#quaderno-testo');
const surface = $('.quaderno-surface', component), state = $('[data-article-state]', component), status = $('.quaderno-status', component);
const error = $('#quaderno-error'), deviceButtons = $$('[data-device-controls] button', component);
const defaults = { title: title.defaultValue, text: text.defaultValue, category: category.options[0].value };
let timer = 0;
const clearError = () => { error.hidden = true; error.textContent = ''; title.removeAttribute('aria-invalid'); };
const render = () => {
$('[data-preview-title]', component).textContent = title.value.trim() || 'Un nuovo articolo';
$('[data-preview-category]', component).textContent = category.value;
$('[data-preview-text]', component).textContent = text.value.trim() || 'Il testo dell’articolo apparirà qui.';
$('[data-title-count]', component).textContent = String(title.value.length);
state.textContent = 'Bozza della demo'; state.dataset.published = 'false';
};
const change = () => {
if (title.value.trim()) clearError();
render(); clearTimeout(timer);
timer = setTimeout(() => { status.textContent = 'Anteprima aggiornata. Le modifiche sono una bozza locale: niente è stato pubblicato o salvato.'; }, 700);
};
title.addEventListener('input', change); text.addEventListener('input', change); category.addEventListener('change', change);
title.setAttribute('aria-required', 'true');
$('[data-publish]', component).addEventListener('click', () => {
clearTimeout(timer);
if (!title.value.trim()) {
title.setAttribute('aria-invalid', 'true'); error.hidden = false; error.textContent = 'Scrivi un titolo per simulare la pubblicazione.';
status.textContent = 'Manca il titolo. La simulazione non è stata eseguita.';
title.focus(); return;
}
clearError(); render();
state.textContent = 'Pubblicato solo nella demo'; state.dataset.published = 'true';
status.textContent = 'La simulazione è completata: l’articolo è nell’anteprima. Nessun contenuto è stato inviato, salvato o pubblicato online.';
animateIn($('.article-card', component));
});
const setWidth = value => {
surface.dataset.width = value === 'phone' ? 'phone' : 'wide';
deviceButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.width === surface.dataset.width)));
};
deviceButtons.forEach(button => button.addEventListener('click', () => {
setWidth(button.dataset.width);
status.textContent = surface.dataset.width === 'phone'
? 'Anteprima stretta: gli stessi contenuti si adattano a meno spazio. Questa è una demo, non il sito reale incorporato.'
: 'Anteprima ampia: il contenuto rimane lo stesso.';
}));
$('[data-reset]', component).addEventListener('click', () => {
clearTimeout(timer); title.value = defaults.title; text.value = defaults.text; category.value = defaults.category;
clearError(); render(); setWidth('wide'); status.textContent = 'Esempio ripristinato. Tutti i dati della prova precedente sono stati rimossi dalla demo.';
});
$('[data-editor-controls]', component).hidden = false;
$('[data-device-controls]', component).hidden = false;
render(); setWidth('wide');
status.textContent = 'Modifica un campo: il contenuto cambia nell’anteprima. Poi prova a simulare la pubblicazione.';
window.addEventListener('pagehide', () => clearTimeout(timer));
});
feature('avviso tecnico', () => {
const notice = $('#cookieNotice'), accept = $('#cookieAccept');
if (!notice || !accept) return;
let dismissed = false;
try { dismissed = localStorage.getItem('ccweb_cookie_notice_ok') === '1'; } catch (_) {  }
const reserve = () => root.style.setProperty('--notice-space', notice.hidden ? '0px' : `${Math.ceil(notice.getBoundingClientRect().height + 32)}px`);
notice.hidden = dismissed;
accept.addEventListener('click', () => {
try { localStorage.setItem('ccweb_cookie_notice_ok', '1'); } catch (_) {  }
notice.hidden = true; reserve();
});
if ('ResizeObserver' in window) new ResizeObserver(reserve).observe(notice);
reserve();
});
feature('immagini e movimento', () => {
$$('img[src]').filter(image => !image.closest('dialog')).forEach(image => {
const fail = () => {
if (image.dataset.fallbackApplied) return;
image.dataset.fallbackApplied = 'true'; image.hidden = true;
const message = document.createElement('span');
message.className = 'asset-unavailable'; message.textContent = `Immagine non disponibile: ${image.alt || 'schermata del progetto'}.`;
image.insertAdjacentElement('afterend', message);
};
image.addEventListener('error', fail, { once: true });
if (image.complete && !image.naturalWidth) fail();
});
if (!window.CiroMotion && 'IntersectionObserver' in window && !reduce.matches) {
const observer = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (!entry.isIntersecting) return;
animateIn(entry.target); observer.unobserve(entry.target);
});
}, { threshold: .15 });
$$('.chapter-head,.project-one-head,.project-two-head,.cerco-cover').forEach(element => observer.observe(element));
}
});
})();
