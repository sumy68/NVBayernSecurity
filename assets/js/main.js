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

  // Hero: Halftone-Punkte von links und rechts, Mitte frei, langsame Welle
  const dots = document.querySelector('.hero__dots');
  if (dots && dots.getContext) initHalftone(dots, reduce);

  // Hero: Einsatzkarte kippt beim Scrollen in Position, Linien zeichnen sich
  const stage = document.querySelector('.hero__stage');
  if (stage) initDash(stage, reduce);

  // Kontaktformular: Prüfung + Versand per fetch (ohne JS normales POST)
  const contactForm = document.querySelector('.contact-form');
  if (contactForm && window.fetch && window.FormData) initContactForm(contactForm);

  // Jahr im Footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function initContactForm(form) {
    const MSG = {
      name: 'Bitte geben Sie Ihren Namen an.',
      email: 'Bitte geben Sie eine E-Mail-Adresse an.',
      emailInvalid: 'Bitte prüfen Sie die E-Mail-Adresse.',
      nachricht: 'Bitte schreiben Sie uns kurz, worum es geht.',
      datenschutz: 'Bitte stimmen Sie der Datenschutzerklärung zu.',
      sending: 'Wird gesendet …',
      success: 'Danke! Ihre Anfrage ist angekommen. Wir melden uns schnellstmöglich.',
      error: 'Das hat leider nicht geklappt. Bitte rufen Sie uns direkt an: <span class="nowrap"><a href="tel:+4917664806445">0176&nbsp;64806445</a></span>.',
    };
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const button = form.querySelector('.contact-form__submit');
    const status = form.querySelector('.contact-form__status');
    const buttonLabel = button.textContent;

    const setError = (input, message) => {
      const field = input.closest('.field');
      const err = field && field.querySelector('.field__error');
      if (field) field.classList.toggle('is-invalid', Boolean(message));
      if (err) err.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    const errorFor = (input) => {
      const value = input.type === 'checkbox' ? input.checked : input.value.trim();
      if (input.name === 'email') {
        if (!value) return MSG.email;
        return EMAIL_RE.test(value) ? '' : MSG.emailInvalid;
      }
      if (input.required && !value) return MSG[input.name] || 'Bitte ausfüllen.';
      return '';
    };

    const validate = () => {
      const fields = [...form.querySelectorAll('[required]')];
      const invalid = fields.filter((input) => {
        const message = errorFor(input);
        setError(input, message);
        return Boolean(message);
      });
      if (invalid.length) invalid[0].focus();
      return invalid.length === 0;
    };

    const showStatus = (type, html) => {
      status.classList.remove('is-shown', 'is-success', 'is-error');
      status.innerHTML = html; // nur feste, eigene Texte – keine Nutzereingaben
      if (type) status.classList.add(`is-${type}`);
      requestAnimationFrame(() => status.classList.add('is-shown'));
    };

    // Fehler beim Korrigieren direkt wieder entfernen
    form.addEventListener('input', (e) => {
      const input = e.target;
      if (input.closest('.field.is-invalid') && !errorFor(input)) setError(input, '');
    });
    form.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' && e.target.checked) setError(e.target, '');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;
      button.disabled = true;
      button.textContent = MSG.sending;
      status.classList.remove('is-shown');
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Formspree antwortete mit ${res.status}`);
        form.reset();
        showStatus('success', MSG.success);
      } catch (err) {
        console.warn('[Kontaktformular]', err);
        showStatus('error', MSG.error);
      } finally {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    });
  }

  function initHalftone(canvas, reduceMotion) {
    const CFG = {
      gap: 12,
      gapMobile: 10,
      mobileBreak: 600,
      hFree: 0.35, // innerhalb dieser Zone bleibt die Mitte frei
      hMinMobile: 0.55, // mobil erst weiter außen zeichnen
      exp: 1.3,
      rBase: 0.3,
      rGrow: 2.4,
      aBase: 0.15,
      aGrow: 0.75,
      sMin: 0.03,
      alphaSteps: 40,
      pulseEvery: 5000,
      pulseGain: 0.25,
      pulseSigma: 120 / 2.355, // Gauß-Kurve mit 120px Halbwertsbreite
    };
    const TAU = Math.PI * 2;
    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');
    const hero = canvas.closest('.hero');
    if (!ctx || !baseCtx) return;

    let grid = null;
    let raf = 0;
    let inView = true;

    const clamp01 = (n) => Math.min(1, Math.max(0, n));

    // Stärke s aus horizontalem Abstand zur Mitte (h) und Höhe (v)
    const strength = (h, v) => Math.pow(clamp01((h - CFG.hFree) / (1 - CFG.hFree)), CFG.exp) * (0.35 + 0.65 * v);

    // Punkte zeilenweise, je Zeile nach Alpha-Stufe gruppiert (ein Pfad pro Stufe)
    const build = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return null;
      const mobile = w < CFG.mobileBreak;
      const gap = mobile ? CFG.gapMobile : CFG.gap;
      const hCut = mobile ? CFG.hMinMobile : 0;
      const cx = w / 2;
      const rows = [];
      for (let y = gap / 2; y < h; y += gap) {
        const v = y / h;
        const groups = new Map();
        for (let x = cx % gap; x < w; x += gap) {
          const hd = Math.abs(x - cx) / cx;
          if (hd <= hCut) continue;
          const s = strength(hd, v);
          if (s < CFG.sMin) continue;
          const step = Math.round((CFG.aBase + CFG.aGrow * s) * CFG.alphaSteps);
          const group = groups.get(step) || { xs: [], rs: [] };
          group.xs.push(x);
          group.rs.push(CFG.rBase + CFG.rGrow * s);
          groups.set(step, group);
        }
        if (groups.size) {
          rows.push({ y, groups: [...groups].map(([step, g]) => ({ alpha: step / CFG.alphaSteps, xs: g.xs, rs: g.rs })) });
        }
      }
      return { w, h, gap, dpr: Math.min(window.devicePixelRatio || 1, 2), rows };
    };

    const drawRow = (c, row, scale) => {
      row.groups.forEach((g) => {
        c.globalAlpha = g.alpha;
        c.beginPath();
        for (let i = 0; i < g.xs.length; i += 1) {
          const r = g.rs[i] * scale;
          c.moveTo(g.xs[i] + r, row.y);
          c.arc(g.xs[i], row.y, r, 0, TAU);
        }
        c.fill();
      });
      c.globalAlpha = 1;
    };

    const drawBase = (g) => {
      base.width = canvas.width = Math.round(g.w * g.dpr);
      base.height = canvas.height = Math.round(g.h * g.dpr);
      baseCtx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      baseCtx.fillStyle = '#fff';
      g.rows.forEach((row) => drawRow(baseCtx, row, 1));
    };

    const blitBase = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
    };

    // Welle läuft alle 5 s von unten nach oben: nur die Zeilen im Band neu zeichnen
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const g = grid;
      const sigma = CFG.pulseSigma;
      const reach = sigma * 3;
      const p = (now % CFG.pulseEvery) / CFG.pulseEvery;
      const yWave = g.h + reach - p * (g.h + reach * 2);
      blitBase();
      const band = g.rows.filter((row) => Math.abs(row.y - yWave) < reach);
      if (!band.length) return;
      const top = band[0].y - g.gap / 2;
      const bottom = band[band.length - 1].y + g.gap / 2;
      ctx.clearRect(0, Math.floor(top * g.dpr), canvas.width, Math.ceil((bottom - top) * g.dpr));
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      ctx.fillStyle = '#fff';
      band.forEach((row) => {
        const d = (row.y - yWave) / sigma;
        drawRow(ctx, row, 1 + CFG.pulseGain * Math.exp(-0.5 * d * d));
      });
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (reduceMotion || raf || !grid || !inView || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };

    const render = () => {
      const next = build();
      if (!next) return;
      grid = next;
      drawBase(grid);
      blitBase(); // Reduced Motion: bleibt als statisches Bild stehen
      start();
    };

    // Hero-Höhe hängt an Inhalt und Karte (nicht am Viewport): nur bei echter Größenänderung neu bauen
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (grid && canvas.clientWidth === grid.w && canvas.clientHeight === grid.h) return;
        stop();
        render();
      }, 150);
    };
    if ('ResizeObserver' in window && hero) new ResizeObserver(onResize).observe(hero);
    else window.addEventListener('resize', onResize);

    if (!reduceMotion) {
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
      if ('IntersectionObserver' in window && hero) {
        new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          if (inView) start();
          else stop();
        }).observe(hero);
      }
    }

    render();
  }

  function initDash(stageEl, reduceMotion) {
    const dash = stageEl.querySelector('.dash');
    if (!dash) return;
    const root = document.documentElement;
    const TILT = { rotate: 18, shift: 40, opacity: 0.6, perspective: 1400, endAt: 0.4, overlap: 0.4, introDone: 1400 };

    // Karte ragt zu 40 % ihrer Höhe aus dem Hero; #leistungen rückt entsprechend ab
    const setOverlap = () => root.style.setProperty('--dash-overlap', `${Math.round(dash.offsetHeight * TILT.overlap)}px`);
    setOverlap();
    if ('ResizeObserver' in window) new ResizeObserver(setOverlap).observe(dash);
    else window.addEventListener('resize', setOverlap);

    // Seidenlinien zeichnen sich nacheinander, sobald die Karte sichtbar ist
    if (!reduceMotion && 'IntersectionObserver' in window) {
      dash.classList.add('is-armed');
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // erst zeichnen, wenn die Karte eingeblendet ist
        const wait = Math.max(0, TILT.introDone - performance.now());
        setTimeout(() => dash.classList.add('is-drawn'), wait);
      }, { threshold: 0.3 });
      io.observe(dash);
    }

    if (reduceMotion) return;

    // Kippen: scroll-gekoppelt, fertig wenn die Oberkante 40 % der Viewport-Höhe erreicht
    let end = 1;
    let lastP = -1;
    let ticking = false;
    const measure = () => {
      const top = stageEl.getBoundingClientRect().top + window.scrollY;
      end = top - window.innerHeight * TILT.endAt;
    };
    const apply = () => {
      ticking = false;
      const p = end > 0 ? Math.min(1, Math.max(0, window.scrollY / end)) : 1;
      if (p === lastP) return;
      lastP = p;
      const k = 1 - p;
      dash.classList.toggle('is-tilting', p < 1);
      dash.style.transform = p < 1 ? `perspective(${TILT.perspective}px) rotateX(${(TILT.rotate * k).toFixed(3)}deg) translateY(${(TILT.shift * k).toFixed(2)}px)` : 'none';
      dash.style.opacity = String(TILT.opacity + (1 - TILT.opacity) * p);
    };
    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    };
    const remeasure = () => {
      measure();
      lastP = -1;
      request();
    };
    measure();
    apply();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
  }
})();
