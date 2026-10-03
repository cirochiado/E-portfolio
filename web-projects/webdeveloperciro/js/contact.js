(() => {
  'use strict';
  const $ = (s, base = document) => base.querySelector(s);
  const $$ = (s, base = document) => [...base.querySelectorAll(s)];
  const root = document.documentElement;
  const small = matchMedia('(max-width:900px)');
  const feature = (name, init) => { try { init(); } catch (error) { console.error(`Contatti / ${name}:`, error); } };

  feature('punto di partenza', () => {
    const form = $('form[name="contatti"]'), service = $('#servizio'), site = $('#hai_gia_un_sito');
    const heading = $('#context-title'), copy = $('#context-copy'), message = $('#messaggio'), count = $('[data-message-count]');
    if (!form || !service || !heading || !copy) return;
    const prompts = new Map([
      ['', ['La tua richiesta, con parole tue.', 'Presenta brevemente la tua attività e l’obiettivo che vorresti raggiungere.']],
      ['Creazione nuovo sito', ['Il nuovo sito, in concreto.', 'Descrivi l’attività, il pubblico a cui ti rivolgi e le funzioni che immagini.']],
      ['Restyling sito', ['Una revisione dell’esistente.', 'Segnala le parti da rivedere e aggiungi l’indirizzo web nelle informazioni facoltative.']],
      ['Sito WordPress gestibile', ['Aggiornamenti in autonomia.', 'Indica i testi, le immagini o gli articoli da modificare e la frequenza degli aggiornamenti.']],
      ['Audit e accessibilità', ['Una difficoltà da verificare.', 'Descrivi dove incontri difficoltà: telefono, navigazione, lettura o altre funzioni.']],
      ['Altro / Non so ancora', ['Descrivi la tua esigenza.', 'Anche un dubbio o una difficoltà concreta possono aiutarmi a capire la richiesta.']]
    ]);
    const update = () => {
      const [title, text] = prompts.get(service.value) || prompts.get('');
      if (heading.textContent !== title) heading.textContent = title;
      let help = text;
      if (service.value === 'Restyling sito' && site?.value === 'Si') help = 'Segnala le parti da rivedere e inserisci l’indirizzo nel campo dedicato.';
      if (copy.textContent !== help) copy.textContent = help;
    };
    const updateCount = () => { if (message && count) { count.hidden = false; count.textContent = `${message.value.length.toLocaleString('it-IT')} / 2.000`; } };
    const resizeMessage = () => {
      if (!message) return;
      message.classList.add('is-auto-growing');
      message.style.height = 'auto';
      const styles = getComputedStyle(message);
      const minHeight = parseFloat(styles.minHeight) || 0;
      const borders = (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);
      message.style.height = `${Math.ceil(Math.max(minHeight, message.scrollHeight + borders))}px`;
    };
    const refreshMessage = () => { updateCount(); resizeMessage(); };
    service.addEventListener('change', update); site?.addEventListener('change', update);
    message?.addEventListener('input', refreshMessage);
    let resizeFrame = 0;
    addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resizeMessage);
    }, { passive: true });
    form.addEventListener('reset', () => setTimeout(() => { update(); refreshMessage(); }, 0));
    addEventListener('pageshow', () => { update(); refreshMessage(); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { update(); refreshMessage(); }, {once:true});
    else { update(); refreshMessage(); }
  });
})();
