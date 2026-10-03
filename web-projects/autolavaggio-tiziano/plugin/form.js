(() => {
  'use strict';
  const form = document.querySelector('[data-tzm-form]');
  const status = document.getElementById('tz-form-status');
  if (!form || !status) return;
  const ids = {nome:'tzf-nome', email:'tzf-email', telefono:'tzf-tel', tipo:'tzf-tipo', messaggio:'tzf-msg'};
  const labels = {nome:'Nome', email:'Email', telefono:'Telefono', tipo:'Tipo di richiesta', messaggio:'Messaggio'};
  const focusStatus = () => { status.focus(); status.scrollIntoView({block:'start', behavior:'auto'}); };
  if (status.hasAttribute('data-tzm-result')) focusStatus();
  status.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#tzf-"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target) { event.preventDefault(); target.focus(); }
  });
  const phone = document.getElementById('tzf-tel');
  function validatePhone() {
    const value = phone.value.trim(), count = value.replace(/\D/g, '').length;
    phone.setCustomValidity(value && (!/^\+?[0-9 ().\-]+$/.test(value) || count < 7 || count > 15)
      ? 'Inserisci da 7 a 15 cifre, con eventuale prefisso +, oppure lascia vuoto.' : '');
  }
  phone.addEventListener('input', validatePhone);
  function showResult(result) {
    status.replaceChildren();
    status.hidden = false;
    status.className = 'form-status ' + (result.ok ? 'form-status-ok' : 'form-status-error');
    status.setAttribute('role', result.ok ? 'status' : 'alert');
    const text = document.createElement('p');
    const strong = document.createElement('strong'); strong.textContent = result.text; text.appendChild(strong); status.appendChild(text);
    if (result.note) { const note=document.createElement('p'); note.className='tz-form-success-note'; note.textContent=result.note; status.appendChild(note); }
    const errors=result.errors || {};
    const list=document.createElement('ul');
    for (const [name,id] of Object.entries(ids)) {
      const input=document.getElementById(id), error=document.getElementById(id+'-error');
      error.textContent=errors[name] || ''; error.hidden=!errors[name];
      if (errors[name]) {
        input.setAttribute('aria-invalid','true');
        const li=document.createElement('li'), a=document.createElement('a'); a.href='#'+id;
        a.textContent=labels[name]+': '+errors[name]; li.appendChild(a); list.appendChild(li);
      } else input.removeAttribute('aria-invalid');
    }
    if(list.children.length) status.appendChild(list);
    focusStatus();
  }
  if (!window.fetch || !window.FormData) return;
  let busy = false;
  form.addEventListener('submit', async event => {
    validatePhone();
    if (!form.checkValidity()) { event.preventDefault(); form.reportValidity(); return; }
    event.preventDefault();
    if (busy) return;
    busy=true;
    const button=form.querySelector('[type="submit"]'), progress=document.getElementById('tz-form-progress');
    button.disabled=true; form.setAttribute('aria-busy','true'); progress.textContent='Invio della richiesta in corso.';
    const controller=window.AbortController ? new AbortController() : null;
    const timer=controller ? setTimeout(()=>controller.abort(),25000) : null;
    try {
      const response=await fetch(form.getAttribute('action').split('#')[0],{
        method:'POST',body:new FormData(form),credentials:'same-origin',headers:{Accept:'application/json'},
        ...(controller ? {signal:controller.signal} : {})
      });
      const result=await response.json();
      if(typeof result.ok!=='boolean' || typeof result.text!=='string') throw new Error('Invalid response');
      if(result.ok) form.reset();
      if(typeof result.token==='string') form.elements.tzm_token.value=result.token;
      if(typeof result.nonce==='string') form.elements.tz_contact_nonce.value=result.nonce;
      showResult(result);
    } catch (_) {
      showResult({ok:false,text:'Non è stato possibile verificare l’esito. I dati sono rimasti qui. Puoi riprovare: il codice della richiesta evita un doppio invio, oppure contattarci via email.'});
    } finally {
      if(timer) clearTimeout(timer); busy=false; button.disabled=false; form.removeAttribute('aria-busy'); progress.textContent='';
    }
  });
})();
