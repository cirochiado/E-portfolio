const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if (btn && nav) {
  const setMenuState = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  btn.addEventListener('click', () => {
    setMenuState(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 950px)').matches) {
        setMenuState(false);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenuState(false);
      btn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 950px)').matches) {
      setMenuState(false);
    }
  });
}

(function(){
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    document.body.classList.add('animations-ready');

    var targets = document.querySelectorAll(
      '.section .title, .lead, .info-card, .post-card, .newsletter-box, .cta-grid, .inner-card, .chi-section-card, .chi-value-card, .servizi-step, .service-flow-card, .archive-card, .site-footer'
    );

    targets.forEach(function(el, index){
      el.classList.add('reveal-on-scroll');
      el.style.transitionDelay = Math.min(index * 35, 260) + 'ms';
    });

    if(!('IntersectionObserver' in window)){
      targets.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function(el){ observer.observe(el); });
  });
})();

(function(){
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    var banner = document.querySelector('[data-cookie-banner]');
    var accept = document.querySelector('[data-cookie-accept]');
    if(!banner || !accept) return;

    try{
      if(localStorage.getItem('ci_cookie_notice_ok') === '1'){
        banner.classList.add('is-hidden');
        return;
      }
    }catch(e){}

    banner.classList.add('is-visible');

    accept.addEventListener('click', function(){
      try{
        localStorage.setItem('ci_cookie_notice_ok', '1');
      }catch(e){}
      banner.classList.remove('is-visible');
      banner.classList.add('is-hidden');
    });
  });
})();

(function(){
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    document.querySelectorAll('.newsletter-mailpoet-form form').forEach(function(form){
      var consent = form.querySelector('input[name="ci_newsletter_privacy_consent"]');
      var error = form.querySelector('[data-newsletter-consent-error]');
      if(!consent) return;

      var clearError = function(){
        consent.removeAttribute('aria-invalid');
        if(error) error.textContent = '';
      };

      consent.addEventListener('change', function(){
        if(consent.checked) clearError();
      });

      form.addEventListener('submit', function(event){
        if(consent.checked) {
          clearError();
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        consent.setAttribute('aria-invalid', 'true');
        if(error) error.textContent = 'Per iscriverti devi accettare la Privacy Policy e il consenso alla newsletter.';
        consent.focus();
      }, true);
    });
  });
})();
