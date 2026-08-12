/* =========================================================================
   Musikverein St. Michael Marbeck — Interaktion & Animation
   Vanilla JS, keine Abhängigkeiten. Respektiert prefers-reduced-motion.
   ========================================================================= */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ── Preloader ───────────────────────────────────────────────────────── */
  const preloader = $('#preloader');
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    document.documentElement.classList.add('is-ready');
    document.dispatchEvent(new CustomEvent('mv:ready'));
    if (!preloader) return;
    preloader.classList.add('is-done');
    setTimeout(() => preloader.classList.add('is-hidden'), 1400);
  };
  if (preloader) {
    const min = reduced ? 0 : 650;
    const t0 = performance.now();
    const go = () => setTimeout(start, Math.max(0, min - (performance.now() - t0)));
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
    // Sicherheitsnetz, falls ein Asset hängt
    setTimeout(start, 3500);
  } else {
    start();
  }

  /* ── Scroll-Fortschritt + Header-Verhalten ───────────────────────────── */
  const header = $('#siteHeader');
  const fill = $('#scrollbarFill');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (fill) fill.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      const menuOpen = document.body.classList.contains('is-locked');
      header.classList.toggle('is-hidden', !menuOpen && y > 420 && y > lastY + 4);
    }
    lastY = y;
    ticking = false;
  };
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener('scroll', requestScroll, { passive: true });
  onScroll();

  /* ── Mobiles Menü ────────────────────────────────────────────────────── */
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  if (burger && menu) {
    const setMenu = (open) => {
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    $$('.menu__link, .menu__foot a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ── Reveal beim Scrollen ────────────────────────────────────────────── */
  const revealTargets = $$('[data-reveal]');
  revealTargets.forEach(el => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty('--d', d + 'ms');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  // Erst starten, wenn der Vorhang aufgeht – sonst läuft die Hero-Staffelung
  // unsichtbar hinter dem Preloader ab.
  const observeReveals = () => revealTargets.forEach(el => io.observe(el));
  if (document.documentElement.classList.contains('is-ready')) observeReveals();
  else document.addEventListener('mv:ready', observeReveals, { once: true });

  /* ── Zähler ──────────────────────────────────────────────────────────── */
  const counters = $$('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        cio.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        if (reduced) { el.textContent = target + suffix; return; }
        const dur = 1500;
        const t0 = performance.now();
        const step = (now) => {
          const p = clamp((now - t0) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ── Ausbildungs-Schritte: Linie zeichnen ────────────────────────────── */
  const steps = $('#steps');
  if (steps) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        steps.classList.add('is-drawn');
        $$('.step', steps).forEach(s => s.classList.add('is-visible'));
        sio.disconnect();
      });
    }, { threshold: 0.25 });
    sio.observe(steps);
  }

  /* ── Parallax ────────────────────────────────────────────────────────── */
  const parallaxEls = $$('[data-parallax]');
  if (parallaxEls.length && !reduced && window.innerWidth > 720) {
    let raf = null;

    // Ausgangslage ohne Transform messen. Sonst rechnet jeder Frame auf der
    // bereits verschobenen Position weiter und der Versatz schaukelt sich auf.
    const measure = (el) => {
      const prev = el.style.transform;
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      el.style.transform = prev;
      return { top: rect.top + window.scrollY, height: rect.height };
    };
    let bases = parallaxEls.map(measure);

    const update = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      parallaxEls.forEach((el, i) => {
        const base = bases[i];
        const top = base.top - y;
        if (top + base.height < -200 || top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        // Der Weg darf nie größer sein als der Überstand des Bildes, sonst
        // entsteht am Rand eine Lücke bzw. ungefiltertes Foto.
        const max = parseFloat(el.dataset.parallaxMax) || 40;
        const raw = (top + base.height / 2 - vh / 2) * speed;
        const offset = clamp(raw, -max, max);
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
      raf = null;
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', () => { bases = parallaxEls.map(measure); req(); });
    update();
  }

  /* ── Termine: Akkordeon, Vergangenheit, Filter ───────────────────────── */
  const events = $$('.event');
  const now = new Date();

  events.forEach(ev => {
    const dateStr = ev.dataset.date;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d) && d.getTime() < now.getTime() - 6 * 3600 * 1000) ev.classList.add('event--past');
      else ev.classList.add('event--upcoming');
    }
    const head = $('.event__head', ev);
    if (!head) return;
    head.addEventListener('click', () => {
      const open = ev.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
    });
  });

  const filters = $$('.filter');
  if (filters.length) {
    const empty = $('#eventsEmpty');
    const apply = (mode) => {
      let shown = 0;
      events.forEach(ev => {
        const past = ev.classList.contains('event--past');
        const hide = (mode === 'upcoming' && past) || (mode === 'past' && !past);
        ev.classList.toggle('is-filtered', hide);
        if (!hide) shown++;
        if (hide) { ev.classList.remove('is-open'); $('.event__head', ev)?.setAttribute('aria-expanded', 'false'); }
      });
      $$('.year-label').forEach(label => {
        const list = label.nextElementSibling;
        const visible = list ? $$('.event', list).some(e => !e.classList.contains('is-filtered')) : true;
        label.classList.toggle('is-filtered', !visible);
      });
      if (empty) empty.hidden = shown > 0;
    };
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.toggle('is-active', b === btn));
        apply(btn.dataset.filter);
      });
    });
    const initial = $('.filter.is-active');
    if (initial) apply(initial.dataset.filter);
  }

  /* ── Magnetische Buttons ─────────────────────────────────────────────── */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('[data-magnetic]').forEach(el => {
      const strength = 0.28;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* Sanftes 3D-Tilt für Karten */
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ── Spotlight im CTA ────────────────────────────────────────────────── */
  const cta = $('#mitmachen');
  const spot = $('#ctaSpot');
  if (cta && spot && !reduced) {
    cta.addEventListener('mousemove', e => {
      const r = cta.getBoundingClientRect();
      spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
      spot.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ── Aktiver Navigationspunkt ────────────────────────────────────────── */
  const navLinks = $$('[data-nav]');
  if (navLinks.length) {
    const sections = navLinks
      .map(a => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
      .filter(s => s.el);
    const nio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-active'));
        const match = sections.find(s => s.el === entry.target);
        if (match) match.link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => nio.observe(s.el));
  }

  /* ── Marquee reagiert auf Scrollrichtung ─────────────────────────────── */
  const track = $('#marqueeTrack');
  if (track && !reduced) {
    let prev = window.scrollY, timer = null;
    window.addEventListener('scroll', () => {
      const dir = window.scrollY > prev ? 'normal' : 'reverse';
      prev = window.scrollY;
      track.style.animationDirection = dir;
      track.style.animationDuration = '24s';
      clearTimeout(timer);
      timer = setTimeout(() => { track.style.animationDuration = '44s'; }, 220);
    }, { passive: true });
  }

  /* ── Nach oben + Jahr ────────────────────────────────────────────────── */
  $('#toTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
