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

  // Hero: Halftone-Punkteraster mit dezentem Scan-Impuls und Atmen
  const radar = document.querySelector('.hero__dots');
  if (radar && radar.getContext) initRadar(radar, reduce);

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

  function initRadar(canvas, reduceMotion) {
    const CFG = {
      gapDesktop: 14,
      gapMobile: 12,
      mobileBreak: 600,
      centerY: 0.46, // Ursprung des Scans = Schild
      rMin: 0.4,
      rGrow: 1.8,
      rExp: 1.6,
      aMin: 0.1,
      aGrow: 0.35,
      vignetteExp: 2.4, // seitliches Ausblenden
      textFade: 0.8, // Raster hinter dem Text um 80 % zurücknehmen (Lesbarkeit)
      alphaSteps: 48,
      pulseEvery: 4500,
      pulseDuration: 3000,
      band: 40,
      ringScale: 0.6,
      ringAlpha: 0.25,
      glowDecay: 450,
      breathPeriod: 6000,
      breathAmp: 0.08,
      baseInterval: 1000 / 15, // Atmen ändert sich langsam: Grundraster mit 15 fps
    };
    const TAU = Math.PI * 2;
    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');
    const hero = canvas.closest('.hero');
    if (!ctx || !baseCtx) return;

    let grid = null;
    let raf = 0;
    let last = 0;
    let lastBase = 0;
    let inView = true;

    const easeOut = (p) => 1 - Math.pow(1 - p, 3);

    // Ellipse um den Textblock: dort wird das Raster weich zurückgenommen
    const measureText = () => {
      const content = hero && hero.querySelector('.hero__content');
      if (!content) return () => 1;
      const c = canvas.getBoundingClientRect();
      const r = content.getBoundingClientRect();
      const ex = r.left - c.left + r.width / 2;
      const ey = r.top - c.top + r.height / 2;
      const rx = Math.max(r.width * 0.62, 1);
      const ry = Math.max(r.height * 0.68, 1);
      return (x, y) => {
        const t = Math.hypot((x - ex) / rx, (y - ey) / ry);
        const edge = Math.min(1, Math.max(0, (t - 0.55) / 0.45));
        return 1 - CFG.textFade * (1 - edge * edge * (3 - 2 * edge));
      };
    };

    // Halftone: Punkte wachsen nach unten, Alpha nach unten kräftiger, Ränder weich aus
    const build = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cx = w * 0.5;
      const cy = h * CFG.centerY;
      const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      const gap = w < CFG.mobileBreak ? CFG.gapMobile : CFG.gapDesktop;
      const textZone = measureText();
      const dots = [];
      for (let y = cy % gap; y < h; y += gap) {
        const ny = y / h;
        const r = CFG.rMin + CFG.rGrow * Math.pow(ny, CFG.rExp);
        const ay = CFG.aMin + CFG.aGrow * ny;
        for (let x = cx % gap; x < w; x += gap) {
          const v = (1 - Math.pow(Math.abs(x - cx) / cx, CFG.vignetteExp)) * textZone(x, y);
          if (v > 0.02) dots.push({ x, y, r, ay, v, d: Math.hypot(x - cx, y - cy) });
        }
      }
      // Nach Alpha gruppieren: ein Pfad pro Stufe statt tausender fill()-Aufrufe
      const buckets = new Map();
      dots.forEach((p, i) => {
        const step = Math.round(p.ay * p.v * CFG.alphaSteps);
        if (step <= 0) return;
        const list = buckets.get(step);
        if (list) list.push(i);
        else buckets.set(step, [i]);
      });
      const layers = [...buckets].map(([step, idx]) => ({ alpha: step / CFG.alphaSteps, idx }));
      return { w, h, dpr, maxR, dots, layers, glow: new Float32Array(dots.length) };
    };

    const sizeCanvas = (c, g) => {
      c.width = Math.round(g.w * g.dpr);
      c.height = Math.round(g.h * g.dpr);
    };

    const drawBase = (g, breath) => {
      baseCtx.setTransform(1, 0, 0, 1, 0, 0);
      baseCtx.clearRect(0, 0, base.width, base.height);
      baseCtx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      baseCtx.fillStyle = '#fff';
      g.layers.forEach((layer) => {
        baseCtx.globalAlpha = layer.alpha;
        baseCtx.beginPath();
        layer.idx.forEach((i) => {
          const p = g.dots[i];
          const r = p.r * breath;
          baseCtx.moveTo(p.x + r, p.y);
          baseCtx.arc(p.x, p.y, r, 0, TAU);
        });
        baseCtx.fill();
      });
      baseCtx.globalAlpha = 1;
    };

    const blitBase = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
    };

    const ringRadii = (t) => {
      const k = Math.floor(t / CFG.pulseEvery);
      return [k, k - 1]
        .map((n) => (t - n * CFG.pulseEvery) / CFG.pulseDuration)
        .filter((p) => p >= 0 && p < 1)
        .map((p) => easeOut(p) * grid.maxR);
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const g = grid;
      const dt = Math.min(now - (last || now), 50);
      last = now;
      const breath = 1 + CFG.breathAmp * Math.sin((TAU * now) / CFG.breathPeriod);
      if (now - lastBase >= CFG.baseInterval) {
        drawBase(g, breath);
        lastBase = now;
      }
      blitBase();

      // Scan-Ring: Punkte kurz größer und heller, ohne Farbwechsel
      const rings = ringRadii(now);
      const decay = Math.exp(-dt / CFG.glowDecay);
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < g.dots.length; i += 1) {
        const p = g.dots[i];
        let band = 0;
        for (let j = 0; j < rings.length; j += 1) {
          band = Math.max(band, 1 - Math.abs(p.d - rings[j]) / CFG.band);
        }
        g.glow[i] = Math.max(band, g.glow[i] * decay);
        const glow = g.glow[i];
        if (glow < 0.02) continue;
        ctx.globalAlpha = Math.min(1, (p.ay + CFG.ringAlpha * glow) * p.v);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * breath * (1 + CFG.ringScale * glow), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const start = () => {
      if (reduceMotion || raf || !grid || !inView || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };

    const render = () => {
      const next = build();
      if (!next) return;
      grid = next;
      sizeCanvas(canvas, grid);
      sizeCanvas(base, grid);
      drawBase(grid, 1);
      blitBase();
      start();
    };

    let resizeTimer = 0;
    let lastW = canvas.clientWidth;
    let lastH = canvas.clientHeight;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Mobile Adressleiste verändert die Höhe nur leicht: dann nicht neu bauen
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === lastW && Math.abs(h - lastH) < 80) return;
        lastW = w;
        lastH = h;
        stop();
        render();
      }, 150);
    });

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
})();
