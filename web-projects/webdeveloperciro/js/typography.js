(() => {
'use strict';
if (window.CiroTypography) return;
let resolveReady, settled = false, interacted = false, raf = 0, timeout = 0;
let previous = '', equalFrames = 0, samples = 0, result = null;
const ready = new Promise(resolve => { resolveReady = resolve; });
const noteInteraction = () => { interacted = true; };
document.addEventListener('pointerdown', noteInteraction, { capture: true, passive: true, once: true });
document.addEventListener('keydown', noteInteraction, { capture: true, once: true });
const rounded = n => Math.round(n * 64) / 64;
function signature() {
const values = [document.documentElement.clientWidth, window.innerWidth];
const selectors = ['.site-header', 'main h1', 'main h1 em', '.hero-intro', '.opening-lead', '.s-index-deck', '.r-case-aside', '.m-hero-copy > p', '.c-hero-bottom > p'];
for (const selector of selectors) {
const element = document.querySelector(selector);
if (!element || !element.getClientRects().length) continue;
const rect = element.getBoundingClientRect(), css = getComputedStyle(element);
values.push(selector, ...[rect.x, rect.y, rect.width, rect.height].map(rounded), css.fontFamily, css.fontSize, css.fontWeight, css.lineHeight, css.letterSpacing);

const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
let node, count = 0;
while ((node = walker.nextNode()) && count < 3) {
if (!node.textContent.trim() || node.parentElement.closest('svg,[aria-hidden="true"]')) continue;
const range = document.createRange(); range.selectNodeContents(node);
for (const glyphRect of range.getClientRects()) values.push(...[glyphRect.x, glyphRect.y, glyphRect.width, glyphRect.height].map(rounded));
count++;
}
}
return JSON.stringify(values);
}
function finish(stable, reason) {
if (settled) return;
settled = true; cancelAnimationFrame(raf); clearTimeout(timeout);
document.removeEventListener('visibilitychange', visible);
result = Object.freeze({ stable, reason, samples });
resolveReady(result);
}
function sample() {
if (settled) return;
if (document.hidden) { finish(false, 'hidden'); return; }
const fontsReady = !document.fonts || document.fonts.status === 'loaded';
const next = signature(); samples++;
equalFrames = fontsReady && previous === next ? equalFrames + 1 : 0;
previous = next;
if (equalFrames >= 2) { finish(true, 'stable-font-and-text-metrics'); return; }
raf = requestAnimationFrame(sample);
}
function visible() { if (document.hidden) finish(false, 'hidden'); }
function start() {
if (settled) return;

timeout = setTimeout(() => finish(false, 'timeout'), 1800);
document.addEventListener('visibilitychange', visible);
raf = requestAnimationFrame(sample);
}
window.CiroTypography = Object.freeze({
 ready,
get state() { return result; },
get interacted() { return interacted; }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
})();
