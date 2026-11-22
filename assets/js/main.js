/* NV Bayern Security – main.js */
(() => {
  const header = document.querySelector('.header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  // Header beim Scrollen verdichten
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile Navigation
  if (burger && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Einblenden beim Scrollen (gestaffelt)
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.querySelectorAll(':scope > .reveal')];
        entry.target.style.setProperty('--d', `${Math.min(siblings.indexOf(entry.target), 5) * 0.08}s`);
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('is-visible'));
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Überschriften Wort für Wort (Text bleibt für SEO identisch im DOM)
  document.querySelectorAll('.hero h1, .section__head h2').forEach((el) => {
    el.classList.add('split');
    const words = el.textContent.trim().split(' ');
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // Einsatzorte nacheinander
  document.querySelectorAll('.area__list li').forEach((li, i) => li.style.setProperty('--i', i));

  // Hero nach dem Laden starten
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

  // Lichtkegel auf Karten folgt der Maus
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  // Scroll-Fortschritt + leichte Parallaxe des Schild-Wasserzeichens
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const shield = document.querySelector('.hero__shield-wrap');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    if (shield && !reduce && window.scrollY < window.innerHeight * 1.2) {
      shield.style.transform = `translate3d(0, ${window.scrollY * 0.25}px, 0) scale(${1 + window.scrollY * 0.0002})`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  // Jahr im Footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
