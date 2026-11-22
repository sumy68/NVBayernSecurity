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

  // Hero-Radar: Punkteraster mit Scan-Impuls, Sweep und Kontrollpunkten
  const radar = document.querySelector('.hero__dots');
  if (radar && radar.getContext) initRadar(radar, reduce);

  // Jahr im Footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function initRadar(canvas, reduceMotion) {
    const CFG = {
      rgb: '46,177,240',
      baseAlpha: 0.16,
      peakAlpha: 0.85,
      gapDesktop: 22,
      gapMobile: 18,
      mobileBreak: 600,
      centerY: 0.46,
      pulseEvery: 4500,
      pulseDuration: 3000,
      band: 40,
      sweepPeriod: 9000,
      sweepWindow: (25 * Math.PI) / 180,
      sweepAlpha: 0.25,
      glowDecay: 450,
      checkDecay: 1200,
      checkMin: 6,
      checkMax: 8,
    };
    const TAU = Math.PI * 2;
    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');
    const hero = canvas.closest('.hero');
    if (!ctx || !baseCtx) return;

    let grid = null; // { w, h, dpr, cx, cy, maxR, dots, glow, checks }
    let raf = 0;
    let last = 0;
    let inView = true;

    const easeOut = (p) => 1 - Math.pow(1 - p, 3);

    const pickChecks = (dots, maxR) => {
      const pool = dots
        .map((d, i) => ({ i, d: d.d }))
        .filter((p) => p.d > 60 && p.d < maxR * 0.42);
      const count = CFG.checkMin + Math.floor(Math.random() * (CFG.checkMax - CFG.checkMin + 1));
      const chosen = [];
      while (chosen.length < count && pool.length) {
        chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].i);
      }
      return chosen.map((i) => ({ i, hit: -Infinity, ring: -1 }));
    };

    const build = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cx = w * 0.5;
      const cy = h * CFG.centerY;
      const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      const gap = w < CFG.mobileBreak ? CFG.gapMobile : CFG.gapDesktop;
      const dots = [];
      // Raster an der Mitte ausrichten, damit das Schild auf einem Punkt sitzt
      for (let y = cy % gap; y < h; y += gap) {
        for (let x = cx % gap; x < w; x += gap) {
          const dx = x - cx;
          const dy = y - cy;
          const d = Math.hypot(dx, dy);
          const v = Math.max(0, 1 - d / maxR);
          if (v > 0) dots.push({ x, y, d, a: (Math.atan2(dy, dx) + TAU) % TAU, v });
        }
      }
      return { w, h, dpr, cx, cy, maxR, dots, glow: new Float32Array(dots.length), checks: pickChecks(dots, maxR) };
    };

    const sizeCanvas = (c, g) => {
      c.width = Math.round(g.w * g.dpr);
      c.height = Math.round(g.h * g.dpr);
    };

    const dot = (c, x, y, r, alpha) => {
      c.globalAlpha = alpha;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    };

    // Statisches Grundraster einmal vorzeichnen
    const drawBase = (g) => {
      sizeCanvas(base, g);
      baseCtx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      baseCtx.fillStyle = `rgb(${CFG.rgb})`;
      g.dots.forEach((p) => dot(baseCtx, p.x, p.y, 1, CFG.baseAlpha * p.v));
      baseCtx.globalAlpha = 1;
    };

    const activeRings = (t) => {
      const k = Math.floor(t / CFG.pulseEvery);
      return [k, k - 1]
        .filter((n) => n >= 0)
        .map((n) => ({ n, p: (t - n * CFG.pulseEvery) / CFG.pulseDuration }))
        .filter((r) => r.p >= 0 && r.p < 1)
        .map((r) => ({ n: r.n, r: easeOut(r.p) * grid.maxR }));
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const g = grid;
      const dt = Math.min(now - (last || now), 50);
      last = now;
      const rings = activeRings(now);
      const sweep = ((now % CFG.sweepPeriod) / CFG.sweepPeriod) * TAU;
      const decay = Math.exp(-dt / CFG.glowDecay);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      ctx.fillStyle = `rgb(${CFG.rgb})`;

      for (let i = 0; i < g.dots.length; i += 1) {
        const p = g.dots[i];
        let band = 0;
        for (let j = 0; j < rings.length; j += 1) {
          band = Math.max(band, 1 - Math.abs(p.d - rings[j].r) / CFG.band);
        }
        g.glow[i] = Math.max(band, g.glow[i] * decay);
        const behind = (sweep - p.a + TAU) % TAU;
        const trail = behind < CFG.sweepWindow ? CFG.sweepAlpha * (1 - behind / CFG.sweepWindow) : 0;
        const glow = g.glow[i];
        if (glow < 0.01 && trail < 0.01) continue;
        const alpha = Math.min(1, CFG.baseAlpha + trail + glow * (CFG.peakAlpha - CFG.baseAlpha)) * p.v;
        dot(ctx, p.x, p.y, 1 + 0.8 * glow, alpha);
      }

      // Kontrollpunkte blinken, sobald der Ring sie erreicht
      g.checks.forEach((c) => {
        const p = g.dots[c.i];
        const reached = rings.find((r) => r.r >= p.d && r.n > c.ring);
        if (reached) {
          c.ring = reached.n;
          c.hit = now;
        }
        const f = 1 - (now - c.hit) / CFG.checkDecay;
        if (f > 0) dot(ctx, p.x, p.y, 1 + 1.5 * f * f, Math.max(CFG.baseAlpha, f * f));
      });
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
      drawBase(grid);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      start();
    };

    let resizeTimer = 0;
    let lastW = 0;
    let lastH = 0;
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

    lastW = canvas.clientWidth;
    lastH = canvas.clientHeight;
    render();
  }
})();
