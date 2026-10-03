(function () {
"use strict";
var motionPreference = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
var reduceMotion = !!(motionPreference && motionPreference.matches);
var motionListeners = [];
function onMotionChange(fn) { motionListeners.push(fn); }
function notifyMotionChange(event) {
reduceMotion = event.matches;
motionListeners.forEach(function (fn) { fn(reduceMotion); });
}
if (motionPreference && motionPreference.addEventListener) motionPreference.addEventListener("change", notifyMotionChange);
else if (motionPreference && motionPreference.addListener) motionPreference.addListener(notifyMotionChange);
function onReady(fn) {
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", fn);
} else {
fn();
}
}

onReady(function () {
var form = document.querySelector('form[name="contatti"]');
if (!form) return;
var formError = document.getElementById("form-error");
var captchaError = document.getElementById("captcha-error");
var submitBtn = form.querySelector('button[type="submit"]');
var service = document.getElementById("servizio");
var siteAnswer = document.getElementById("hai_gia_un_sito");
var siteURL = document.getElementById("sito_url");
var siteURLWrap = document.getElementById("sito-url-wrap");
var SERVICE_VALUES = {
"nuovo-sito": "Creazione nuovo sito",
"restyling": "Restyling sito",
"wordpress": "Sito WordPress gestibile",
"accessibilita": "Audit e accessibilità",
"altro": "Altro / Non so ancora"
};

if (service && !service.value && typeof URLSearchParams !== "undefined") {
var parameters = new URLSearchParams(window.location.search);
var choices = parameters.getAll("servizio");
var requested = choices.length === 1 ? choices[0] : "";
if (Object.prototype.hasOwnProperty.call(SERVICE_VALUES, requested)) {
service.value = SERVICE_VALUES[requested];
Array.prototype.forEach.call(service.options, function (option) { option.defaultSelected = option.value === service.value; });
var helper = document.getElementById("servizio-helper");
if (helper) helper.textContent = "Precompilato dal collegamento che hai seguito. Puoi cambiarlo o lasciare il campo vuoto.";
}
}
function updateWebsiteField() {
if (!siteAnswer || !siteURL || !siteURLWrap) return;
var show = siteAnswer.value === "Si";

if (!show && document.activeElement === siteURL) siteAnswer.focus({ preventScroll: true });
siteURLWrap.hidden = !show;
siteURL.disabled = !show;
if (!show) {
setFieldError("sito_url", "");
if (validateAll(false).count === 0) hideFormError(formError);
}
}
function normalizedSiteURL(value) {
if (!value) return "";
if (/\s/.test(value)) return null;
var candidate = value;
if (candidate.indexOf("//") === 0) candidate = "https:" + candidate;
else if (!/^https?:\/\//i.test(candidate)) {

if (/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^[^/:?#]+:\d+(?:[/?#]|$)/.test(candidate)) return null;
candidate = "https://" + candidate;
}
try {
var parsed = new URL(candidate);
if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
if (parsed.username || parsed.password || !parsed.hostname) return null;
if (parsed.hostname.indexOf(".") < 0 && parsed.hostname.charAt(0) !== "[") return null;
return parsed.href.length <= 2048 ? parsed.href : null;
} catch (error) { return null; }
}

var RULES = {
nome: function (v) {
if (!v) return "Scrivi il tuo nome.";

if (v.length > 80) return "Il nome supera gli 80 caratteri disponibili.";
return "";
},
attivita: function () { return ""; }, // facoltativo, nessuna lunghezza minima arbitraria
tipo: function () { return ""; },
servizio: function (v) {
if (!v) return "";
for (var key in SERVICE_VALUES) { if (SERVICE_VALUES[key] === v) return ""; }
return "Scegli uno dei servizi disponibili oppure lascia il campo vuoto.";
},
email: function (v, field) {
if (!v) return "Serve un'email per poterti rispondere.";
if (field.validity.typeMismatch) return "Controlla l'indirizzo email (es. nome@dominio.it).";
return "";
},
telefono: function (v) {
if (!v) return ""; // il telefono è facoltativo
if (!/^[+0-9()\s./-]+$/.test(v)) return "Usa cifre, spazi e i normali separatori del telefono.";
var cifre = v.replace(/\D/g, "");
if (cifre.length < 6) return "Il numero sembra incompleto.";
if (cifre.length > 15) return "Il numero sembra troppo lungo.";
return "";
},
hai_gia_un_sito: function (v) {
return !v || v === "Si" || v === "No" ? "" : "Scegli una delle risposte disponibili.";
},
sito_url: function (v) {
if (!v) return "";
return normalizedSiteURL(v) === null ? "Inserisci un indirizzo web valido, come www.esempio.it o https://esempio.it." : "";
},
messaggio: function (v) {
if (!v) return "Scrivi due righe su cosa ti serve.";
if (v.length < 20) return "Aggiungi qualche dettaglio in più (almeno 20 caratteri).";
return "";
},
privacy_read: function (v, field) {
if (!field.checked) return "Conferma di avere letto l'informativa privacy prima di inviare.";
return "";
}
};
var ERR_ID = {
nome: "err-nome", attivita: "err-attivita", tipo: "err-tipo", email: "err-email",
telefono: "err-telefono", hai_gia_un_sito: "err-sito", messaggio: "err-messaggio",
privacy_read: "err-privacy", servizio: "err-servizio", sito_url: "err-sito-url"
};
function fieldOf(id) { return document.getElementById(id); }
function setFieldError(id, message) {
var field = fieldOf(id);
var box = document.getElementById(ERR_ID[id]);
if (!field) return;
if (message) {
field.classList.add("is-invalid");
field.setAttribute("aria-invalid", "true");
if (box) { box.textContent = message; box.classList.add("is-shown"); }
} else {
field.classList.remove("is-invalid");
field.removeAttribute("aria-invalid");
if (box) { box.textContent = ""; box.classList.remove("is-shown"); }
}
}
function checkField(id) {
var field = fieldOf(id);
if (!field || field.disabled) return "";
var value = field.type === "checkbox" ? "" : (field.value || "").trim();
if (field.maxLength > 0 && value.length > field.maxLength) return "Hai superato il limite di " + field.maxLength + " caratteri.";
return RULES[id](value, field);
}
function validateAll(showErrors) {
var first = null;
var count = 0;
Array.prototype.forEach.call(form.elements, function (field) {
var id = field.id;
if (!Object.prototype.hasOwnProperty.call(RULES, id)) return;
var msg = checkField(id);
if (msg) { count++; if (!first) first = id; }
if (showErrors) setFieldError(id, msg);
});
return { first: first, count: count };
}
function showFormError(el, message) {
if (!el) return;
el.textContent = message;
el.style.display = "block";
}
function hideFormError(el) { if (el) el.style.display = "none"; }

for (var id in RULES) {
(function (fid) {
var field = fieldOf(fid);
if (!field) return;
var evt = (field.type === "checkbox" || field.tagName === "SELECT") ? "change" : "blur";
field.addEventListener(evt, function () {
if (field.type !== "checkbox" && field.tagName !== "SELECT" && field.required && !(field.value || "").trim() && !field.classList.contains("is-invalid")) return;
setFieldError(fid, checkField(fid));
});

field.addEventListener("input", function () {
if (field.classList.contains("is-invalid") && !checkField(fid)) {
setFieldError(fid, "");
if (validateAll(false).count === 0) hideFormError(formError);
}
});
field.addEventListener("change", function () {
if (field.classList.contains("is-invalid") && !checkField(fid)) {
setFieldError(fid, "");
if (validateAll(false).count === 0) hideFormError(formError);
}
});
})(id);
}
if (siteAnswer) siteAnswer.addEventListener("change", updateWebsiteField);
window.addEventListener("pageshow", updateWebsiteField);
form.addEventListener("reset", function () {
window.setTimeout(function () {
updateWebsiteField();
for (var key in RULES) setFieldError(key, "");
hideFormError(formError);
}, 0);
});
updateWebsiteField();
var sending = false;
var originalSubmitLabel = submitBtn ? submitBtn.textContent : "Invia richiesta";
var captchaArea = document.getElementById("captcha-area");
var captchaStatus = document.getElementById("captcha-status");
var captchaRetry = document.getElementById("captcha-retry");
var captchaStartedAt = Date.now();
var lastToken = "";
var staleToken = "";
var captchaIssue = "";
var captchaTimer = null;
var lastCaptchaState = "";
function captchaField() { return form.querySelector('[name="g-recaptcha-response"]'); }
function captchaToken() {
var field = captchaField();
return field ? field.value.trim() : "";
}
function inspectCaptcha() {
var token = captchaToken();
if (token && token !== staleToken) {
lastToken = token;
captchaIssue = "";
return "complete";
}
if (!token && lastToken) {
staleToken = lastToken;
lastToken = "";
captchaIssue = "expired";
}
if (captchaIssue) return captchaIssue;
if (captchaField()) return "incomplete";
return Date.now() - captchaStartedAt >= 15000 ? "unavailable" : "loading";
}
var captchaMessages = {
loading: "La verifica antispam si sta caricando. Attendi che compaia prima di inviare.",
unavailable: "La verifica antispam non è disponibile. Puoi ricontrollare oppure usare email o telefono indicati sotto.",
incomplete: "Completa la verifica antispam prima di inviare la richiesta.",
expired: "La verifica antispam è scaduta. Ripetila prima di inviare.",
complete: "Verifica completata. Puoi inviare la richiesta."
};
function refreshCaptcha() {
var state = inspectCaptcha();
if (state !== lastCaptchaState) {
if (captchaStatus) captchaStatus.textContent = captchaMessages[state];
if (captchaArea) captchaArea.setAttribute("data-captcha-state", state);
if (captchaRetry) captchaRetry.hidden = !(state === "expired" || state === "unavailable");
if (state === "complete") hideFormError(captchaError);
else if (captchaError && captchaError.style.display !== "none") showFormError(captchaError, captchaMessages[state]);
lastCaptchaState = state;
}
return state;
}

window.ccwebCaptchaSolved = function () {
staleToken = ""; captchaIssue = ""; refreshCaptcha();
};
window.ccwebCaptchaExpired = function () {
staleToken = captchaToken() || lastToken; lastToken = "";
captchaIssue = "expired"; refreshCaptcha();
};
window.ccwebCaptchaError = function () {
staleToken = captchaToken() || lastToken; lastToken = "";
captchaIssue = "unavailable"; refreshCaptcha();
};
if (captchaRetry) captchaRetry.addEventListener("click", function () {
if (window.grecaptcha && typeof window.grecaptcha.reset === "function") {
try {
window.grecaptcha.reset();
lastToken = ""; staleToken = ""; captchaIssue = "";
hideFormError(captchaError);
} catch (error) { captchaIssue = "unavailable"; }
}
lastCaptchaState = "";
refreshCaptcha();
if (captchaArea) captchaArea.focus({ preventScroll: true });
});
function stopCaptchaMonitor() {
if (captchaTimer !== null) window.clearInterval(captchaTimer);
captchaTimer = null;
}
function startCaptchaMonitor() {
stopCaptchaMonitor();
refreshCaptcha();
if (!document.hidden) captchaTimer = window.setInterval(refreshCaptcha, 1000);
}
document.addEventListener("visibilitychange", function () {
if (document.hidden) stopCaptchaMonitor(); else startCaptchaMonitor();
});
window.addEventListener("pagehide", stopCaptchaMonitor);
window.addEventListener("pageshow", function (event) {
sending = false;
form.removeAttribute("aria-busy");
if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalSubmitLabel; }
if (event.persisted) {

staleToken = captchaToken() || lastToken;
lastToken = "";
if (staleToken) captchaIssue = "expired";
}
startCaptchaMonitor();
});
startCaptchaMonitor();
form.addEventListener("submit", function (event) {
if (sending) { event.preventDefault(); return false; }
var res = validateAll(true);
if (res.count > 0) {
event.preventDefault();
event.stopPropagation();
if (event.stopImmediatePropagation) event.stopImmediatePropagation();
showFormError(formError, res.count === 1
? "C'è un campo da sistemare: te l'ho evidenziato qui sopra."
: "Ci sono " + res.count + " campi da sistemare: te li ho evidenziati qui sopra.");
var f = fieldOf(res.first);
if (f) {
if (window.CiroKeyboard) window.CiroKeyboard.focus(f);
else { f.focus(); f.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
}
return false;
}
hideFormError(formError);
if (navigator.onLine === false) {
event.preventDefault();
showFormError(formError, "La connessione sembra assente. I campi restano compilati: riprova quando sei online.");
if (formError) { if (window.CiroKeyboard) window.CiroKeyboard.focus(formError); else { formError.focus(); formError.scrollIntoView({ block: "center" }); } }
return false;
}

var captchaState = refreshCaptcha();
if (captchaState !== "complete") {
event.preventDefault();
event.stopPropagation();
if (event.stopImmediatePropagation) event.stopImmediatePropagation();
showFormError(captchaError, captchaMessages[captchaState]);
if (captchaArea) {
if (window.CiroKeyboard) window.CiroKeyboard.focus(captchaArea);
else { captchaArea.focus({ preventScroll: true }); captchaArea.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
}
return false;
}
hideFormError(captchaError);

form.querySelectorAll("input, textarea").forEach(function (el) {
if (el.type !== "checkbox" && el.type !== "hidden" && typeof el.value === "string") {
el.value = el.value.trim();
}
});
if (siteURL && !siteURL.disabled && siteURL.value) siteURL.value = normalizedSiteURL(siteURL.value) || siteURL.value;

sending = true;
form.setAttribute("aria-busy", "true");
if (submitBtn) {
submitBtn.disabled = true;
submitBtn.textContent = "Invio in corso...";
}
return true;
}, true);

form.noValidate = true;
});

onReady(function () {
var notice = document.getElementById("cookieNotice");
var accept = document.getElementById("cookieAccept");
if (!notice || !accept) return;
try {
if (localStorage.getItem("ccweb_cookie_notice_ok") === "1") {
notice.style.display = "none";
return;
}
} catch (e) {  }
function reserveNoticeSpace() {
var height = notice.getBoundingClientRect().height;
document.documentElement.style.setProperty("--cookie-notice-space", height ? Math.ceil(height + 24) + "px" : "0px");
}
notice.classList.add("is-visible");
reserveNoticeSpace();
if ("ResizeObserver" in window) new ResizeObserver(reserveNoticeSpace).observe(notice);
window.addEventListener("resize", reserveNoticeSpace, { passive: true });
var details = notice.querySelector("details");
if (details) details.addEventListener("toggle", reserveNoticeSpace);
accept.addEventListener("click", function () {
notice.classList.remove("is-visible");
notice.style.display = "none";
reserveNoticeSpace();
try { localStorage.setItem("ccweb_cookie_notice_ok", "1"); } catch (e) {}
});
});
})();
