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

  // Überschriften Wort für Wort (Text bleibt für SEO identisch im DOM,
  // Auszeichnungen wie .hero__accent und geschützte Leerzeichen bleiben erhalten)
  const splitWords = (el) => {
    const words = [];
    let glue = false;
    [...el.childNodes].forEach((node) => {
      const text = node.textContent;
      const cls = node.nodeType === 1 ? node.className : '';
      text.split(' ').forEach((part, j) => {
        if (j > 0) glue = false;
        if (!part) return;
        if (glue && words.length) words[words.length - 1].push({ text: part, cls });
        else words.push([{ text: part, cls }]);
        glue = true;
      });
      glue = text.length > 0 && !text.endsWith(' ');
    });
    return words;
  };
  document.querySelectorAll('.hero h1, .section__head h2').forEach((el) => {
    el.classList.add('split');
    const words = splitWords(el);
    el.textContent = '';
    words.forEach((pieces, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.style.setProperty('--i', i);
      pieces.forEach((piece) => {
        if (!piece.cls) {
          inner.appendChild(document.createTextNode(piece.text));
          return;
        }
        const mark = document.createElement('span');
        mark.className = piece.cls;
        mark.textContent = piece.text;
        inner.appendChild(mark);
      });
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

  // Scroll-Fortschritt
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  // Hero: Halftone-Punkte von links und rechts, Mitte frei, ruhiger Scheinwerfer
  const dots = document.querySelector('.hero__dots');
  if (dots && dots.getContext) initHalftone(dots, reduce);

  // Hero: Tiefe durch Maus (Parallaxe) und Scroll (Text tritt zurück)
  const heroEl = document.querySelector('.hero');
  if (heroEl) initHeroDepth(heroEl, reduce);

  // Hero: Einsatzkarte kippt beim Scrollen in Position, Linien zeichnen sich
  const stage = document.querySelector('.hero__stage');
  if (stage) initDash(stage, reduce);

  // Bildstreifen „Im Einsatz": leichte Parallaxe im Rahmen (max. 40px, nur transform)
  const bandFrame = document.querySelector('.band__frame');
  if (bandFrame && !reduce) initBandParallax(bandFrame);

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

  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }
  function easeInOut(p) {
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
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
      // Scheinwerfer: weicher elliptischer Lichtkegel, gleitet diagonal hin und zurück
      light: { rx: 260, ry: 170, sizeGain: 0.35, alphaGain: 0.3, travel: 14000, pause: 2200, from: [0.08, 0.9], to: [0.92, 0.12] },
    };
    const TAU = Math.PI * 2;
    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');
    const hero = canvas.closest('.hero');
    if (!ctx || !baseCtx) return;

    let grid = null;
    let raf = 0;
    let t0 = 0;
    let elapsed = 0;
    let inView = true;

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
      return { w, h, gap, offset: cx % gap, dpr: Math.min(window.devicePixelRatio || 1, 2), rows };
    };

    const drawBase = (g) => {
      base.width = canvas.width = Math.round(g.w * g.dpr);
      base.height = canvas.height = Math.round(g.h * g.dpr);
      baseCtx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      baseCtx.fillStyle = '#fff';
      g.rows.forEach((row) => {
        row.groups.forEach((grp) => {
          baseCtx.globalAlpha = grp.alpha;
          baseCtx.beginPath();
          grp.xs.forEach((x, i) => {
            baseCtx.moveTo(x + grp.rs[i], row.y);
            baseCtx.arc(x, row.y, grp.rs[i], 0, TAU);
          });
          baseCtx.fill();
        });
      });
      baseCtx.globalAlpha = 1;
    };

    const blitBase = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
    };

    // Position des Lichtkegels: 14 s hin, Pause, 14 s zurück, Pause (ease-in-out)
    const lightProgress = (t) => {
      const { travel, pause } = CFG.light;
      const u = t % (2 * (travel + pause));
      if (u < travel) return easeInOut(u / travel);
      if (u < travel + pause) return 1;
      if (u < 2 * travel + pause) return 1 - easeInOut((u - travel - pause) / travel);
      return 0;
    };

    // Nur das Rechteck unter dem Lichtkegel neu zeichnen; Kanten liegen genau zwischen zwei Punkten
    const drawLight = (g, lx, ly) => {
      const L = CFG.light;
      const half = g.gap / 2;
      const rows = g.rows.filter((row) => Math.abs(row.y - ly) < L.ry);
      if (!rows.length) return;
      const left = g.offset + Math.floor((lx - L.rx - g.offset) / g.gap) * g.gap - half;
      const right = g.offset + Math.ceil((lx + L.rx - g.offset) / g.gap) * g.gap + half;
      const top = rows[0].y - half;
      const bottom = rows[rows.length - 1].y + half;
      ctx.clearRect(Math.round(left * g.dpr), Math.round(top * g.dpr), Math.round((right - left) * g.dpr), Math.round((bottom - top) * g.dpr));
      const buckets = new Map();
      rows.forEach((row) => {
        const dy = (row.y - ly) / L.ry;
        row.groups.forEach((grp) => {
          grp.xs.forEach((x, i) => {
            if (x <= left || x >= right) return;
            const dx = (x - lx) / L.rx;
            const t = dx * dx + dy * dy;
            const f = t < 1 ? (1 - t) * (1 - t) : 0; // weicher Rand ohne Kante
            const step = Math.round(Math.min(1, grp.alpha + L.alphaGain * f) * CFG.alphaSteps);
            const list = buckets.get(step) || [];
            list.push(x, row.y, grp.rs[i] * (1 + L.sizeGain * f));
            buckets.set(step, list);
          });
        });
      });
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      ctx.fillStyle = '#fff';
      buckets.forEach((list, step) => {
        ctx.globalAlpha = step / CFG.alphaSteps;
        ctx.beginPath();
        for (let i = 0; i < list.length; i += 3) {
          ctx.moveTo(list[i] + list[i + 2], list[i + 1]);
          ctx.arc(list[i], list[i + 1], list[i + 2], 0, TAU);
        }
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!t0) t0 = now - elapsed;
      elapsed = now - t0;
      const g = grid;
      const L = CFG.light;
      const p = lightProgress(elapsed);
      const lx = g.w * (L.from[0] + (L.to[0] - L.from[0]) * p);
      const ly = g.h * (L.from[1] + (L.to[1] - L.from[1]) * p);
      blitBase();
      drawLight(g, lx, ly);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      t0 = 0; // beim Fortsetzen an derselben Stelle weitergleiten
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

  // Maus-Parallaxe (nur Feinzeiger) und Scroll-Tiefe; alles weich per lerp interpoliert
  function initHeroDepth(hero, reduceMotion) {
    if (reduceMotion) return;
    const CFG = { lerp: 0.08, field: 12, shield: 6, title: 3, shieldScroll: 0.25, fadeSpan: 0.6, scaleTo: 0.96, opacityTo: 0.4, lift: 30 };
    const fine = window.matchMedia('(hover: hover)').matches;
    const content = hero.querySelector('.hero__content');
    const title = hero.querySelector('h1');
    const field = hero.querySelector('.hero__field');
    const shield = hero.querySelector('.hero__shield-wrap');
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    let lastScroll = -1;

    const tick = () => {
      raf = 0;
      cur.x += (target.x - cur.x) * CFG.lerp;
      cur.y += (target.y - cur.y) * CFG.lerp;
      const sy = window.scrollY;
      const heroH = hero.offsetHeight;
      if (sy < heroH) {
        if (field) field.style.transform = `translate3d(${(-cur.x * CFG.field).toFixed(2)}px, ${(-cur.y * CFG.field).toFixed(2)}px, 0)`;
        if (shield) shield.style.transform = `translate3d(${(-cur.x * CFG.shield).toFixed(2)}px, ${(sy * CFG.shieldScroll - cur.y * CFG.shield).toFixed(2)}px, 0) scale(${(1 + sy * 0.0002).toFixed(4)})`;
        if (fine && title) title.style.transform = `translate3d(${(cur.x * CFG.title).toFixed(2)}px, ${(cur.y * CFG.title).toFixed(2)}px, 0)`;
        if (fine && content) {
          // Text tritt zurück, gekoppelt an die ersten 60 % der Hero-Höhe
          const p = clamp01(sy / (heroH * CFG.fadeSpan));
          content.style.transform = p ? `translate3d(0, ${(-CFG.lift * p).toFixed(2)}px, 0) scale(${(1 - (1 - CFG.scaleTo) * p).toFixed(4)})` : '';
          content.style.opacity = p ? (1 - (1 - CFG.opacityTo) * p).toFixed(3) : '';
        }
      }
      const moving = Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001;
      if (moving || sy !== lastScroll) {
        lastScroll = sy;
        raf = requestAnimationFrame(tick);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    if (fine) {
      window.addEventListener('pointermove', (e) => {
        if (window.scrollY > hero.offsetHeight) return;
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
        kick();
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
        kick();
      });
    }
    window.addEventListener('scroll', kick, { passive: true });
    kick();
  }

  function initDash(stageEl, reduceMotion) {
    const dash = stageEl.querySelector('.dash');
    if (!dash) return;
    const root = document.documentElement;
    const TILT = { rotate: 18, shift: 24, perspective: 1400, endAt: 0.4, overlap: 0.4, introDone: 1300, hover: 4, lerp: 0.08, spring: 0.06, damping: 0.8 };

    // Karte ragt zu 40 % ihrer Höhe aus dem Hero; #leistungen rückt entsprechend ab
    const setOverlap = () => root.style.setProperty('--dash-overlap', `${Math.round(dash.offsetHeight * TILT.overlap)}px`);
    setOverlap();
    if ('ResizeObserver' in window) new ResizeObserver(setOverlap).observe(dash);
    else window.addEventListener('resize', setOverlap);

    if (reduceMotion) return;

    // Seidenlinien zeichnen sich einmalig, danach beginnt die ruhige Streifenfahrt
    if ('IntersectionObserver' in window) {
      dash.classList.add('is-armed');
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const wait = Math.max(0, TILT.introDone - performance.now());
        setTimeout(() => {
          dash.classList.add('is-drawn');
          initPatrol(dash);
        }, wait);
      }, { threshold: 0.3 });
      io.observe(dash);
    }

    // Zustand: Scroll-Kippen (k) + Hover-Neigung (rx/ry) + Lichtreflex (gx/gy)
    const glare = dash.querySelector('.dash__glare span');
    const state = { k: 1, rx: 0, ry: 0, vx: 0, vy: 0, gx: 0, gy: 0 };
    const target = { rx: 0, ry: 0, gx: 0, gy: 0 };
    let hovered = false;
    let end = 1;
    let raf = 0;

    const measure = () => {
      const top = stageEl.getBoundingClientRect().top + window.scrollY;
      end = top - window.innerHeight * TILT.endAt;
    };

    const render = () => {
      const k = state.k;
      const rotX = TILT.rotate * k + state.rx;
      const flat = k === 0 && Math.abs(state.rx) < 0.01 && Math.abs(state.ry) < 0.01;
      dash.classList.toggle('is-tilting', !flat);
      dash.style.transform = flat ? 'none' : `perspective(${TILT.perspective}px) rotateX(${rotX.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) translateY(${(TILT.shift * k).toFixed(2)}px)`;
      if (glare) glare.style.transform = `translate3d(${state.gx.toFixed(1)}px, ${state.gy.toFixed(1)}px, 0)`;
    };

    const tick = () => {
      raf = 0;
      state.k = end > 0 ? 1 - clamp01(window.scrollY / end) : 0;
      if (hovered) {
        // weich zur Maus hin
        state.rx += (target.rx - state.rx) * TILT.lerp;
        state.ry += (target.ry - state.ry) * TILT.lerp;
        state.vx = 0;
        state.vy = 0;
      } else {
        // Feder zurück in die Ruhelage
        state.vx = (state.vx + (target.rx - state.rx) * TILT.spring) * TILT.damping;
        state.vy = (state.vy + (target.ry - state.ry) * TILT.spring) * TILT.damping;
        state.rx += state.vx;
        state.ry += state.vy;
      }
      state.gx += (target.gx - state.gx) * TILT.lerp * 1.5;
      state.gy += (target.gy - state.gy) * TILT.lerp * 1.5;
      render();
      const settled = Math.abs(target.rx - state.rx) < 0.005 && Math.abs(target.ry - state.ry) < 0.005
        && Math.abs(state.vx) < 0.005 && Math.abs(state.vy) < 0.005
        && Math.abs(target.gx - state.gx) < 0.5 && Math.abs(target.gy - state.gy) < 0.5;
      if (!settled) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Hover-Neigung: die Karte wendet sich der Maus zu (max. 4°)
    if (window.matchMedia('(hover: hover)').matches) {
      dash.addEventListener('pointermove', (e) => {
        const r = dash.getBoundingClientRect();
        const x = clamp01((e.clientX - r.left) / r.width);
        const y = clamp01((e.clientY - r.top) / r.height);
        hovered = true;
        dash.classList.add('is-hovered');
        target.rx = (0.5 - y) * 2 * TILT.hover;
        target.ry = (x - 0.5) * 2 * TILT.hover;
        target.gx = e.clientX - r.left;
        target.gy = e.clientY - r.top;
        kick();
      });
      dash.addEventListener('pointerleave', () => {
        hovered = false;
        dash.classList.remove('is-hovered');
        target.rx = 0;
        target.ry = 0;
        kick();
      });
    }

    const remeasure = () => {
      measure();
      kick();
    };
    measure();
    tick();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
  }

  // Streifenfahrt: alle ~6 s gleitet ein feiner Lichtpunkt mit Schweif von Regensburg nach außen
  function initPatrol(dash) {
    const group = dash.querySelector('.dash__patrol');
    const lines = [...dash.querySelectorAll('.dash__line')];
    if (!group || !lines.length || !lines[0].getPointAtLength) return;
    const CFG = { every: 6000, duration: 2600, firstDelay: 1800, tail: 8, spacing: 3.2, headR: 2, headAlpha: 0.95, tailAlpha: 0.5 };
    const NS = 'http://www.w3.org/2000/svg';
    const dots = Array.from({ length: CFG.tail + 1 }, (_, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', String(i === 0 ? CFG.headR : Math.max(0.5, 1.7 - i * 0.14)));
      c.style.opacity = '0';
      group.appendChild(c);
      return c;
    });
    let run = null;
    let last = -1;
    let timer = 0;
    let visible = true;

    const hide = () => dots.forEach((c) => { c.style.opacity = '0'; });
    const schedule = (delay) => {
      clearTimeout(timer);
      timer = setTimeout(begin, delay);
    };
    const step = (now) => {
      if (!run) return;
      const p = clamp01((now - run.t0) / CFG.duration);
      const head = easeInOut(p) * run.len;
      const fade = Math.min(1, p / 0.15, (1 - p) / 0.25); // sanft ein- und ausblenden
      dots.forEach((c, i) => {
        const d = head - i * CFG.spacing;
        if (d < 0) {
          c.style.opacity = '0';
          return;
        }
        const pt = run.path.getPointAtLength(d);
        c.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        const a = i === 0 ? CFG.headAlpha : CFG.tailAlpha * (1 - i / (CFG.tail + 1));
        c.style.opacity = String(Math.max(0, fade * a));
      });
      if (p < 1) {
        requestAnimationFrame(step);
        return;
      }
      hide();
      run = null;
      schedule(CFG.every - CFG.duration);
    };
    function begin() {
      if (!visible || document.hidden) {
        schedule(1000);
        return;
      }
      let idx = Math.floor(Math.random() * lines.length);
      if (idx === last) idx = (idx + 1) % lines.length;
      last = idx;
      const path = lines[idx];
      run = { path, len: path.getTotalLength(), t0: performance.now() };
      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(dash);
    }
    schedule(CFG.firstDelay);
  }
  function initBandParallax(frame) {
    const img = frame.querySelector('.band__img');
    if (!img) return;
    const RANGE = 20; // ±20px = 40px Gesamtweg
    let inView = false;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = frame.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      const k = Math.max(-1, Math.min(1, p));
      img.style.setProperty('--py', `${(k * RANGE).toFixed(2)}px`);
    };
    const kick = () => { if (inView && !raf) raf = requestAnimationFrame(update); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; kick(); }, { rootMargin: '80px 0px' }).observe(frame);
    } else {
      inView = true;
    }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    update();
  }
})();
