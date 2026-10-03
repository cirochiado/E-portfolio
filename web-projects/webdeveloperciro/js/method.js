(() => {
  'use strict';
  const $ = (s, base = document) => base.querySelector(s);
  const $$ = (s, base = document) => [...base.querySelectorAll(s)];
  const root = document.documentElement;
  const small = matchMedia('(max-width:900px)');
  const feature = (name, init) => { try { init(); } catch (error) { console.error(`Metodo / ${name}:`, error); } };

  feature('traccia', () => {
    const route = $('.trace-route'), svg = $('.trace-svg'), path = $('.trace-spine');
    if (!route || !svg || !path) return;
    let queued = false;
    const draw = () => {
      queued = false;
      const r = route.getBoundingClientRect(); if (!r.width || !r.height) return;
      const points = $$('.trace-dot', route).map(dot => { const d = dot.getBoundingClientRect(); return { x: d.left + d.width / 2 - r.left, y: d.top + d.height / 2 - r.top }; });
      if (points.length < 2) return;
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const a = points[i-1], b = points[i];
        if (Math.abs(a.x-b.x) < 1) d += ` V ${b.y}`;
        else d += ` V ${b.y-24} Q ${a.x} ${b.y} ${a.x+Math.min(25,(b.x-a.x)/2)} ${b.y} H ${b.x}`;
      }
      path.setAttribute('d', d);
      const guide = $('.trace-ghost', route);
      guide.setAttribute('d', points.slice(0,4).map(p => `M ${p.x} ${points[0].y} V ${points.at(-1).y+16}`).join(' '));
    };
    const schedule = () => { if (!queued) { queued=true; requestAnimationFrame(draw); } };
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(route); else addEventListener('resize',schedule,{passive:true});
    document.fonts?.ready.then(schedule); schedule();
  });

  feature('richieste', () => {
    const box = $('.scope-machine'), form = $('[data-scope-form]'), result = $('[data-scope-result]');
    if (!box || !form || !result) return;
    const questions = ['La richiesta era già compresa negli accordi?', 'È necessaria alla pubblicazione prevista?'];
    const examples = ['“Possiamo cambiare una foto?”', '“Aggiungiamo le prenotazioni online?”', '“E una seconda lingua?”'];
    const outcomes = {
      included: { label: '01 / NEL PERIMETRO', title: 'Rientra negli accordi.', copy: 'La richiesta è già prevista: viene pianificata fra le attività concordate.' },
      review: { label: '02 / DA CONCORDARE', title: 'Richiede una valutazione.', copy: 'L’aggiunta amplia gli accordi. Occorre chiarire tempi, eventuali costi e modifiche necessarie.' },
      later: { label: '03 / UN’EVOLUZIONE POSSIBILE', title: 'Un’estensione futura.', copy: 'La pubblicazione prevista può proseguire. L’idea rimane annotata per una valutazione separata.' }
    };
    let step = 0, example = 0;
    const question = $('[data-scope-question]'); question.tabIndex = -1;
    $('[data-result-title]').tabIndex = -1;
    const reset = (focus = false) => {
      step = 0; box.dataset.scopeState = 'start'; result.hidden = true; form.hidden = false;
      question.textContent = questions[0]; $('[data-scope-step]').textContent = 'PRIMA DOMANDA';
      $$('[data-scope-exit]').forEach(el => el.classList.remove('is-active'));
      $('[data-scope-status]').textContent = '';
      if (focus) question.focus({ preventScroll: true });
    };
    const finish = key => {
      const o = outcomes[key]; if (!o) return;
      box.dataset.scopeState = key;
      $('[data-result-label]').textContent = o.label; $('[data-result-title]').textContent = o.title; $('[data-result-copy]').textContent = o.copy;
      form.hidden = true; result.hidden = false;
      $$('[data-scope-exit]').forEach(el => el.classList.toggle('is-active', el.dataset.scopeExit === key));
      $('[data-result-title]').focus({ preventScroll: true });
      $('[data-scope-status]').textContent = o.title + ' ' + o.copy;
    };
    form.addEventListener('submit', event => event.preventDefault());
    $$('[data-scope-answer]').forEach(button => button.addEventListener('click', () => {
      const yes = button.dataset.scopeAnswer === 'yes';
      if (step === 0 && yes) return finish('included');
      if (step === 0) {
        step = 1; box.dataset.scopeState = 'question'; question.textContent = questions[1];
        $('[data-scope-step]').textContent = 'SECONDA DOMANDA'; question.focus({ preventScroll: true }); return;
      }
      finish(yes ? 'review' : 'later');
    }));
    $('[data-scope-restart]').addEventListener('click', () => reset(true));
    $('[data-scope-another]').addEventListener('click', () => {
      example = (example + 1) % examples.length; $('[data-request-copy]').textContent = examples[example]; reset(false);
      $('[data-scope-status]').textContent = examples[example] + ' ' + questions[0];
    });
    $('[data-scope-another]').hidden = false; reset();
  });

  feature('pubblicazione', () => {
    const board = $('.release-demo'), fix = $('[data-release-fix]'), recheck = $('[data-release-recheck]'), approval = $('[data-release-approval]'), finish = $('[data-release-finish]');
    if (!board || !fix || !recheck || !approval || !finish) return;
    let repaired = false, done = false;
    const update = () => {
      const ready = repaired && recheck.checked && approval.checked;
      board.dataset.releaseStage = done ? 'done' : ready ? 'ready' : repaired ? 'recheck' : 'issue';
      $('[data-release-status]').textContent = done ? 'Esempio concluso' : ready ? 'Via libera nell’esempio' : repaired ? 'Da ricontrollare' : 'In revisione';
      recheck.disabled = !repaired || done; approval.disabled = done; fix.disabled = repaired || done; finish.disabled = !ready || done;
      fix.replaceChildren(document.createTextNode(repaired ? 'Correzione seguita' : 'Segui la correzione'));
      const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = repaired ? '✓' : '→'; fix.append(arrow);
      $('[data-release-recheck]+span small').textContent = repaired ? 'Nell’esempio, è il controllo dopo la correzione.' : 'Disponibile dopo aver seguito la correzione.';
      if (done) {
        $('[data-issue-label]').textContent = 'PASSAGGIO CONCLUSO NELL’ESEMPIO';
        $('[data-issue-title]').textContent = 'La messa online è concordata.';
        $('[data-issue-copy]').textContent = 'Correzione verificata e versione approvata. La simulazione arriva al via libera.';
        $('.issue-marker', board).textContent = '✓';
      } else if (repaired) {
        $('[data-issue-label]').textContent = 'VERIFICA DELLA CORREZIONE';
        $('[data-issue-title]').textContent = 'Il link corretto attende il ricontrollo.';
        $('[data-issue-copy]').textContent = 'Il ricontrollo conferma la correzione. L’approvazione del cliente conferma invece la versione da pubblicare.';
        $('.issue-marker', board).textContent = '↻';
      } else {
        $('[data-issue-label]').textContent = 'IL DIFETTO DA RISOLVERE';
        $('[data-issue-title]').textContent = 'Un link porta alla pagina sbagliata.';
        $('[data-issue-copy]').textContent = 'La messa online resta in attesa. Si corregge il collegamento e si verifica di nuovo.';
        $('.issue-marker', board).textContent = '!';
      }
      const active = done || ready ? 2 : repaired ? 1 : 0;
      $$('[data-release-dot]').forEach((el, i) => el.classList.toggle('current', i <= active));
      const missing = [];
      if (!repaired) missing.push('correzione');
      if (!recheck.checked) missing.push('ricontrollo');
      if (!approval.checked) missing.push('approvazione');
      $('[data-release-pending]').textContent = done ? 'Esempio concluso. Nessun sito è stato testato o pubblicato.' : ready ? 'Condizioni soddisfatte: la simulazione può essere conclusa.' : 'Da completare: ' + missing.join(', ') + '.';
    };
    fix.addEventListener('click', () => { repaired = true; update(); recheck.focus({ preventScroll: true }); });
    recheck.addEventListener('change', update); approval.addEventListener('change', update);
    finish.addEventListener('click', () => {
      if (!(repaired && recheck.checked && approval.checked)) return;
      done = true; update(); $('[data-release-reset]').focus({ preventScroll: true });
    });
    $('[data-release-reset]').addEventListener('click', () => { done = false; repaired = false; recheck.checked = false; approval.checked = false; update(); fix.focus({ preventScroll: true }); });
    $('[data-release-tools]').hidden = false; update();
  });

  feature('avviso tecnico', () => {
    const notice = $('#cookieNotice'), accept = $('#cookieAccept'); if (!notice || !accept) return;
    let dismissed = false; try { dismissed = localStorage.getItem('ccweb_cookie_notice_ok') === '1'; } catch (_) {  }
    const reserve = () => root.style.setProperty('--notice-space', !notice.hidden && getComputedStyle(notice).position === 'fixed' ? `${Math.ceil(notice.getBoundingClientRect().height + 32)}px` : '0px');
    notice.hidden = dismissed;
    if ('ResizeObserver' in window) new ResizeObserver(reserve).observe(notice);
    addEventListener('resize', reserve, { passive: true }); reserve();
    accept.addEventListener('click', () => {
      try { localStorage.setItem('ccweb_cookie_notice_ok', '1'); } catch (_) {  }
      notice.hidden = true; reserve();
    });
  });
})();
