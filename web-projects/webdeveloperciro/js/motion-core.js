(() => {
  'use strict';
  if (window.CiroMotion) return;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const small = matchMedia('(max-width: 900px)');
  const running = new Map(), locks = new Set();
  let suspended = document.hidden, headerManaged = false, observer = null;
  const keyboard = () => window.CiroKeyboard?.isKeyboard === true || root.classList.contains('kb-navigation');
  const allowed = () => !reduced.matches && !suspended && !document.hidden && !keyboard();
  const timing = Object.freeze({ quick: 140, state: 220, scene: 360, enter: 320 });
  const easing = 'cubic-bezier(.22,.72,.2,1)';
  const cancel = el => { const a = running.get(el); if (a) { running.delete(el); a.cancel(); } };
  const stop = () => { for (const a of running.values()) a.cancel(); running.clear(); };
  const enter = (el, kind = 'state') => {
    if (!(el instanceof HTMLElement) || !el.isConnected) return;
    cancel(el);
    if (!allowed() || !el.animate || !el.getClientRects().length || el.contains(document.activeElement)) return;
    if (running.size >= 2) return;
    const move = kind === 'enter' && fine.matches && innerWidth > 900;
    const frames = move ? [{ opacity: .72, translate: '0 8px' }, { opacity: 1, translate: '0 0' }]
      : [{ opacity: .78 }, { opacity: 1 }];
    try {
      const a = el.animate(frames, { duration: fine.matches ? (timing[kind] || timing.state) : timing.quick, easing, fill: 'none' });
      running.set(el, a);
      const done = () => { if (running.get(el) === a) running.delete(el); };
      a.finished.then(done, done);
    } catch (_) {  }
  };
  const setVar = (el, key, value) => { if (el.style.getPropertyValue(key) !== value) el.style.setProperty(key, value); };
  const syncLocks = () => {
    const locking = locks.size > 0;
    if (locking && !root.classList.contains('overlay-lock')) {
      root.classList.toggle('reserve-gutter', innerWidth - root.clientWidth > 0);
    }
    root.classList.toggle('overlay-lock', locking);
    if (!locking) root.classList.remove('reserve-gutter');
  };
  const lock = (name, value) => { if (value) locks.add(name); else locks.delete(name); syncLocks(); };
  const syncPolicy = () => {
    root.classList.toggle('motion-reduced', reduced.matches);
    root.classList.toggle('pointer-coarse', !fine.matches);
    root.classList.toggle('motion-suspended', suspended || document.hidden);
    if (!allowed()) stop();
  };
  window.CiroMotion = Object.freeze({
    get headerManaged() { return headerManaged; },
    get reduced() { return reduced.matches; },
    get allowed() { return allowed(); },
    get activeAnimations() { return running.size; },
    timing, easing, enter, cancel, stop,
    time: kind => fine.matches ? (timing[kind] || timing.state) : kind === 'scene' ? 220 : timing.quick,
    lock: (name, value) => lock(String(name), Boolean(value))
  });
  syncPolicy();

  let refreshHeader = () => {};
  const initHeader = () => {
    if (headerManaged) { refreshHeader(); return true; }
    const header = $('.site-header'), band = $('.header-band') || header;
    const toggle = $('.mobile-toggle'), menu = $('#menu-principale');
    if (!header || !band || !toggle || !menu) return;
    let chapters = $('.chapter-nav'), rail = $('.story-rail');
    let raf = 0, compact = header.classList.contains('is-compact'), open = false;
    const measure = () => {
      const sticky = ['sticky', 'fixed'].includes(getComputedStyle(header).position);
      const h = sticky ? Math.ceil(band.getBoundingClientRect().height) : 0;
      setVar(root, '--layout-width', header.getBoundingClientRect().width + 'px');
      setVar(root, '--header-visible', h + 'px');
      setVar(root, '--sticky-header-height', h + 'px');
      const ch = chapters && getComputedStyle(chapters).position === 'sticky' ? Math.ceil(chapters.getBoundingClientRect().height) : 0;
      setVar(root, '--chapter-height', ch + 'px');
      const rt = rail?.querySelector('.rail-toggle');
      const rh = rail && rt && small.matches && getComputedStyle(rail).position === 'sticky' ? Math.ceil(rt.getBoundingClientRect().height) : 0;
      setVar(root, '--rail-height', rh + 'px');
      setVar(root, '--visual-height', Math.round(window.visualViewport?.height || innerHeight) + 'px');
    };
    const update = () => {
      raf = 0;
      if (suspended || document.hidden) return;
      const y = Math.max(0, scrollY);
      if (!open) {
        if (!compact && y > 80) compact = true;
        else if (compact && y < 8) compact = false;
      }
      header.classList.toggle('is-compact', compact);
      const progress = Math.max(0, Math.min(1, y / Math.max(1, root.scrollHeight - innerHeight))).toFixed(4);
      setVar(root, '--reading-progress', progress);
      setVar(header, '--reading-progress', progress);
      setVar(header, '--header-progress', progress);
      measure();
    };
    const queue = () => { if (!raf && !suspended && !document.hidden) raf = requestAnimationFrame(update); };
    const closeRail = () => { const r = $('.story-rail.rail-open .rail-toggle'); if (r) r.click(); };
    const setOpen = value => {
      value = Boolean(value && small.matches);
      if (value) closeRail();
      const changed = value !== open;
      open = value;
      menu.classList.toggle('open', open);
      header.classList.toggle('menu-is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
      toggle.textContent = open ? '×' : '☰';
      $('#cookieNotice')?.classList.toggle('is-menu-hidden', open);
      lock('menu', open);
      if (!open) { menu.scrollTop = 0; cancel(menu); }
      else if (changed) enter(menu, 'quick');
      queue();
    };
    toggle.addEventListener('click', () => setOpen(!open));
    menu.addEventListener('click', e => { if (e.target.closest('a[href]')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && open && !e.defaultPrevented) {
        e.preventDefault();
        setOpen(false);
        toggle.focus({ preventScroll: true });
      }
    });
    document.addEventListener('pointerdown', e => {
      if (!open || header.contains(e.target)) return;
      const focusInside = menu.contains(document.activeElement);
      setOpen(false);
      if (focusInside) toggle.focus({ preventScroll: true });
    }, { passive: true });
    document.addEventListener('focusin', e => { if (open && !header.contains(e.target)) setOpen(false); });
    small.addEventListener('change', () => {
      const active = document.activeElement;
      setOpen(false);
      if (small.matches && menu.contains(active)) toggle.focus({ preventScroll: true });
      else if (!small.matches && active === toggle) (menu.querySelector('[aria-current="page"]') || menu.querySelector('a'))?.focus({ preventScroll: true });
      queue();
    });
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue, { passive: true });
    window.visualViewport?.addEventListener('resize', queue, { passive: true });
    document.addEventListener('toggle', queue, true);
    const sizes = 'ResizeObserver' in window ? new ResizeObserver(queue) : null;
    const observed = new WeakSet();
    refreshHeader = () => {
      chapters = $('.chapter-nav');
      rail = $('.story-rail');
      if (sizes) for (const el of [band, chapters, rail].filter(Boolean)) {
        if (!observed.has(el)) { observed.add(el); sizes.observe(el); }
      }
      queue();
    };
    refreshHeader();
    header.addEventListener('transitionend', queue);
    addEventListener('pagehide', () => { setOpen(false); cancelAnimationFrame(raf); raf = 0; });
    addEventListener('pageshow', () => { suspended = document.hidden; queue(); });
    document.addEventListener('visibilitychange', () => { suspended = document.hidden; queue(); });
    headerManaged = true;
    header.classList.add('nav-ready');
    setOpen(false);
    update();
    return true;
  };

  const initReveals = () => {
    if (root.hasAttribute('data-motion-visual') || !('IntersectionObserver' in window) || document.body.matches('.legal-page,.contact-page')) return;
    const selectors = ['.section-intro h2', '.access-title h2', '.detail-heading h2', '.r-chapter h2',
      '.services-page .chapter h2', '.method-page .m-heading h2', '.method-page .m-agreement-heading h2'];
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        enter(entry.target, 'enter');
      }
    }, { threshold: .12 });
    for (const el of $$(selectors.join(','))) {
      const r = el.getBoundingClientRect();
      if (r.top >= innerHeight && r.height > 0) observer.observe(el);
    }
    document.addEventListener('focusin', e => {
      for (const [el] of running) if (el.contains(e.target) || e.target.contains?.(el)) cancel(el);
    });
    addEventListener('beforeprint', () => { observer.disconnect(); stop(); });
  };

  const initDialogs = () => {
    for (const dialog of $$('dialog')) {
      let wasOpen = false;
      const update = () => {
        lock('dialog:' + (dialog.id || 'default'), dialog.open);
        if (dialog.open && !wasOpen) enter(dialog.querySelector('.gallery-content') || dialog, 'quick');
        if (!dialog.open) cancel(dialog);
        wasOpen = dialog.open;
      };
      new MutationObserver(update).observe(dialog, { attributes: true, attributeFilter: ['open'] });
      dialog.addEventListener('close', update);
      update();
    }
  };

  const initDisclosures = () => {
    document.addEventListener('toggle', event => {
      const el = event.target;
      if (!(el instanceof HTMLDetailsElement) || !el.open || el.closest('.legal-page,.contact-page,#cookieNotice,form,.site-footer')) return;
      const body = [...el.children].find(e => e.tagName !== 'SUMMARY');
      if (body) enter(body, 'state');
    }, true);
  };

  const initDirectControls = () => {
    const active = new Set();
    document.addEventListener('pointerdown', event => {
      const slider = event.target.closest?.('#layer-spread,#quaderno-larghezza');
      if (!slider) return;
      const box = slider.id === 'layer-spread' ? $('.site-object') : $('[data-editorial-screen]');
      if (box) { box.classList.add('is-manipulating'); active.add(box); }
    }, { passive: true });
    const release = () => {
      for (const el of active) el.classList.remove('is-manipulating');
      active.clear();
    };
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    addEventListener('blur', release);
    addEventListener('pagehide', release);
    document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
    document.addEventListener('click', event => {
      if (!event.target.closest?.('[data-editorial-view],[data-editorial-entry]')) return;
      queueMicrotask(() => enter($('[data-editorial-reader]'), 'quick'));
    });
  };

  let finished = false, parserObserver = null;
  root.classList.add('motion-ready');
  const primeHeader = () => {
    if (!$('main') || !initHeader()) return;
    parserObserver?.disconnect();
    parserObserver = null;
  };
  const init = () => {
    if (finished) return;
    finished = true;
    parserObserver?.disconnect();
    parserObserver = null;
    initHeader();
    refreshHeader();
    initDialogs();
    initReveals();
    initDisclosures();
    initDirectControls();
  };
  if (document.readyState === 'loading') {
    parserObserver = new MutationObserver(primeHeader);
    parserObserver.observe(root, { childList:true, subtree:true });
    primeHeader();
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else init();

  reduced.addEventListener('change', syncPolicy);
  fine.addEventListener('change', syncPolicy);
  document.addEventListener('visibilitychange', () => { suspended = document.hidden; syncPolicy(); });
  document.addEventListener('keydown', e => {
    if (['Tab','ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)) stop();
  }, true);
  addEventListener('pagehide', () => { suspended = true; stop(); locks.clear(); syncLocks(); syncPolicy(); });
  addEventListener('pageshow', () => { suspended = document.hidden; syncPolicy(); });
  addEventListener('beforeprint', stop);
  addEventListener('pageswap', event => { if (reduced.matches || keyboard()) event.viewTransition?.skipTransition(); });
  addEventListener('pagereveal', event => { if (reduced.matches) event.viewTransition?.skipTransition(); });
})();
