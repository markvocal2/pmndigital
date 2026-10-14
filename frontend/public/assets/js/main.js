/* ==========================================================================
   PMN Digital — motion engine
   GSAP 3.13 (ScrollTrigger, SplitText, Flip, CustomEase) + Lenis.
   PMN grammar: everything moves along the logo's 14° italic. Lines rise
   slanted and straighten, images open with a slanted sweep, a wide brush with a
   slanted oval tip paints the paper away, paperwork gets stamped and filed. Cobalt marks action.
   Content is visible by default; html.anim only exists while motion is on.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const html = d.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesk = () => innerWidth >= 992;

  if (typeof gsap === 'undefined') { html.classList.remove('anim'); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
  const HAS_CE = typeof CustomEase !== 'undefined';
  if (HAS_CE) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('pmn', '0.7,0,0.2,1');
    CustomEase.create('pmnOut', '0.2,0.8,0.2,1');
  }
  window.__pmnBooted = true;

  const EASE = HAS_CE ? 'pmn' : 'power3.inOut';
  const OUT = HAS_CE ? 'pmnOut' : 'power3.out';
  const SL = 0.249; // tan 14°: the slant of the PMN wordmark
  const SLANT_OPEN = 'polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)';
  const slantFrom = (dir) => (dir > 0 ? 'polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)' : 'polygon(125% 0%, 125% 0%, 100% 100%, 100% 100%)');
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const mk = (tag, cls) => { const e = d.createElement(tag); if (cls) e.className = cls; return e; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const mm = gsap.matchMedia();
  const MOTION = !RM;

  /* ------------------------------------------------------------------------
     Intro gate: reveals queue until the loader / curtain has finished
     ------------------------------------------------------------------------ */
  let introDone = false;
  const introQueue = [];
  const whenReady = (fn) => (introDone ? fn() : introQueue.push(fn));
  const releaseIntro = () => { if (introDone) return; introDone = true; introQueue.splice(0).forEach((fn) => fn()); };

  /* ------------------------------------------------------------------------
     Thai-aware splitting: SplitText splits on a zero-width delimiter that
     prepareText inserts between Intl.Segmenter word segments.
     ------------------------------------------------------------------------ */
  const ZW = '​';
  const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const OPENERS = /^[“‘("'[«]+$/;
  const prepareText = (text) => {
    const parts = SEG ? Array.from(SEG.segment(text), (s) => s.segment) : text.split(/(\s+)/);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      let p = parts[i];
      if (!p) continue;
      if (/^\s+$/.test(p)) { out.push(' '); continue; }
      if (OPENERS.test(p) && i + 1 < parts.length && !/^\s+$/.test(parts[i + 1])) { parts[i + 1] = p + parts[i + 1]; continue; }
      if (!/[\p{L}\p{N}]/u.test(p) && out.length && out[out.length - 1] !== ' ') { out[out.length - 1] += p; continue; }
      out.push(p);
    }
    return out.join(ZW);
  };
  const split = (el, type) => SplitText.create(el, {
    type,
    mask: type.includes('lines') ? 'lines' : type.includes('chars') ? 'chars' : undefined,
    linesClass: 'ln',
    charsClass: 'ch',
    wordsClass: 'wd',
    wordDelimiter: { delimiter: ZW, replaceWith: '' },
    prepareText,
    aria: 'auto',
  });

  /* ------------------------------------------------------------------------
     Lenis smooth scroll wired to GSAP's clock
     ------------------------------------------------------------------------ */
  let lenis = null;
  if (MOTION && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), touchMultiplier: 2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const navOffset = () => -(parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 64) * 0.5;
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: navOffset(), duration: 1.4 });
    else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  };

  /* ------------------------------------------------------------------------
     Odometer: numerals step by whole lines
     ------------------------------------------------------------------------ */
  function setOdo(el, str, opts = {}) {
    const { dur = 1.1, stagger = 0.07, instant = false, ease = OUT } = opts;
    let vis = el.querySelector('.odo__vis');
    let sr = el.querySelector('.odo__sr');
    if (!vis) {
      el.textContent = '';
      el.classList.add('odo');
      sr = mk('span', 'sr-only odo__sr');
      vis = mk('span', 'odo__vis');
      vis.setAttribute('aria-hidden', 'true');
      vis.style.display = 'inline-flex';
      el.append(sr, vis);
    }
    sr.textContent = str;
    const chars = Array.from(str);
    const cols = Array.from(vis.children);
    const shapeOk = cols.length === chars.length && cols.every((c, i) => (c.dataset.digit === '1') === /\d/.test(chars[i]));
    if (!shapeOk) {
      vis.textContent = '';
      chars.forEach((ch) => {
        if (/\d/.test(ch)) {
          const col = mk('span', 'odo__col');
          col.dataset.digit = '1';
          const strip = mk('span', 'odo__strip');
          for (let n = 0; n < 10; n++) { const s = mk('span'); s.textContent = n; strip.append(s); }
          col.append(strip);
          vis.append(col);
          gsap.set(strip, { yPercent: 0 });
        } else {
          const fix = mk('span', 'odo__fix');
          fix.dataset.digit = '0';
          fix.textContent = ch;
          vis.append(fix);
        }
      });
    }
    const nCols = vis.children.length;
    Array.from(vis.children).forEach((col, i) => {
      if (col.dataset.digit !== '1') { col.textContent = chars[i]; return; }
      const strip = col.firstChild;
      const n = +chars[i];
      if (instant || RM) gsap.set(strip, { yPercent: -n * 10 });
      else gsap.to(strip, { yPercent: -n * 10, duration: dur, ease, delay: (nCols - 1 - i) * stagger, overwrite: true });
    });
  }
  const zeroed = (str) => str.replace(/\d/g, '0');


  /* ------------------------------------------------------------------------
     Reveal system (attribute driven, plays once): lines rise slanted like
     the wordmark and straighten; images open with a slanted sweep.
     ------------------------------------------------------------------------ */
  function onEnter(el, play, start = 'top 85%') {
    if (el.hasAttribute('data-intro')) { whenReady(play); return; }
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => whenReady(play) });
  }
  function reveals() {
    if (!MOTION) return;
    $$('[data-line]').forEach((el) => {
      const s = split(el, 'lines');
      gsap.set(el, { visibility: 'visible' });
      gsap.set(s.lines, { yPercent: 150, skewX: -14, transformOrigin: '0% 100%' });
      const delay = +el.dataset.delay || 0;
      onEnter(el, () => gsap.to(s.lines, { yPercent: 0, skewX: 0, duration: 0.9, ease: EASE, stagger: 0.08, delay, onComplete: () => s.revert() }));
    });
    $$('[data-letter]').forEach((el) => {
      const s = split(el, 'chars');
      gsap.set(el, { visibility: 'visible' });
      gsap.set(s.chars, { yPercent: 135, skewX: -14, transformOrigin: '0% 100%' });
      const delay = +el.dataset.delay || 0;
      onEnter(el, () => gsap.to(s.chars, { yPercent: 0, skewX: 0, duration: 1, ease: EASE, stagger: 0.06, delay, onComplete: () => s.revert() }));
    });
    $$('[data-fade]').forEach((el) => {
      gsap.set(el, { autoAlpha: 0 });
      onEnter(el, () => gsap.to(el, { autoAlpha: 1, duration: 0.9, ease: OUT, delay: +el.dataset.delay || 0 }));
    });
    $$('[data-rise]').forEach((el) => {
      gsap.set(el, { autoAlpha: 0, y: 60, x: -60 * SL });
      onEnter(el, () => gsap.to(el, { autoAlpha: 1, y: 0, x: 0, duration: 1, ease: OUT, delay: +el.dataset.delay || 0 }));
    });
    $$('[data-scale]').forEach((el) => {
      gsap.set(el, { visibility: 'visible', scale: 0 });
      onEnter(el, () => gsap.to(el, { scale: 1, duration: 0.8, ease: OUT, delay: +el.dataset.delay || 0 }));
    });
    $$('[data-wipe]').forEach((el, i) => {
      const dir = i % 2 ? -1 : 1;
      gsap.set(el, { visibility: 'visible', clipPath: slantFrom(dir) });
      onEnter(el, () => gsap.to(el, { clipPath: SLANT_OPEN, duration: 1, ease: EASE, delay: +el.dataset.delay || 0, onComplete: () => gsap.set(el, { clearProps: 'clipPath' }) }), 'top 85%');
    });
  }

  function parallax() {
    if (!MOTION) return;
    mm.add('(min-width: 992px)', () => {
      $$('[data-parallax]').forEach((el) => {
        gsap.to(el, {
          y: +el.dataset.parallax || -60, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: +el.dataset.scrub || 1 },
        });
      });
      $$('[data-parallax-img]').forEach((img) => {
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Page curtain (leave / enter)
     ------------------------------------------------------------------------ */
  const curtain = $('.curtain');
  function leave(href) {
    if (!curtain || RM) { location.href = href; return; }
    try { sessionStorage.setItem('pmn-nav', '1'); } catch (e) { /* storage blocked */ }
    lenis && lenis.stop();
    gsap.fromTo(curtain, { clipPath: 'polygon(0% 125%, 100% 100%, 100% 100%, 0% 125%)' }, { clipPath: 'polygon(0% 0%, 100% -25%, 100% 100%, 0% 125%)', duration: 0.7, ease: EASE, onComplete: () => { location.href = href; } });
  }
  function enter() {
    if (!html.classList.contains('is-entering') || !curtain) return false;
    gsap.fromTo(curtain, { clipPath: 'polygon(0% 0%, 100% -25%, 100% 100%, 0% 125%)' }, {
      clipPath: 'polygon(0% -25%, 100% -50%, 100% -50%, 0% -25%)', duration: 0.95, ease: EASE, delay: 0.1,
      onComplete: () => html.classList.remove('is-entering'),
    });
    gsap.delayedCall(0.55, releaseIntro);
    return true;
  }
  addEventListener('pageshow', (e) => {
    if (e.persisted && curtain) {
      gsap.set(curtain, { clipPath: 'polygon(0% 125%, 100% 100%, 100% 100%, 0% 125%)' });
      html.classList.remove('is-entering');
      lenis && lenis.start();
    }
  });
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.protocol !== location.protocol) return;
    if (location.protocol !== 'file:' && url.origin !== location.origin) return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage && url.hash) {
      const t = d.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (t) { e.preventDefault(); closeMenus(); scrollToEl(t); history.replaceState(null, '', url.hash); }
      return;
    }
    if (samePage) return;
    e.preventDefault();
    closeMenus();
    leave(url.href);
  });

  /* ------------------------------------------------------------------------
     Nav: mark expands to the full name, hover menu, mobile overlay
     ------------------------------------------------------------------------ */
  const menu = $('.menu');
  const mmenu = $('.mmenu');
  let closeMenus = () => {};
  function nav() {
    const mark = $('.nav__mark');
    if (mark) {
      const subWrap = $('.mk-subwrap', mark);
      const subs = $$('.mk-sub path', mark);
      if (subWrap && MOTION) {
        gsap.set(subWrap, { width: 0 });
        gsap.set(subs, { y: 260, x: -260 * SL });
        const tl = gsap.timeline({ paused: true })
          .to(subWrap, { width: 'auto', duration: 0.6, ease: EASE })
          .to(subs, { y: 0, x: 0, duration: 0.5, ease: OUT, stagger: 0.025 }, 0.25);
        mark.addEventListener('mouseenter', () => tl.timeScale(1).play());
        mark.addEventListener('mouseleave', () => tl.timeScale(1.4).reverse());
        mark.addEventListener('focus', () => tl.play());
        mark.addEventListener('blur', () => tl.reverse());
      } else if (subWrap) {
        subWrap.style.display = 'none';
      }
    }

    if (menu) {
      const btn = $('.menu__btn', menu);
      const links = $$('.menu__list a', menu);
      gsap.set(links, { yPercent: 110 });
      const tl = gsap.timeline({ paused: true, onReverseComplete: () => menu.classList.remove('is-open') })
        .to(links, { yPercent: 0, duration: 0.6, ease: OUT, stagger: 0.07 });
      let t;
      const open = () => { clearTimeout(t); menu.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); tl.play(); };
      const close = () => { t = setTimeout(() => { btn.setAttribute('aria-expanded', 'false'); tl.reverse(); }, 60); };
      if (FINE) { menu.addEventListener('mouseenter', open); menu.addEventListener('mouseleave', close); }
      btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? close() : open()));
      menu.addEventListener('focusin', open);
      menu.addEventListener('focusout', (e) => { if (!menu.contains(e.relatedTarget)) close(); });
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); btn.focus(); } });
      closeMenus = () => { btn.setAttribute('aria-expanded', 'false'); tl.reverse(); };
    }

    const navEl = $('.nav');
    if (navEl) {
      let queued = false;
      const lum = (bg) => {
        const m = bg.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const [r, g, bl, a = 1] = m[1].split(',').map(parseFloat);
        return a > 0.5 ? 0.2126 * r + 0.7152 * g + 0.0722 * bl : null;
      };
      const probe = () => {
        queued = false;
        if (html.classList.contains('menu-open')) { html.classList.add('nav-on-dark'); return; }
        const y = (navEl.offsetHeight || 64) / 2;
        const el = d.elementsFromPoint(innerWidth * 0.5, y).find((e) => !navEl.contains(e) && !e.closest('.cursor, .preview'));
        let n = el; let v = null;
        while (n && n !== html && v === null) { v = lum(getComputedStyle(n).backgroundColor); n = n.parentElement; }
        html.classList.toggle('nav-on-dark', v === null || v < 140);
        html.classList.toggle('is-scrolled', scrollY > 24);
      };
      const ask = () => { if (!queued) { queued = true; requestAnimationFrame(probe); } };
      if (lenis) lenis.on('scroll', ask);
      addEventListener('scroll', ask, { passive: true });
      addEventListener('resize', ask);
      ScrollTrigger.addEventListener('refresh', ask);
      probe();
      setTimeout(probe, 600);
    }

    const burger = $('.nav__burger');
    if (burger && mmenu) {
      const links = $$('.mmenu__list a', mmenu);
      const tl = gsap.timeline({ paused: true })
        .to(mmenu, { autoAlpha: 1, duration: 0.5, ease: OUT })
        .from(links, { yPercent: 110, duration: 0.7, ease: OUT, stagger: 0.05 }, 0.05);
      const set = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        mmenu.setAttribute('aria-hidden', String(!open));
        $('.nav__burger-label', burger).textContent = open ? 'CLOSE' : 'MENU';
        html.classList.toggle('menu-open', open);
        html.classList.toggle('nav-on-dark', open || html.classList.contains('nav-on-dark'));
        if (open) { tl.timeScale(1).play(); lenis && lenis.stop(); html.style.overflow = 'hidden'; }
        else { tl.timeScale(1.6).reverse(); lenis && lenis.start(); html.style.overflow = ''; }
      };
      burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { set(false); burger.focus(); } });
      const prev = closeMenus;
      closeMenus = () => { prev(); if (burger.getAttribute('aria-expanded') === 'true') set(false); };
    }
  }


  /* ------------------------------------------------------------------------
     Loader (home, once per session): on cobalt, the logo frame sweeps in,
     the rubber stamp presses PMN into it, the delivered-projects counter
     runs up, and the panel leaves along the slant.
     ------------------------------------------------------------------------ */
  function loader() {
    const L = $('.loader');
    if (!L || !html.classList.contains('show-loader') || !MOTION) {
      if (L) L.remove();
      return null;
    }
    lenis && lenis.stop();
    return new Promise((resolve) => {
      const frame = $('.loader__frame', L);
      const letters = $('.loader__letters', L);
      const sub = $$('.loader__sub path', L);
      const stamp = $('.loader__stamp', L);
      const lines = $$('.loader__grid i', L);
      const count = $('.loader__count .odo-n', L);
      let finished = false;
      setOdo(count, '000', { instant: true });
      const counter = { v: 0 };
      let shown = 0;
      gsap.set([frame, stamp], { visibility: 'visible' });
      gsap.set(letters, { autoAlpha: 0 });
      const tl = gsap.timeline({ onComplete: () => exit() });
      tl.fromTo(lines, { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: EASE, stagger: { each: 0.035, from: 'start' } }, 0)
        .fromTo(frame, { clipPath: slantFrom(1) }, { clipPath: SLANT_OPEN, duration: 0.9, ease: EASE }, 0.2)
        .fromTo(stamp, { yPercent: -240, rotation: -10, autoAlpha: 1 }, { yPercent: 0, rotation: 0, duration: 0.6, ease: 'power3.in' }, 0.7)
        .to(stamp, { scaleY: 0.9, scaleX: 1.05, transformOrigin: '50% 100%', duration: 0.1, ease: 'power2.out' }, 1.3)
        .fromTo(letters, { autoAlpha: 0, scale: 1.05, filter: 'blur(3px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.3, ease: OUT }, 1.36)
        .to(stamp, { scaleY: 1, scaleX: 1, duration: 0.18, ease: OUT }, 1.42)
        .to(stamp, { yPercent: -260, rotation: 9, duration: 0.75, ease: EASE }, 1.6)
        .fromTo(sub, { y: 260, x: -260 * SL }, { y: 0, x: 0, duration: 0.5, ease: OUT, stagger: 0.022 }, 1.75)
        .to(counter, {
          v: +($('.loader__count', L).dataset.target) || 120, duration: 2.3, ease: 'power2.inOut',
          onUpdate: () => {
            const v = Math.round(counter.v);
            if (v !== shown) { shown = v; setOdo(count, String(v).padStart(3, '0'), { dur: 0.3, stagger: 0.02, ease: 'power2.out' }); }
          },
        }, 0.35)
        .to({}, { duration: 0.3 });

      function exit() {
        if (finished) return;
        finished = true;
        tl.pause();
        const p = { t: 0 };
        gsap.timeline({
          onComplete: () => {
            L.remove();
            html.classList.remove('show-loader');
            try { sessionStorage.setItem('pmn-loaded', '1'); } catch (e) { /* ignore */ }
            lenis && lenis.start();
            resolve();
          },
        })
          .to($('.loader__stage', L), { yPercent: -16, xPercent: 16 * SL, autoAlpha: 0, duration: 0.8, ease: EASE }, 0)
          .to($('.loader__count', L), { autoAlpha: 0, duration: 0.4 }, 0)
          .to(p, {
            t: 1, duration: 1.15, ease: EASE,
            onUpdate: () => { const b = 125 - p.t * 150; L.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${b - 25}%, 0% ${b}%)`; },
          }, 0.15)
          .add(releaseIntro, 0.5);
      }
      const skip = $('.loader__skip', L);
      skip && skip.addEventListener('click', exit);
      d.addEventListener('keydown', (e) => { if (e.key === 'Escape') exit(); }, { once: true });
    });
  }


  /* ------------------------------------------------------------------------
     Hero story: one business's journey in nine chapters, told on one map.
     A small shop, then web, app, ERP/CRM, custom software, API, care and
     Linux, walked as a ring round PMN in the middle (tools/spot_art.py).
     The camera (the world group) flies along a white line from chapter to
     chapter while the business rides it, the line laid behind it; each
     chapter's scene builds as the camera arrives (every moving part carries
     data-a / data-t). The last chapter pulls back to the whole map with a
     line in from every chapter to PMN. The headline's verb and quoted noun
     and the narration change with each chapter. The rail jumps to any
     chapter (a slanted cobalt curtain cuts there), the pause stops it all,
     and it rests off screen and in a hidden tab. Without motion the map
     itself is the picture and the rail moves the view in place.
     ------------------------------------------------------------------------ */
  function spot() {
    const sec = $('[data-spot]');
    if (!sec) return;
    const world = $('.spot__world', sec);
    const scenes = $$('.spot__sc', sec);
    const conns = $$('.spot__conn', sec);
    const token = $('.spot__token', sec);
    const tiers = token ? $$('[data-tier]', token) : [];
    const subs = $$('.spot__sub', sec);
    const cells = $$('.spot__cell', sec);
    const fills = cells.map((c) => $('.spot__bar i', c));
    const curtain = $('.spot__curtain', sec);
    const stage = $('.spot__stage', sec);
    const pauseBtn = $('.spot__pause', sec);
    const slots = { verb: $('[data-slot="verb"]', sec), noun: $('[data-slot="noun"]', sec) };
    if (!world || !scenes.length) return;
    const N = scenes.length; const LAST = N - 1;
    const PAN = 1.5; const DONE = 9; // a camera move; a time by which every scene has finished building
    let cur = 0; let started = false; let userPaused = false; let onScreen = true;
    let clk = null; let move = null;

    // the camera: chapter i centred at full size, or the whole map
    const centre = (i) => ({ x: +scenes[i].dataset.x + 300, y: +scenes[i].dataset.y + 260 });
    const cam = (i) => ({ x: -(+scenes[i].dataset.x), y: -(+scenes[i].dataset.y), scale: 1 });
    const Z = +world.dataset.zoom || 0.25;
    const map = { x: 300 - (+world.dataset.cx) * Z, y: 268 - (+world.dataset.cy) * Z, scale: Z };
    const view = (i) => (i === LAST ? map : cam(i));
    // written straight to the transform attribute (translate, then scale about the map's origin)
    const camNow = { x: 0, y: 0, scale: 1 };
    const drawCam = () => world.setAttribute('transform', `translate(${camNow.x.toFixed(2)} ${camNow.y.toFixed(2)}) scale(${camNow.scale.toFixed(4)})`);
    const setCam = (v) => { gsap.killTweensOf(camNow); Object.assign(camNow, v); drawCam(); };

    const GR = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
    const graphemes = (s) => (GR ? Array.from(GR.segment(s), (x) => x.segment) : Array.from(s));
    const EASES = { o: OUT, p: EASE, n: 'none', i: 'power3.in' };

    // one timeline per chapter, read off the art's data attributes; resets put back what a timeline cannot rewind (text)
    function build(g) {
      const tl = gsap.timeline({ paused: true });
      const resets = [];
      $$('[data-a]', g).forEach((el) => {
        const ds = el.dataset;
        const t = +ds.t || 0; const dur = +ds.d || 0.6; const ease = EASES[ds.e] || OUT;
        switch (ds.a) {
          case 'rise': tl.fromTo(el, { y: 40, x: -40 * SL, autoAlpha: 0 }, { y: 0, x: 0, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'slide': tl.fromTo(el, { x: +ds.dx || 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'drop': tl.fromTo(el, { y: -90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'pop': tl.fromTo(el, { scale: 0.6, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'phone': tl.fromTo(el, { y: 140, x: -140 * SL, rotation: -9, autoAlpha: 0, transformOrigin: '50% 100%' }, { y: 0, x: 0, rotation: 0, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'slip': tl.fromTo(el, { x: -170, rotation: -14, autoAlpha: 0, transformOrigin: '50% 50%' }, { x: 0, rotation: 0, autoAlpha: 1, duration: dur, ease }, t); break;
          case 'awn': tl.fromTo(el, { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: dur, ease }, t); break;
          case 'fade': case 'in': tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur, ease: 'power1.out' }, t); break;
          case 'out': tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: dur, ease: 'power1.in' }, t); break;
          case 'grow': tl.fromTo(el, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: dur, ease }, t); break;
          case 'hgt': tl.fromTo(el, { scaleY: +ds.f || 0.5, transformOrigin: '50% 100%' }, { scaleY: 1, duration: dur, ease: EASE }, t); break;
          case 'bob': tl.fromTo(el, { y: 0 }, { y: -9, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1 }, t); break;
          case 'stamp': // a rubber stamp: falls in tilted and large, lands, squashes a touch
            tl.fromTo(el, { scale: +ds.sx || 1.6, rotation: +ds.rot || 0, autoAlpha: 0, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, autoAlpha: 1, duration: dur, ease: 'power3.in' }, t)
              .to(el, { scaleX: 1.04, scaleY: 0.94, duration: 0.08, ease: 'power2.out' }, t + dur)
              .to(el, { scaleX: 1, scaleY: 1, duration: 0.22, ease: OUT }, t + dur + 0.08);
            break;
          case 'press':
            tl.to(el, { scale: 0.9, transformOrigin: '50% 50%', duration: 0.12, ease: 'power2.in' }, t).to(el, { scale: 1, duration: 0.32, ease: OUT }, t + 0.12);
            break;
          case 'move':
            tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, t)
              .fromTo(el, { x: +ds.fx, y: +ds.fy }, { x: +ds.tx, y: +ds.ty, duration: dur, ease: EASE }, t);
            break;
          case 'ring': {
            const every = +ds.every || 0;
            // hidden until its moment, then it spreads and fades (again and again when it has a beat)
            tl.set(el, { scale: 0.4, autoAlpha: 1, transformOrigin: '50% 50%' }, t)
              .to(el, { scale: +ds.s || (every ? 1.3 : 2.4), autoAlpha: 0, duration: dur, ease: 'power2.out', repeat: every ? -1 : 0, repeatDelay: every }, t);
            break;
          }
          case 'flash': tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur / 2, ease: 'power1.out', yoyo: true, repeat: -1, repeatDelay: +ds.every || 0.6 }, t); break;
          case 'blink': tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0.2, duration: dur, ease: 'steps(1)', yoyo: true, repeat: -1, repeatDelay: 0.2 + Math.random() * 0.7 }, t); break;
          case 'spin': tl.fromTo(el, { rotation: 0, transformOrigin: '50% 50%' }, { rotation: 360, duration: dur, ease: 'none', repeat: -1 }, t); break;
          case 'swing': tl.fromTo(el, { rotation: 0, transformOrigin: ds.to || '50% 50%' }, { rotation: +ds.rot || 25, duration: dur, ease: 'power1.inOut', yoyo: true, repeat: 5 }, t); break;
          case 'draw': {
            const dash = el.getAttribute('stroke-dasharray');
            if (dash) { // a dotted line fades in and its dots march along it, toward where it leads
              const cyc = dash.split(/[\s,]+/).reduce((a, b) => a + (+b || 0), 0) * 2;
              tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur, ease: 'power1.out' }, t)
                .fromTo(el, { strokeDashoffset: 0 }, { strokeDashoffset: -cyc, duration: 0.9, ease: 'none', repeat: -1 }, t);
            } else {
              const len = el.getTotalLength() + 1;
              tl.fromTo(el, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease: EASE }, t);
            }
            break;
          }
          case 'type': { // grapheme by grapheme, so Thai marks never split from their letters
            const gs = graphemes(el.textContent); const st = { k: 0 };
            resets.push(() => { el.textContent = ''; });
            tl.fromTo(st, { k: 0 }, { k: gs.length, duration: dur, ease: 'none', onUpdate: () => { el.textContent = gs.slice(0, Math.round(st.k)).join(''); } }, t);
            break;
          }
          case 'count': {
            const vals = (ds.v || '').split('|');
            resets.push(() => { el.textContent = vals[0]; });
            vals.forEach((v, k) => tl.call(() => { el.textContent = v; }, null, t + (k * dur) / vals.length));
            break;
          }
          case 'flow': { // a packet riding a line, start to end (or back), over and over
            const path = $(ds.path, g);
            if (!path) break;
            const len = path.getTotalLength(); const rev = ds.rev === '1'; const st = { p: 0 };
            const place = () => {
              const pt = path.getPointAtLength((rev ? 1 - st.p : st.p) * len);
              el.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
            };
            resets.push(() => { gsap.set(el, { autoAlpha: 0 }); });
            tl.set(el, { autoAlpha: 1 }, t)
              .fromTo(st, { p: 0 }, { p: 1, duration: dur, ease: 'power1.inOut', repeat: ds.n ? +ds.n - 1 : -1, repeatDelay: 0.3, onUpdate: place, onStart: place }, t);
            break;
          }
          default: break;
        }
      });
      return { tl, resets };
    }

    // the line between chapters: drawn to a fraction
    const lens = conns.map((c) => c.getTotalLength());
    const lay = (i, f) => {
      const c = conns[i]; if (!c) return;
      c.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
      c.style.strokeDashoffset = String(lens[i] * (1 - Math.max(0, Math.min(1, f))));
    };

    const built = [];
    const live = () => MOTION && started && !userPaused && onScreen && !d.hidden;
    function sync() {
      const on = live();
      if (clk) (on ? clk.resume() : clk.pause());
      const b = built[cur];
      if (b) (on ? b.tl.resume() : b.tl.pause());
    }
    function play(i) {
      const b = built[i]; if (!b) return;
      b.resets.forEach((f) => f());
      b.tl.restart();
      if (!live()) b.tl.pause();
    }
    const rest = (i) => { const b = built[i]; if (b) b.tl.pause(); }; // left behind as it is: the map keeps every finished scene
    const finish = (i) => { const b = built[i]; if (b) { b.tl.time(DONE, false); b.tl.pause(); } };
    const clear = (i) => { const b = built[i]; if (b) { b.tl.pause(0); b.resets.forEach((f) => f()); } };
    // the map as it stands at chapter i: everything before it told, everything after it still to come
    function stateAt(i) {
      scenes.forEach((_, k) => (k < i ? finish(k) : clear(k)));
      conns.forEach((_, k) => lay(k, k < i ? 1 : 0));
      gsap.set(token, { autoAlpha: 0 });
      setCam(view(i));
    }

    // the business grows as the story goes: a shop, an office, a tower
    const tier = (i) => tiers.forEach((u, n) => u.setAttribute('visibility', n === (i >= 6 ? 2 : i >= 3 ? 1 : 0) ? 'visible' : 'hidden'));

    // the headline: the old word leaves upward on the slant, the new one rises in, the slot eases to its width
    function swapWord(slot, word) {
      if (!slot) return;
      gsap.killTweensOf([slot, ...slot.children]);
      while (slot.children.length > 1) slot.firstElementChild.remove();
      const was = slot.firstElementChild;
      was.classList.remove('is-next');
      gsap.set([was, slot], { clearProps: 'all' });
      if (was.textContent === word) return;
      if (!MOTION) { was.textContent = word; return; }
      const nxt = mk('span', 'is-next');
      nxt.textContent = word;
      slot.appendChild(nxt);
      const w0 = was.getBoundingClientRect().width; const w1 = nxt.getBoundingClientRect().width;
      const grow = w1 > w0;
      gsap.fromTo(slot, { width: w0 }, { width: w1, duration: grow ? 0.4 : 0.6, ease: grow ? OUT : EASE, delay: grow ? 0 : 0.3, onComplete: () => gsap.set(slot, { clearProps: 'width' }) });
      gsap.to(was, { yPercent: -85, skewX: -14, autoAlpha: 0, duration: 0.42, ease: 'power2.in' });
      gsap.fromTo(nxt, { yPercent: 85, skewX: -14, autoAlpha: 0 }, {
        yPercent: 0, skewX: 0, autoAlpha: 1, duration: 0.75, ease: OUT, delay: 0.36,
        onComplete: () => { was.remove(); nxt.classList.remove('is-next'); gsap.set(nxt, { clearProps: 'all' }); },
      });
    }
    function swapSub(i) {
      const a = subs.find((s) => s.classList.contains('is-on')); const b = subs[i];
      if (!b || a === b) return;
      if (a) { a.classList.remove('is-on'); a.setAttribute('aria-hidden', 'true'); }
      b.classList.add('is-on'); b.removeAttribute('aria-hidden');
      if (!MOTION) return;
      gsap.killTweensOf([a, b]);
      if (a) gsap.fromTo(a, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.3, ease: 'power2.in' });
      gsap.fromTo(b, { autoAlpha: 0, y: 26, x: -26 * SL }, { autoAlpha: 1, y: 0, x: 0, duration: 0.75, ease: OUT, delay: 0.4 });
    }
    const sheetNos = $$('.spot__tbn', sec);
    const mapCells = $$('.spot__mm [data-i]', sec);
    const pad2 = (n) => String(n).padStart(2, '0');
    sheetNos.forEach((el) => setOdo(el, pad2(1), { instant: true }));
    // the chapter being told is the lit one (the full-bleed layout dims the rest of the map behind the copy)
    const markCur = (i) => scenes.forEach((g, k) => g.classList.toggle('is-cur', k === i));
    markCur(0);
    function copy(i) {
      markCur(i);
      sheetNos.forEach((el) => setOdo(el, pad2(i + 1), { dur: 0.7, stagger: 0.06 }));
      mapCells.forEach((r) => { r.classList.toggle('is-done', +r.dataset.i < i); r.classList.toggle('is-on', +r.dataset.i === i); });
      swapWord(slots.verb, subs[i].dataset.verb);
      swapWord(slots.noun, subs[i].dataset.noun);
      swapSub(i);
      sec.classList.toggle('on-hub', i === LAST);
    }

    // the rail: told chapters stay full, the one being told fills over its time, the rest wait empty
    function rail(i) {
      cells.forEach((c, k) => c.setAttribute('aria-current', k === i ? 'true' : 'false'));
      fills.forEach((f, k) => { gsap.killTweensOf(f); gsap.set(f, { scaleX: k < i || (!MOTION && k === i) ? 1 : 0 }); });
    }
    function clock(i) {
      if (clk) clk.kill();
      clk = null;
      if (!MOTION) return;
      const next = i === LAST ? 0 : i + 1;
      clk = gsap.fromTo(fills[i], { scaleX: 0 }, { scaleX: 1, duration: +subs[i].dataset.hold || 5.6, ease: 'none', onComplete: () => go(next) });
      if (!live()) clk.pause();
    }

    // on to the next chapter: the camera flies along the line, the business rides it, the line is laid behind it
    function travel(from, to) {
      const A = cam(from); const B = cam(to);
      const a = centre(from); const b = centre(to);
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const lead = (dist - lens[from]) / 2; // the line starts this far out from the chapter's centre
      const st = { p: 0 };
      tier(to);
      const tl = gsap.timeline();
      tl.to(st, {
        p: 1, duration: PAN, ease: 'power2.inOut',
        onUpdate: () => {
          const p = st.p;
          Object.assign(camNow, { x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p, scale: 1 });
          drawCam();
          token.setAttribute('transform', `translate(${(a.x + (b.x - a.x) * p).toFixed(1)} ${(a.y + (b.y - a.y) * p).toFixed(1)})`);
          token.style.opacity = String(Math.max(0, Math.min(1, (p - 0.2) / 0.1, (0.8 - p) / 0.1)));
          token.style.visibility = 'visible';
          lay(from, (p * dist - lead) / lens[from]);
        },
      }, 0)
        .call(() => { rest(from); play(to); }, null, PAN * 0.45);
      tl.call(() => { const b = built[from]; if (b && b.tl.time() < DONE - 3) finish(from); }, null, PAN);
      // the last chapter: arrive on PMN, then pull back until the whole story is in view
      if (to === LAST) tl.to(camNow, { x: map.x, y: map.y, scale: map.scale, duration: 2.4, ease: EASE, lazy: false, onUpdate: drawCam }, PAN + 0.9);
      return tl;
    }
    // a jump (or the story starting over): the curtain cuts to that chapter with the map as it would stand there
    function cut(i) {
      return gsap.timeline()
        .fromTo(curtain, { x: 0, xPercent: -104, visibility: 'visible' }, { xPercent: 0, duration: 0.45, ease: 'power3.in' })
        .call(() => { stateAt(i); tier(i); play(i); })
        .to(curtain, { xPercent: 104, duration: 0.6, ease: OUT })
        .set(curtain, { visibility: 'hidden' });
    }

    function go(i) {
      if (i === cur && started) return;
      const from = cur;
      cur = i;
      copy(i);
      rail(i);
      if (!MOTION) { setCam(view(i)); return; }
      if (move) move.progress(1);
      move = i === from + 1 ? travel(from, i) : cut(i);
      clock(i);
    }

    cells.forEach((c) => c.addEventListener('click', () => { if (MOTION && !started) return; go(+c.dataset.go); }));
    if (!MOTION) return; // the markup is the whole map, every chapter complete

    sec.classList.add('is-live');
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      sec.classList.toggle('is-paused', userPaused);
      pauseBtn.setAttribute('aria-label', userPaused ? pauseBtn.dataset.labelPlay : pauseBtn.dataset.labelPause);
      sync();
    });
    new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; sync(); }, { threshold: 0.15 }).observe(sec);
    d.addEventListener('visibilitychange', sync);

    // every chapter's timeline up front (the map is rendered, so their boxes measure), then the story's opening state
    scenes.forEach((g, i) => { built[i] = build(g); });
    stateAt(0);
    tier(0);

    // the copy steps back as the page scrolls on, so the nav's PMN flies down to the reel statement through clear air
    // (on a phone only the headline goes: the narration and buttons below it are still being read as the page moves)
    mm.add('(min-width: 992px)', () => {
      gsap.to($('.spot__copy', sec), { autoAlpha: 0, y: -50, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '30% top', scrub: true } });
    });
    mm.add('(max-width: 991px)', () => {
      gsap.to($('.spot__h1', sec), { autoAlpha: 0, y: -40, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: '22% top', scrub: true } });
    });

    // entrance: the plate opens on the slant, the headline rises line by line, then the shop opens
    const lines = $$('.spot__li', sec);
    const restOf = [$('.spot__subs', sec), $('.spot__ctas', sec), $('.spot__rail', sec)];
    gsap.set(lines, { yPercent: 150, skewX: -14, transformOrigin: '0% 100%', visibility: 'visible' });
    gsap.set(restOf, { autoAlpha: 0, y: 26, x: -26 * SL });
    gsap.set(stage, { visibility: 'visible', clipPath: slantFrom(1) });
    whenReady(() => {
      gsap.timeline()
        .to(lines, { yPercent: 0, skewX: 0, duration: 0.9, ease: EASE, stagger: 0.08 }, 0)
        .to(stage, { clipPath: SLANT_OPEN, duration: 1.05, ease: EASE, onComplete: () => gsap.set(stage, { clearProps: 'clipPath' }) }, 0.1)
        .to(restOf, { autoAlpha: 1, y: 0, x: 0, duration: 0.9, ease: OUT, stagger: 0.1 }, 0.35)
        .call(() => { started = true; rail(0); play(0); clock(0); }, null, 0.45);
    });
  }

  /* ------------------------------------------------------------------------
     Reel: scrolling sorts the pile. The film starts on the scrambled heap in
     a slanted frame (9 columns on desktop, a full-width band on a phone);
     scrolling drives it frame by frame to the ordered grid while the frame
     straightens and opens to the full screen and the meter counts up.
     ------------------------------------------------------------------------ */
  function reel() {
    const sec = $('[data-reel-sec]');
    if (!sec) return;
    const box = $('.reel', sec);
    const video = $('video', box);
    const sticky = $('.reel-sec__sticky', sec);
    const caption = $('.reel-sec__caption', sec);
    const meter = $('.reel__meter .odo-n', sec);
    if (meter) setOdo(meter, '100', { instant: true });
    if (!MOTION || !video || !sticky) {
      // reduced motion: the film simply plays in place once it is in view
      if (!video) return;
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && en.intersectionRatio > 0.35) video.play().catch(() => {}); else if (!en.isIntersecting) video.pause();
      }, { threshold: [0, 0.35] }).observe(box);
      return;
    }
    sec.classList.add('is-scrub');
    video.pause();
    // a phone held upright gets the portrait cut of the film (the same story composed 9:16), so it fills the screen
    const tall = !!video.dataset.portraitSrc && innerWidth / innerHeight < 0.9;
    if (tall) {
      video.src = video.dataset.portraitSrc;
      if (video.dataset.portraitPoster) video.poster = video.dataset.portraitPoster;
      video.dataset.frames = video.dataset.portraitFrames;
      video.dataset.frameCount = video.dataset.portraitCount;
    }
    // touch devices (iOS Safari above all, iPadOS included) scrub a still-frame sequence drawn on a canvas:
    // seeking a <video> there is unreliable, a drawn frame never is. The film stays underneath as the poster
    const touch = !FINE || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
    const seq = touch && video.dataset.frames && +video.dataset.frameCount
      ? { n: +video.dataset.frameCount, pat: video.dataset.frames, imgs: [], at: -1 } : null;
    let canvas = null; let cx = null;
    if (seq) {
      canvas = mk('canvas', 'reel__seq');
      canvas.setAttribute('aria-hidden', 'true');
      video.after(canvas);
      cx = canvas.getContext('2d');
      video.preload = 'none';
    }
    let dur = video.duration || 5;
    let want = 0; let applied = -1; let shown = -1; let lastT = -1;
    const seek = () => {
      if (video.readyState < 1 || video.seeking || Math.abs(want - applied) < 0.03) return;
      applied = want;
      try { video.currentTime = want; } catch (e) { /* not seekable yet */ }
    };
    video.addEventListener('seeked', seek);
    video.addEventListener('loadedmetadata', () => { dur = video.duration || dur; applied = -1; lastT = -1; });
    // touch browsers (iOS Safari above all) neither buffer a film nor paint its seeked frames until it has
    // played once: play and pause it as soon as it is loading, and again on the first tap if the browser
    // refused (Low Power Mode blocks even muted autoplay)
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      video.muted = true;
      const p = video.play();
      if (p && p.then) p.then(() => { video.pause(); unlocked = true; applied = -1; lastT = -1; }).catch(() => {});
    };
    // the film must be seekable: a server that honours byte ranges (the live site) streams it; one that does
    // not (the local preview) cannot, so a copy is fetched into memory. The server is asked directly: a
    // browser can answer a range request from its own cache even when the server never would
    let fetched = false;
    const load = () => {
      if (fetched || !window.fetch || !window.URL) return;
      fetched = true;
      const src = video.currentSrc || video.src;
      fetch(src, { method: 'HEAD', cache: 'no-store' }).then((r) => (/bytes/i.test(r.headers.get('accept-ranges') || '') ? null
        : fetch(src).then((f) => (f.ok ? f.blob() : Promise.reject(f.status))).then((blob) => { video.src = URL.createObjectURL(blob); })))
        .then(() => {
          video.preload = 'auto';
          video.load();
          unlock();
          if (!FINE) ['touchend', 'click'].forEach((ev) => addEventListener(ev, unlock, { once: true, passive: true }));
        })
        .catch(() => { fetched = false; });
    };
    // the frames load every tenth first, so the whole story scrubs coarsely at once, then the ones in between
    const loadSeq = () => {
      const order = []; const seen = new Set();
      [10, 5, 1].forEach((step) => { for (let i = 0; i < seq.n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); } });
      let k = 0;
      const next = () => {
        if (k >= order.length) return;
        const i = order[k++]; const img = new Image();
        img.decoding = 'async';
        img.onload = () => { seq.imgs[i] = img; next(); };
        img.onerror = next;
        img.src = seq.pat.replace('{n}', String(i + 1).padStart(3, '0'));
      };
      for (let c = 0; c < 6; c++) next();
    };
    const drawSeq = () => {
      // the frame for this point of the scroll, or the nearest one already in hand
      const want = Math.round(proxy.t * (seq.n - 1));
      let best = -1;
      for (let dd = 0; dd < seq.n && best < 0; dd++) {
        if (seq.imgs[want - dd]) best = want - dd; else if (seq.imgs[want + dd]) best = want + dd;
      }
      if (best < 0 || best === seq.at || !canvas.width) return;
      seq.at = best;
      cx.drawImage(seq.imgs[best], 0, 0, canvas.width, canvas.height);
    };
    ScrollTrigger.create({ trigger: sec, start: 'top bottom+=150%', once: true, onEnter: seq ? loadSeq : load });

    // the film is full-bleed behind the grid: it covers a landscape screen; on a portrait screen it is a band
    // just wider than the screen (the whole cast and the dashboard stay in view), framed by data-focus
    // (0..1 across the film), its top and bottom feathered into a cobalt ground sampled from the film
    const film = { top: 0, h: 0, band: false };
    const focus = parseFloat(video.dataset.focus) || 0.5;
    const fit = () => {
      const W = sticky.clientWidth; const H = sticky.clientHeight; const ar = tall ? 9 / 16 : 16 / 9;
      film.band = !tall && W / H < 0.9;
      let w; let h; let left;
      if (film.band) {
        w = W * 1.12; h = w / ar;
        left = Math.min(0, Math.max(W - w, W / 2 - w * focus));
      } else {
        w = Math.max(W, H * ar); h = w / ar; left = (W - w) / 2;
      }
      // a phone's band sits just under the nav, so the statement above runs straight into the film (no dead black gap)
      film.top = film.band ? parseFloat(getComputedStyle(sticky).paddingTop) || 0 : (H - h) * 0.46; film.h = h;
      Object.assign(video.style, { left: `${left}px`, top: `${film.top}px`, width: `${w}px`, height: `${h}px` });
      if (canvas) {
        Object.assign(canvas.style, { left: `${left}px`, top: `${film.top}px`, width: `${w}px`, height: `${h}px` });
        const r = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * r); canvas.height = Math.round(h * r);
        seq.at = -1; // resizing clears the canvas: draw the frame again
      }
      box.classList.toggle('is-band', film.band);
      box.classList.toggle('is-tall', tall);
      // on a phone the caption follows straight under the band, so film and words read as one block
      if (caption) Object.assign(caption.style, film.band ? { top: `${film.top + h + 20}px`, bottom: 'auto' } : { top: '', bottom: '' });
    };
    // the starting frame, as a parallelogram on the logo's 14° slant
    const geo = () => {
      fit();
      const cs = getComputedStyle(sticky);
      const pl = parseFloat(cs.paddingLeft); const pr = parseFloat(cs.paddingRight);
      const pt = parseFloat(cs.paddingTop); const pb = parseFloat(cs.paddingBottom);
      const W = sticky.clientWidth; const H = sticky.clientHeight;
      if (isDesk()) {
        const gap = parseFloat(cs.columnGap) || 0;
        const col = (W - pl - pr - gap * 11) / 12;
        return { W, H, x0: pl, x1: pl + col * 9 + gap * 8, y0: pt, y1: H - pb };
      }
      // a phone's starting frame stops above the caption, so the caption never sits on the film at rest
      if (film.band) return { W, H, x0: pl, x1: W - pr, y0: film.top, y1: Math.min(film.top + film.h, H - pb - (caption ? caption.offsetHeight + 16 : 0)) };
      return { W, H, x0: pl, x1: W - pr, y0: pt, y1: H - pb - (caption ? caption.offsetHeight + 16 : 0) };
    };
    const framed = () => {
      // the 14° slant, capped so a tall phone frame does not lean further than a fifth of its width
      const g = geo(); const s = Math.min((g.y1 - g.y0) * SL, (g.x1 - g.x0) * 0.2);
      return `polygon(${g.x0 + s}px ${g.y0}px, ${g.x1}px ${g.y0}px, ${g.x1 - s}px ${g.y1}px, ${g.x0}px ${g.y1}px)`;
    };
    const opened = () => { const g = geo(); return `polygon(0px 0px, ${g.W}px 0px, ${g.W}px ${g.H}px, 0px ${g.H}px)`; };
    const quiet = caption ? $$('.mute', caption) : [];
    const rule = $('.reel__meter', sec);
    if (meter) setOdo(meter, '000', { instant: true });
    const proxy = { t: 0 };
    const tl = gsap.timeline({ scrollTrigger: { trigger: $('.reel-sec__track', sec), start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
    tl.fromTo(box, { clipPath: framed }, { clipPath: opened, ease: 'power2.inOut', duration: 0.62 }, 0.06)
      .fromTo(canvas ? [video, canvas] : video, { scale: 1.12 }, { scale: 1, ease: 'power1.out', duration: 0.62 }, 0.06)
      .to(proxy, { t: 1, ease: 'none', duration: 0.76 }, 0.1)
      // the caption ends up over the cobalt film, so its quiet greys turn white
      .to(quiet, { color: '#fff', ease: 'none', duration: 0.16 }, 0.16)
      .to(rule, { borderTopColor: 'rgba(255,255,255,.45)', ease: 'none', duration: 0.16 }, 0.16)
      .to({}, { duration: 0.14 });
    // PMN arrives as the film turns: the rubber stamp drops, presses the white PMN mark onto the scene and lifts away
    const stamp = $('.reel__stamp', sec);
    if (stamp) {
      const tool = $('.reel__stamp-tool', stamp); const print = $('.reel__stamp-print', stamp);
      // the order reaches the warehouse about a third of the way through the film; the stamp lands as it connects
      tl.fromTo(tool, { autoAlpha: 0, yPercent: -160 }, { autoAlpha: 1, yPercent: 0, ease: 'power2.in', duration: 0.07 }, 0.26)
        .fromTo(print, { autoAlpha: 0, scale: 1.3, rotate: -12 }, { autoAlpha: 1, scale: 1, rotate: -6, ease: EASE, duration: 0.035 }, 0.33)
        .to(tool, { yPercent: -180, autoAlpha: 0, ease: 'power2.out', duration: 0.08 }, 0.36)
        // the mark lifts away before the camera pushes into the dashboard, so it never covers the system it introduced
        .to(print, { autoAlpha: 0, scale: 0.92, ease: 'power1.in', duration: 0.05 }, 0.54);
    }
    // the film follows the proxy every frame rather than from tween callbacks, because a ScrollTrigger
    // refresh (fonts, images) restores the timeline silently and would leave the film on its first frame
    gsap.ticker.add(() => {
      if (seq) drawSeq(); // every tick: a frame that has just arrived may be nearer than the one on show
      if (proxy.t === lastT) return;
      lastT = proxy.t;
      if (!seq) { want = Math.min(dur - 0.04, proxy.t * dur); seek(); }
      const pc = Math.round(proxy.t * 100);
      if (meter && pc !== shown) { shown = pc; setOdo(meter, String(pc).padStart(3, '0'), { dur: 0.25, stagger: 0.02, ease: 'power2.out' }); }
    });
  }

  /* ------------------------------------------------------------------------
     Odometer figures (ledger, portfolio stats, uptime)
     ------------------------------------------------------------------------ */
  function figures() {
    $$('[data-odo]:not([data-odo-scrub])').forEach((el) => {
      const target = el.dataset.odo;
      if (!MOTION) { setOdo(el, target, { instant: true }); return; }
      setOdo(el, zeroed(target), { instant: true });
      onEnter(el, () => setOdo(el, target, { dur: 1.6, stagger: 0.12 }), 'top 90%');
    });
  }

  /* ------------------------------------------------------------------------
     Client board: tiles open in reading order with the slanted sweep
     ------------------------------------------------------------------------ */
  function clients() {
    const grid = $('.clients__grid');
    if (!grid || !MOTION) return;
    const tiles = $$('.client', grid);
    gsap.set(tiles, { clipPath: slantFrom(1) });
    onEnter(grid, () => gsap.to(tiles, { clipPath: SLANT_OPEN, duration: 0.8, ease: EASE, stagger: { each: 0.04, grid: 'auto', from: 'start' } }), 'top 85%');
    // then the marks light up one after another in reading order; a hovered tile takes over and the walk waits
    let at = -1; let seen = false; let held = false;
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }, { threshold: 0.25 }).observe(grid);
    tiles.forEach((t) => {
      t.addEventListener('pointerenter', () => { held = true; tiles.forEach((o) => o.classList.remove('is-lit')); });
      t.addEventListener('pointerleave', () => { held = false; });
    });
    const step = () => {
      if (!seen || held) return;
      if (at >= 0) tiles[at].classList.remove('is-lit');
      at = (at + 1) % tiles.length;
      tiles[at].classList.add('is-lit');
    };
    onEnter(grid, () => gsap.delayedCall(1.2, function walk() { step(); gsap.delayedCall(1.1, walk); }), 'top 85%');
  }


  /* ------------------------------------------------------------------------
     Logo flight (home): the nav's PMN lifts off with the first scroll and
     glides down the page, growing as it goes, into the reel statement where
     the word "PMN" stands ("[PMN] ยินดีช่วยวางระบบ…"); it lands as the
     statement settles at a third of the screen. Scrolling back flies it home
     to the nav. The nav's own mark steps aside while its logo is out and
     comes back once the statement has gone by. Without motion both simply
     show the logo.
     ------------------------------------------------------------------------ */
  function logoFlight() {
    const host = $('.reel-sec__statement');
    const mark = $('.nav__mark');
    const src = mark && $('.mk-pmn', mark);
    if (!MOTION || !host || !src || !host.querySelector('.pmn-slot')) return;
    host.classList.add('logo-fly');
    const flyer = mk('div', 'logo-flyer');
    flyer.setAttribute('aria-hidden', 'true');
    flyer.innerHTML = host.querySelector('.pmn-slot').innerHTML;
    d.body.appendChild(flyer);
    const vb = src.viewBox.baseVal; const AR = vb.width / vb.height;
    let p = 0; let past = false;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
    const render = () => {
      const slot = host.querySelector('.pmn-slot svg'); // looked up each time: SplitText rebuilds the heading
      const flying = p > 0.001 && p < 0.999;
      mark.classList.toggle('is-away', p > 0.001 && !past);
      host.classList.toggle('logo-landed', p >= 0.999);
      flyer.style.display = flying && slot ? 'block' : 'none';
      if (!flying || !slot) return;
      const a = src.getBoundingClientRect(); const b = slot.getBoundingClientRect();
      if (!a.height || !b.height) return;
      const e = ease(p);
      // the slot's box can be wider than its letters while the statement line still leans in on its reveal:
      // size the flyer by the wordmark's own proportions and centre it on that box
      const bw = b.height * AR; const bl = b.left + (b.width - bw) / 2;
      const h = a.height + (b.height - a.height) * e;
      flyer.style.width = `${bw}px`; flyer.style.height = `${b.height}px`;
      flyer.style.transform = `translate(${a.left + (bl - a.left) * e}px, ${a.top + (b.top - a.top) * e}px) scale(${h / b.height})`;
    };
    ScrollTrigger.create({ trigger: host, start: 0, end: 'top 36%', onUpdate: (st) => { p = st.progress; render(); }, onRefresh: (st) => { p = st.progress; render(); } });
    ScrollTrigger.create({ trigger: host, start: 'bottom top', end: 'max', onToggle: (st) => { past = st.isActive; render(); }, onRefresh: (st) => { past = st.isActive; render(); } });
    gsap.ticker.add(() => { if (p > 0.001 && p < 0.999) render(); });
    render();
  }

  /* ------------------------------------------------------------------------
     Rotating word: "คุณ" in the reel statement keeps changing language. Each
     word leaves upward on the 14° slant, the next rises in, and the
     slot is sized to the widest word so the sentence never reflows. It starts
     after the line reveal (SplitText rebuilds the heading when it reverts, so
     the slot is looked up again on every turn) and rests while off screen.
     ------------------------------------------------------------------------ */
  function rotWords() {
    if (!MOTION) return;
    $$('[data-rotate]').forEach((first) => {
      const host = first.closest('[data-line]') || first.parentElement;
      const words = [first.textContent.trim(), ...first.dataset.rotate.split('|').filter(Boolean)];
      let i = 0; let seen = false;
      new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(host);
      const widthOf = (slot, word) => {
        const m = slot.cloneNode(false);
        m.removeAttribute('data-rotate');
        Object.assign(m.style, { position: 'absolute', visibility: 'hidden', width: 'auto' });
        m.textContent = word;
        slot.parentNode.appendChild(m);
        const w = m.getBoundingClientRect().width;
        m.remove();
        return w;
      };
      const turn = () => {
        const slot = host.querySelector('[data-rotate]');
        if (!slot || host.querySelector('.ln') || !seen) return;
        let inner = slot.firstElementChild;
        if (!inner) { inner = mk('span'); inner.textContent = slot.textContent; slot.textContent = ''; slot.appendChild(inner); }
        i = (i + 1) % words.length;
        // cross-fade: the next word rises in while the current one leaves, so the slot is never empty
        const nxt = mk('span', 'rotword__next');
        nxt.textContent = words[i];
        slot.appendChild(nxt);
        gsap.to(inner, { yPercent: -70, skewX: -14, autoAlpha: 0, duration: 0.45, ease: 'power2.in' });
        gsap.fromTo(nxt, { yPercent: 70, skewX: -14, autoAlpha: 0 }, { yPercent: 0, skewX: 0, autoAlpha: 1, duration: 0.6, ease: OUT, delay: 0.12,
          onComplete: () => { inner.remove(); nxt.classList.remove('rotword__next'); gsap.set(nxt, { clearProps: 'transform' }); } }); // the old word keeps the slot's height until the new one takes its place
      };
      // the slot keeps the widest word's width (in em, so it scales with the type), so the sentence never reflows
      const fs = parseFloat(getComputedStyle(first).fontSize) || 16;
      first.style.width = `${(Math.max(...words.map((w) => widthOf(first, w))) / fs + 0.04).toFixed(3)}em`;
      onEnter(host, () => gsap.delayedCall(2.2, function loop() { turn(); gsap.delayedCall(1.9, loop); }), 'top 80%');
    });
  }

  /* ------------------------------------------------------------------------
     Why PMN: the manifesto types itself out behind a slanted cobalt caret
     (grapheme by grapheme, so Thai vowels and tone marks never split), then
     the four reason cards slide in from the left one after another and
     their icons settle into a slow float.
     ------------------------------------------------------------------------ */
  function whySec() {
    if (!MOTION) return;
    $$('[data-type]').forEach((el) => {
      const ghost = $('.type__ghost', el); const live = $('.type__live', el);
      if (!ghost || !live) return;
      const text = ghost.textContent;
      const parts = window.Intl && Intl.Segmenter ? Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text), (s) => s.segment) : Array.from(text);
      el.classList.add('is-typing');
      const o = { n: 0 };
      onEnter(el, () => gsap.to(o, {
        n: parts.length, duration: Math.min(3.4, parts.length * 0.032), ease: 'none', delay: 0.15,
        onUpdate: () => { live.textContent = parts.slice(0, Math.round(o.n)).join(''); },
      }), 'top 78%');
    });
    const cards = $$('[data-why-card]');
    if (!cards.length) return;
    const icons = cards.map((c) => $('.why-card__icon', c));
    gsap.set(cards, { autoAlpha: 0, x: -64 });
    gsap.set(icons, { yPercent: 16, scale: 0.86, rotate: -6 });
    onEnter(cards[0].parentElement, () => {
      gsap.to(cards, { autoAlpha: 1, x: 0, duration: 0.9, ease: EASE, stagger: 0.14 });
      gsap.to(icons, {
        yPercent: 0, scale: 1, rotate: 0, duration: 1.1, ease: OUT, stagger: 0.14, delay: 0.1,
        onComplete: () => icons.forEach((ic, i) => gsap.to(ic, { y: -8, duration: 2.4 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 })),
      });
    }, 'top 82%');
  }

  /* ------------------------------------------------------------------------
     Testimonials chat: as each message scrolls in it joins a queue; one at a
     time, its typing dots show for a moment, then the message pops up from
     its sender's side. Messages keep their space, so nothing shifts.
     ------------------------------------------------------------------------ */
  function chat() {
    const log = $('[data-chat]');
    if (!log || !MOTION) return;
    const msgs = $$('[data-msg]', log);
    const parts = msgs.map((m) => [...m.children].filter((ch) => !ch.classList.contains('msg__dots')));
    gsap.set(parts.flat(), { autoAlpha: 0 });
    const queue = []; let busy = false;
    const run = () => {
      if (busy || !queue.length) return;
      busy = true;
      const i = queue.shift(); const m = msgs[i]; const dots = $('.msg__dots', m);
      const out = m.classList.contains('msg--out');
      gsap.timeline({ onComplete: () => { busy = false; run(); } })
        .to(dots, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' })
        .to(dots, { autoAlpha: 0, duration: 0.15, ease: 'power1.in' }, out ? 0.6 : 0.75)
        .fromTo(parts[i], { autoAlpha: 0, y: 14, scale: 0.96, transformOrigin: out ? '100% 100%' : '0% 100%' },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: EASE, stagger: 0.04 }, '>-0.05')
        .to({}, { duration: 0.2 });
    };
    msgs.forEach((m, i) => ScrollTrigger.create({ trigger: m, start: 'top 88%', once: true, onEnter: () => whenReady(() => { queue.push(i); run(); }) }));
  }

  /* ------------------------------------------------------------------------
     Section sheets: where the ground changes tone (white to black or back),
     the next section rises over the last like a sheet, its top corners
     rounded and a soft shadow above it. As it climbs to the top of the
     screen its corners flatten, and the section underneath sinks back a
     little and dims (the black page shows through). Nothing moves in the
     layout: a zero-height strip before the sheet carries the colour
     underneath into its rounded corners.
     ------------------------------------------------------------------------ */
  function sheets() {
    const tone = (el) => {
      const c = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number);
      if (c.length < 3 || c[3] === 0) return null;
      return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 128 ? 'light' : 'dark';
    };
    let last = null; let prev = null;
    [...$$('#main > *'), $('.footer')].forEach((el) => {
      const t = el && el.offsetHeight ? tone(el) : null;
      if (!t) return;
      if (last && t !== last) sheet(el, prev);
      last = t; prev = el;
    });
  }
  function sheet(el, below) {
    const under = mk('div', 'sheet-under');
    under.setAttribute('aria-hidden', 'true');
    under.style.setProperty('--under', getComputedStyle(below).backgroundColor);
    el.before(under);
    el.classList.add('sheet');
    if (!MOTION) return;
    // the reading frame's side margin (--pad) and the corner radius (--sheet-r), in px for this screen
    const pad = () => (innerWidth <= 991 ? 16 : Math.max(20, (innerWidth - 1280) / 2));
    const rad = () => Math.min(72, Math.max(28, innerWidth * 0.045));
    const apply = (p) => {
      // a card inset to the frame, opening to the full width as it climbs to the top of the screen
      const q = 1 - gsap.parseEase('power2.out')(p); const x = (pad() * q).toFixed(1); const r = (rad() * q).toFixed(1);
      el.style.clipPath = `inset(0 ${x}px 0 ${x}px round ${r}px ${r}px 0 0)`;
      // the colour in the corners leaves with the section it belongs to: as that sinks back and pulls in from the
      // edges, the corners fall to the black page behind, so no bright wedge is left hanging there
      under.style.opacity = Math.max(0, 1 - p * 2.5).toFixed(3);
      // on a phone a section can be shorter than the screen, so it waits until the next one covers half the screen
      // before it sinks (otherwise it shrinks while still being read and the black page shows down its sides)
      const s = innerWidth <= 991 ? Math.max(0, (p - 0.5) / 0.5) : p;
      if (s <= 0.001) { gsap.set(below, { clearProps: 'transform,opacity' }); return; }
      // the part of the section still in view is its last screen: it sinks back about that screen's centre
      gsap.set(below, { scale: 1 - 0.05 * s, opacity: 1 - 0.4 * s, transformOrigin: `50% ${below.offsetHeight - innerHeight / 2}px` });
    };
    // measured after every pinned section above has added its spacing (these triggers are created first, at boot)
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top top', refreshPriority: -1, onUpdate: (st) => apply(st.progress), onRefresh: (st) => apply(st.progress) });
  }

  /* ------------------------------------------------------------------------
     Page minimap: the whole page in miniature on the right edge (wide
     screens). One bar per section, as tall as the section and in its tone;
     a glowing window rides over it showing what is on screen; the current
     section lights cobalt and its name slides out beside the pill whenever
     it changes (or on hover); no counters, only the name. Bars are links: a click glides there.
     ------------------------------------------------------------------------ */
  function minimap() {
    const blocks = [...$$('#main > section, #main > article'), $('.footer')].filter((el) => el && el.offsetHeight > 40);
    if (blocks.length < 3) return;
    const tone = (el) => {
      const c = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number);
      return c.length >= 3 && c[3] !== 0 && 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 128 ? 'light' : 'dark';
    };
    const name = (el, i) => {
      const lab = el.getAttribute('aria-labelledby');
      const t = (lab && d.getElementById(lab)?.textContent) || el.getAttribute('aria-label') || (el.matches('.footer') ? 'ติดต่อเรา' : '');
      if (i === 0 && el.matches('[data-hero], .phero')) return el.matches('[data-hero]') ? 'หน้าแรก' : (t || 'เริ่มต้น');
      // a short label: an explicit data-nav, else the heading without its "( 04 )" count, cut at a word near 26 characters
      if (el.dataset.nav) return el.dataset.nav;
      const s = (t || 'ส่วนที่ ' + (i + 1)).replace(/\(\s*\d+\s*\)/g, '').replace(/\s+/g, ' ').trim();
      if (s.length <= 26) return s;
      const cut = s.lastIndexOf(' ', 26);
      return s.slice(0, cut > 10 ? cut : 26) + '…';
    };
    const nav = mk('nav', 'minimap'); nav.setAttribute('aria-label', 'ตำแหน่งในหน้านี้');
    const pill = mk('div', 'minimap__pill'); const track = mk('div', 'minimap__track');
    const view = mk('span', 'minimap__view'); view.setAttribute('aria-hidden', 'true');
    const tip = mk('span', 'minimap__tip'); tip.setAttribute('aria-hidden', 'true');
    const segs = blocks.map((el, i) => {
      const a = mk('a', 'minimap__seg');
      if (!el.id) el.id = 'sec-' + (i + 1);
      a.href = '#' + el.id; a.dataset.tone = tone(el); a.dataset.name = name(el, i);
      a.setAttribute('aria-label', a.dataset.name);
      a.addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView({ behavior: 'smooth' }); });
      track.appendChild(a);
      return a;
    });
    track.appendChild(view); pill.append(track, tip); nav.appendChild(pill); d.body.appendChild(nav);

    // section extents on the page, pin spacing included (re-measured on every refresh)
    let spans = []; let total = 1;
    const measure = () => {
      spans = blocks.map((el) => { const box = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el; const r = box.getBoundingClientRect(); return [r.top + scrollY, r.height]; });
      total = Math.max(1, d.documentElement.scrollHeight);
      segs.forEach((s, i) => { s.style.flex = `${Math.max(spans[i][1], 1)} 1 0`; });
    };
    measure();
    ScrollTrigger.addEventListener('refresh', measure);
    if (MOTION) gsap.from(segs, { scaleY: 0, duration: 0.8, ease: EASE, stagger: 0.04, delay: 0.8 });

    let cur = -1; let hideT = null;
    const showTip = (i, hold) => {
      tip.textContent = segs[i].dataset.name;
      const tr = track.getBoundingClientRect(); const sr = segs[i].getBoundingClientRect();
      tip.style.top = `${sr.top - tr.top + sr.height / 2 - tip.offsetHeight / 2 + 9}px`;
      nav.classList.add('is-tip');
      clearTimeout(hideT);
      if (!hold) hideT = setTimeout(() => nav.classList.remove('is-tip'), 1800);
    };
    segs.forEach((s, i) => {
      s.addEventListener('pointerenter', () => showTip(i, true));
      s.addEventListener('pointerleave', () => { hideT = setTimeout(() => nav.classList.remove('is-tip'), 400); });
    });
    const update = () => {
      const y = scrollY; const vh = innerHeight; const H = track.clientHeight;
      view.style.transform = `translateY(${(y / total) * H}px)`;
      view.style.height = `${Math.max(8, (vh / total) * H)}px`;
      const mid = y + vh * 0.4;
      let i = spans.findIndex(([t, h]) => mid >= t && mid < t + h); if (i < 0) i = mid < spans[0][0] ? 0 : spans.length - 1;
      if (i !== cur) { if (cur >= 0) { segs[cur].classList.remove('is-on'); segs[cur].removeAttribute('aria-current'); } cur = i; segs[i].classList.add('is-on'); segs[i].setAttribute('aria-current', 'location'); if (y > 40) showTip(i, false); }
    };
    update();
    if (lenis) lenis.on('scroll', update); else addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
  }

  /* ------------------------------------------------------------------------
     Tech stack as abacus rails: hovering a rail counts its beads across.
     ------------------------------------------------------------------------ */
  function abacus() {
    $$('[data-rails]').forEach((root) => {
      const rails = $$('.rail', root);
      if (MOTION) {
        rails.forEach((rail, r) => {
          const rod = $('.rail__line', rail);
          const wrap = $('.rail__beads', rail);
          // the reveal only touches the rod and the bead wrapper; the beads themselves belong to
          // the hover, so a pointer crossing a rail mid-reveal can never strand a bead hidden or shifted
          gsap.set(rod, { scaleX: 0, transformOrigin: '0% 50%' });
          gsap.set(wrap, { autoAlpha: 0, x: -40 });
          onEnter(rail, () => {
            gsap.to(rod, { scaleX: 1, duration: 0.9, ease: EASE, delay: r * 0.1 });
            gsap.to(wrap, { autoAlpha: 1, x: 0, duration: 0.7, ease: OUT, delay: 0.2 + r * 0.1 });
          }, 'top 88%');
        });
      }
      if (!FINE || !MOTION) return;
      rails.forEach((rail) => {
        const wrap = $('.rail__beads', rail);
        const beads = $$('.bead', rail);
        const n = beads.length;
        // one tween per bead with overwrite:true: the newest gesture always wins, delayed ones included
        rail.addEventListener('pointerenter', () => {
          if (!isDesk()) return;
          const shift = Math.max(0, rail.querySelector('.rail__rod').clientWidth - wrap.scrollWidth - 8);
          beads.forEach((b, i) => gsap.to(b, { x: shift, duration: 0.55, ease: OUT, delay: (n - 1 - i) * 0.06, overwrite: true }));
        });
        rail.addEventListener('pointerleave', () => {
          beads.forEach((b, i) => gsap.to(b, { x: 0, duration: 0.6, ease: EASE, delay: i * 0.05, overwrite: true }));
        });
      });
    });
  }


  /* ------------------------------------------------------------------------
     Paperwork filed: the six real pain points start as loose slips over the
     paper storm; scrolling files them into one table, each gets stamped
     "แก้แล้ว", then the outcome line arrives and its figure rolls to 40%.
     ------------------------------------------------------------------------ */
  // loose offsets per slip (vw, vh, deg), kept inside the frame for every column
  // loose slips: scattered over the paper storm but with their words still readable (x vw, y vh, rotation)
  const LOOSE = [[3, 40, -8], [-5, 60, 6], [-5, 34, 9], [-5, 44, 7], [2, 24, -5], [-1, 42, -10]];
  function chaos() {
    const sec = $('[data-chaos]');
    if (!sec || !MOTION) return;
    mm.add('(min-width: 992px)', () => {
      const slips = $$('.slip', sec);
      const stamps = $$('.slip__stamp', sec);
      const line = $('.chaos__line', sec);
      const fig = $('[data-odo-scrub]', sec);
      const vw = innerWidth / 100; const vh = innerHeight / 100;
      slips.forEach((s, i) => {
        const [x, y, r] = LOOSE[i % LOOSE.length];
        gsap.set(s, { x: x * vw, y: y * vh, rotation: r, scale: 0.9, '--lift': 1 });
      });
      gsap.set(stamps, { autoAlpha: 0, scale: 1.8, rotation: -24 });
      gsap.set(line, { autoAlpha: 0, y: 40 });
      if (fig) setOdo(fig, '00%', { instant: true });
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 1 } });
      tl.fromTo($('.chaos__bg img', sec), { scale: 1.12 }, { scale: 1, duration: 1, ease: 'none' }, 0)
        .to(slips, { x: 0, y: 0, rotation: 0, scale: 1, '--lift': 0, duration: 0.3, ease: EASE, stagger: 0.05 }, 0.1)
        .to(stamps, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.08, ease: 'power3.in', stagger: 0.035 }, 0.55)
        // as each ticket is stamped its warning icon turns cobalt: solved
        .to($$('.slip__ic', sec), { backgroundColor: 'rgba(14, 90, 200, .12)', color: '#0e5ac8', duration: 0.06, ease: 'none', stagger: 0.035 }, 0.58)
        .to($$('.slip__no', sec), { color: '#0e5ac8', duration: 0.06, ease: 'none', stagger: 0.035 }, 0.58)
        .to($('.chaos__bg', sec), { opacity: 0.3, duration: 0.3, ease: 'none' }, 0.55)
        .to(line, { autoAlpha: 1, y: 0, duration: 0.12, ease: OUT }, 0.78)
        .call(() => { if (fig) setOdo(fig, tl.scrollTrigger && tl.scrollTrigger.direction < 0 ? '00%' : '40%', { dur: 1.1 }); }, null, 0.84)
        .fromTo($('.chaos__more', sec), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.92);
      return () => {
        gsap.set([...slips, ...stamps, line, ...$$('.slip__ic, .slip__no', sec)], { clearProps: 'all' });
        if (fig) setOdo(fig, '40%', { instant: true });
      };
    });
    // phone: each ticket slides in a little crooked, settles, then gets stamped and its icon turns cobalt
    mm.add('(max-width: 991px)', () => {
      const slips = $$('.slip', sec);
      slips.forEach((s, i) => {
        const stamp = $('.slip__stamp', s);
        gsap.set(s, { autoAlpha: 0, y: 28, rotation: i % 2 ? 2.2 : -2.2 });
        gsap.set(stamp, { autoAlpha: 0, scale: 1.9, rotation: -26 });
        const tl = gsap.timeline({ paused: true })
          .to(s, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.7, ease: OUT })
          .to(stamp, { autoAlpha: 0.94, scale: 1, rotation: -8, duration: 0.22, ease: 'power3.in' }, 0.45)
          .to(s, { scale: 0.985, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, 0.67)
          .to($('.slip__ic', s), { backgroundColor: 'rgba(14, 90, 200, .12)', color: '#0e5ac8', duration: 0.3, ease: 'none' }, 0.67)
          .to($('.slip__no', s), { color: '#0e5ac8', duration: 0.3, ease: 'none' }, 0.67);
        ScrollTrigger.create({ trigger: s, start: 'top 88%', once: true, onEnter: () => tl.play() });
      });
      return () => gsap.set([...slips, ...$$('.slip__stamp, .slip__ic, .slip__no', sec)], { clearProps: 'all' });
    });
  }

  /* ------------------------------------------------------------------------
     Process: five stations in one pinned scene
     ------------------------------------------------------------------------ */
  function process() {
    $$('[data-process]').forEach((sec) => {
      const lines = $$('.process__lines i', sec);
      if (MOTION) {
        gsap.set(lines, { scaleY: 0 });
        onEnter(sec, () => gsap.to(lines, { scaleY: 1, duration: 1.6, ease: EASE, stagger: { each: 0.05, from: 'start' } }), 'top 70%');
      }
      if (!MOTION) return;
      // phone: swipe cards; the bar lights up to the card in view and a tap on a bar glides to its card
      mm.add('(max-width: 991px)', () => {
        const list = $('.process__steps', sec);
        const steps = $$('.step', sec);
        const bars = $$('.process__bar span', sec);
        if (!list || !bars.length) return undefined;
        const mark = () => {
          const w = steps[1] ? steps[1].offsetLeft - steps[0].offsetLeft : 1;
          const i = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4 ? steps.length - 1 : Math.round(list.scrollLeft / w);
          bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
        };
        const taps = bars.map((b, i) => {
          const f = () => list.scrollTo({ left: steps[i].offsetLeft - steps[0].offsetLeft, behavior: 'smooth' });
          b.addEventListener('click', f);
          return f;
        });
        list.addEventListener('scroll', mark, { passive: true });
        mark();
        gsap.from(steps, { autoAlpha: 0, x: 40, duration: 0.8, ease: OUT, stagger: 0.08, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
        return () => {
          list.removeEventListener('scroll', mark);
          bars.forEach((b, i) => { b.removeEventListener('click', taps[i]); b.classList.remove('is-on'); });
        };
      });
      mm.add('(min-width: 992px)', () => {
        const stage = $('.process__stage', sec);
        const steps = $$('.step', sec);
        const num = $('.process__num', sec);
        const bars = $$('.process__bar span', sec);
        const pics = $$('.process__pic', sec);
        sec.classList.add('is-pinned-process');
        // the desk pictures: the first shows, the rest wait; the shown one floats gently
        gsap.set(pics, { autoAlpha: 0 });
        gsap.set(pics[0], { autoAlpha: 1, visibility: 'visible' });
        const float = gsap.to($('.process__art', sec), { y: -6, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        let cur = 0;
        setOdo(num, '01', { instant: true });
        gsap.set(steps, { autoAlpha: 0 });
        gsap.set(steps[0], { autoAlpha: 1 });
        bars.forEach((b, i) => b.classList.toggle('is-on', i === 0));
        const go = (i) => {
          if (i === cur) return;
          const dir = i > cur ? 1 : -1;
          const prev = steps[cur];
          cur = i;
          gsap.to(prev.children, { yPercent: -60 * dir, autoAlpha: 0, duration: 0.45, ease: 'power3.in', stagger: 0.03, overwrite: true, onComplete: () => gsap.set(prev, { autoAlpha: 0 }) });
          gsap.set(steps[i], { autoAlpha: 1 });
          gsap.fromTo(steps[i].children, { yPercent: 70 * dir, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.85, ease: OUT, stagger: 0.06, delay: 0.2, overwrite: true });
          setOdo(num, String(i + 1).padStart(2, '0'), { dur: 0.9 });
          bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
          // the desk moves on: the old picture leaves on the 14° slant while the next sweeps in and settles
          if (pics.length) {
            const was = pics[steps.indexOf(prev)];
            if (was) gsap.to(was, { clipPath: slantFrom(-dir), scale: 0.96, autoAlpha: 0, duration: 0.6, ease: 'power3.in', overwrite: true });
            gsap.fromTo(pics[i], { clipPath: slantFrom(dir), scale: 1.04, autoAlpha: 1 },
              { clipPath: SLANT_OPEN, scale: 1, autoAlpha: 1, duration: 0.85, ease: EASE, delay: 0.1, overwrite: true });
          }
        };
        const st = ScrollTrigger.create({
          trigger: sec, start: 'top top', end: () => '+=' + innerHeight * (steps.length - 0.4) * 0.75,
          pin: stage, pinSpacing: true, anticipatePin: 1,
          onUpdate: (s) => go(Math.min(steps.length - 1, Math.floor(s.progress * steps.length * 0.999))),
        });
        return () => { st.kill(); float.kill(); gsap.set(pics, { clearProps: 'all' }); sec.classList.remove('is-pinned-process'); gsap.set(steps, { clearProps: 'all' }); steps.forEach((s) => gsap.set(s.children, { clearProps: 'all' })); };
      });
    });
  }


  /* ------------------------------------------------------------------------
     Works as ledger rows; the portfolio filter reflows them with Flip.
     ------------------------------------------------------------------------ */
  function works() {
    $$('[data-works]').forEach((grid) => {
      const items = $$('.work', grid);
      const bar = d.querySelector(`[data-filter-for="${grid.id}"]`);
      if (!bar) return;
      const btns = $$('button', bar);
      btns.forEach((b) => b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const cat = b.dataset.filter;
        const state = Flip.getState(items);
        let n = 0;
        items.forEach((it) => {
          const on = cat === 'all' || it.dataset.cat === cat;
          it.hidden = !on;
          if (on) it.dataset.alt = String(n++ % 2);
        });
        if (RM) { ScrollTrigger.refresh(); return; }
        Flip.from(state, {
          duration: 0.8, ease: EASE, absolute: true, nested: true,
          onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: OUT }),
          onLeave: (els) => gsap.to(els, { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power3.in' }),
          onComplete: () => ScrollTrigger.refresh(),
        });
        const live = d.getElementById(grid.id + '-live');
        if (live) live.textContent = `แสดง ${n} ผลงาน`;
      }));
    });
  }

  /* ------------------------------------------------------------------------
     Console in the room: tabs rotate, scroll dollies the camera out
     ------------------------------------------------------------------------ */
  function consoleSec() {
    const sec = $('[data-console]');
    if (!sec) return;
    const tabs = $$('[role="tab"]', sec);
    const panels = $$('.cpanel', sec);
    let cur = 0;
    let timer = null;
    let pausedUntil = 0;
    const select = (i, user) => {
      cur = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => p.classList.toggle('is-on', k === i));
      if (MOTION) {
        const p = panels[i];
        gsap.fromTo($$('.cpanel__value, .cpanel__stat b, .cpanel__text', p), { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: OUT, stagger: 0.04 });
        gsap.fromTo($$('.cpanel__bars i', p), { scaleY: 0 }, { scaleY: (k, el) => +el.dataset.h || 1, duration: 0.9, ease: OUT, stagger: 0.04 });
        gsap.fromTo($$('.cpanel__meter i', p), { scaleX: 0 }, { scaleX: (k, el) => +el.dataset.w || 1, duration: 1.1, ease: OUT, stagger: 0.08 });
      } else {
        $$('.cpanel__bars i', panels[i]).forEach((el) => { el.style.transform = `scaleY(${el.dataset.h || 1})`; });
        $$('.cpanel__meter i', panels[i]).forEach((el) => { el.style.transform = `scaleX(${el.dataset.w || 1})`; });
      }
      if (user) pausedUntil = performance.now() + 12000;
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, true));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
          tabs[n].focus(); select(n, true);
        }
      });
    });
    select(0);
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting && MOTION) timer = setInterval(() => { if (performance.now() > pausedUntil) select((cur + 1) % tabs.length); }, 4000);
    }).observe(sec);

    if (!MOTION) return;
    mm.add('(min-width: 992px)', () => {
      const room = $('.room', sec);
      const SX = 0.3832; const SY = 0.33264; const SW = 0.23438; const SH = 0.24306;
      const vals = () => {
        const rw = room.offsetWidth; const rh = room.offsetHeight;
        const s0 = Math.min(innerWidth / (rw * SW), innerHeight / (rh * SH)) * 0.94;
        const ox = rw * (SX + SW / 2) - rw / 2; const oy = rh * (SY + SH / 2) - rh / 2;
        return { s0, ox, oy };
      };
      gsap.set(room, { xPercent: -50, yPercent: -50, x: 0, y: 0, transformOrigin: `${(SX + SW / 2) * 100}% ${(SY + SH / 2) * 100}%`, force3D: false });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
      });
      tl.fromTo(room, { scale: () => vals().s0, x: () => -vals().ox, y: () => -vals().oy }, { scale: 1, x: 0, y: 0, ease: 'power2.inOut', duration: 1, force3D: false }, 0)
        .fromTo($('.console-sec__copy', sec), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out' }, 0.72);
      return () => gsap.set(room, { clearProps: 'all' });
    });
  }

  /* ------------------------------------------------------------------------
     Pricing: 20% switch rolls the prices
     ------------------------------------------------------------------------ */
  const baht = (n) => '฿' + Number(n).toLocaleString('en-US');
  function pricing() {
    $$('[data-discount]').forEach((sw) => {
      const wrap = d.getElementById(sw.getAttribute('aria-controls'));
      if (!wrap) return;
      const prices = $$('[data-sale]', wrap);
      prices.forEach((p) => setOdo(p, baht(p.dataset.sale), { instant: true }));
      sw.addEventListener('click', () => {
        const on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        wrap.classList.toggle('is-full', !on);
        prices.forEach((p) => setOdo(p, baht(on ? p.dataset.sale : p.dataset.full), { dur: 1.1, stagger: 0.06 }));
      });
    });
  }

  /* ------------------------------------------------------------------------
     FAQ: details with measured height animation
     ------------------------------------------------------------------------ */
  function faq() {
    $$('.faq details').forEach((det) => {
      const sum = $('summary', det);
      const body = $('.faq__a', det);
      if (!sum || !body) return;
      sum.addEventListener('click', (e) => {
        if (RM) return;
        e.preventDefault();
        if (det.open) {
          gsap.to(body, { height: 0, paddingBottom: 0, duration: 0.45, ease: EASE, onComplete: () => { det.open = false; gsap.set(body, { clearProps: 'height,paddingBottom' }); ScrollTrigger.refresh(); } });
        } else {
          det.open = true;
          gsap.from(body, { height: 0, paddingBottom: 0, duration: 0.6, ease: EASE, onComplete: () => ScrollTrigger.refresh() });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Forms: validate, post to data-endpoint, or hand off to email
     ------------------------------------------------------------------------ */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function forms() {
    $$('form[data-form]').forEach((form) => {
      const status = $('.form__status', form);
      const say = (msg) => { if (!status) return; status.textContent = msg; status.classList.add('is-on'); };
      form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if ($('.hp input', form) && $('.hp input', form).value) return;
        let first = null;
        $$('[data-required]', form).forEach((inp) => {
          const field = inp.closest('.field');
          const val = inp.value.trim();
          const bad = !val || (inp.type === 'email' && !EMAIL.test(val));
          field.classList.toggle('is-invalid', bad);
          if (bad && !first) first = inp;
        });
        $$('input[type="email"]:not([data-required])', form).forEach((inp) => {
          const field = inp.closest('.field');
          const bad = inp.value.trim() && !EMAIL.test(inp.value.trim());
          field.classList.toggle('is-invalid', !!bad);
          if (bad && !first) first = inp;
        });
        if (first) { first.focus(); say('กรุณาตรวจสอบช่องที่ทำเครื่องหมายไว้ แล้วส่งอีกครั้ง'); return; }
        const data = {};
        $$('[name]', form).forEach((inp) => { if (inp.name !== 'website' && inp.value.trim()) data[inp.name] = inp.value.trim(); });
        const endpoint = form.dataset.endpoint;
        if (endpoint) {
          form.classList.add('is-sending');
          say('กำลังส่งข้อมูล…');
          try {
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const body = await res.json().catch(() => null);
            if (!res.ok) {
              // API validation / rate-limit messages are written for people; show the first one
              const m = body && (Array.isArray(body.message) ? body.message[0] : body.message);
              throw new Error(typeof m === 'string' && m ? m : '');
            }
            form.reset();
            // a coupon typed into the register form comes back checked: say whether it applied
            const coupon = body && body.coupon && body.coupon.message ? ` · ${body.coupon.message}` : '';
            say((form.dataset.success || 'ส่งเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง') + coupon);
          } catch (err) {
            say(err && err.message ? `ส่งไม่สำเร็จ: ${err.message}` : 'ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรืออีเมลถึง support@pmndigital.co');
          } finally { form.classList.remove('is-sending'); }
          return;
        }
        const labels = {};
        $$('label[for]', form).forEach((l) => { labels[l.htmlFor] = l.textContent.replace('*', '').trim(); });
        const lines = Object.entries(data).map(([k, v]) => {
          const inp = form.elements[k];
          return `${(inp && labels[inp.id]) || k}: ${v}`;
        });
        const href = `mailto:support@pmndigital.co?subject=${encodeURIComponent(form.dataset.subject || 'ติดต่อจากเว็บไซต์ PMN Digital')}&body=${encodeURIComponent(lines.join('\n'))}`;
        location.href = href;
        say('เปิดโปรแกรมอีเมลของคุณพร้อมข้อมูลแล้ว กดส่งในอีเมลเพื่อให้ถึงทีม PMN — หรือเขียนถึง support@pmndigital.co โดยตรง');
      });
    });
  }

  /* ------------------------------------------------------------------------
     Cursor pill over linked cards
     ------------------------------------------------------------------------ */
  function cursor() {
    const cur = $('.cursor');
    if (!cur || !FINE || !MOTION) return;
    const inner = $('.cursor__in', cur);
    gsap.set(inner, { scale: 0 });
    html.classList.add('has-cursor');
    const label = $('.cursor__label', cur);
    let mx = innerWidth / 2; let my = innerHeight / 2; let cx = mx; let cy = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    gsap.ticker.add(() => { cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12; gsap.set(cur, { x: cx, y: cy }); });
    d.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (!t || t.contains(e.relatedTarget)) return;
      label.textContent = t.dataset.cursor;
      gsap.to(inner, { scale: 1, duration: 0.45, ease: OUT, overwrite: true });
    });
    d.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (!t || t.contains(e.relatedTarget)) return;
      gsap.to(inner, { scale: 0, duration: 0.38, ease: 'power3.in', overwrite: true });
    });
  }

  /* ------------------------------------------------------------------------
     Videos: play while visible (cards on hover with a fine pointer)
     ------------------------------------------------------------------------ */
  function videos() {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting && !RM) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.25 });
    $$('video[data-autoplay]').forEach((v) => io.observe(v));
    $$('video[data-hoverplay]').forEach((v) => {
      if (!FINE) { io.observe(v); return; }
      const host = v.closest('a, article') || v;
      host.addEventListener('pointerenter', () => { if (!RM) v.play().catch(() => {}); });
      host.addEventListener('pointerleave', () => v.pause());
    });
  }

  /* ------------------------------------------------------------------------
     Blog index: filters, sort, and the floating cover preview
     ------------------------------------------------------------------------ */
  function blogIndex() {
    const list = $('[data-index]');
    if (!list) return;
    const rows = $$('.index__row', list);
    const empty = $('.index__empty', list);
    let cat = 'all';
    let sort = 'new';
    const apply = () => {
      const state = MOTION ? Flip.getState(rows) : null;
      const sorted = rows.slice().sort((a, b) => (sort === 'new' ? b.dataset.date.localeCompare(a.dataset.date) : +b.dataset.views - +a.dataset.views));
      sorted.forEach((r) => { r.hidden = !(cat === 'all' || r.dataset.cat === cat); list.append(r); });
      if (empty) list.append(empty);
      const shown = rows.filter((r) => !r.hidden).length;
      if (empty) empty.hidden = shown > 0;
      const live = $('#index-live');
      if (live) live.textContent = `${shown} บทความ`;
      if (state) Flip.from(state, { duration: 0.7, ease: EASE, onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }), onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.3 }), onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
    };
    $$('[data-cat-filter]').forEach((b) => b.addEventListener('click', () => {
      $$('[data-cat-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cat = b.dataset.catFilter; apply();
    }));
    $$('[data-sort]').forEach((b) => b.addEventListener('click', () => {
      $$('[data-sort]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      sort = b.dataset.sort; apply();
    }));

    const pv = $('.preview');
    if (!pv || !FINE || !MOTION) return;
    const pimg = $('img', pv); const pvid = $('video', pv);
    let mx = 0; let my = 0; let x = 0; let y = 0; let on = false;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    gsap.ticker.add(() => { if (!on) return; x += (mx - x) * 0.14; y += (my - y) * 0.14; gsap.set(pv, { x: x + 28, y: y - pv.offsetHeight / 2 }); });
    rows.forEach((r) => r.addEventListener('pointerenter', () => {
      const vsrc = r.dataset.video; const isrc = r.dataset.img;
      if (vsrc) { pimg.hidden = true; pvid.hidden = false; if (pvid.getAttribute('src') !== vsrc) pvid.src = vsrc; pvid.play().catch(() => {}); }
      else { pvid.pause(); pvid.hidden = true; pimg.hidden = false; pimg.src = isrc; }
      if (!on) { x = mx; y = my; }
      on = true;
      gsap.to(pv, { autoAlpha: 1, scale: 1, duration: 0.5, ease: OUT, overwrite: 'auto' });
    }));
    const hide = () => { if (!on) return; on = false; pvid.pause(); gsap.to(pv, { autoAlpha: 0, scale: 0.6, duration: 0.35, ease: 'power3.in', overwrite: 'auto' }); };
    list.addEventListener('pointerleave', hide);
    // scrolling can carry the list away from a still pointer: hide unless the pointer is still over a row
    addEventListener('scroll', () => { if (on) { const el = d.elementFromPoint(mx, my); if (!el || !list.contains(el)) hide(); } }, { passive: true });
    new IntersectionObserver(([en]) => { if (!en.isIntersecting) hide(); }).observe(list);
  }

  /* ------------------------------------------------------------------------
     Article: reading progress + scroll-to-advance into the next article
     ------------------------------------------------------------------------ */
  function article() {
    const prog = $('[data-progress] i');
    const main = $('.art-main');
    if (prog && main) {
      gsap.to(prog, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: main, start: 'top 30%', end: 'bottom 70%', scrub: true } });
    }
    const next = $('[data-next]');
    if (!next || !FINE || !MOTION) return;
    const bar = $('.next__bar i', next);
    const TARGET = 2600;
    let acc = 0; let shown = 0; let gone = false;
    const atBottom = () => (lenis ? lenis.scroll >= lenis.limit - 2 : innerHeight + scrollY >= html.scrollHeight - 2);
    addEventListener('wheel', (e) => {
      if (gone) return;
      if (atBottom() && e.deltaY > 0) acc = Math.min(TARGET, acc + e.deltaY);
      else if (e.deltaY < 0) acc = 0;
    }, { passive: true });
    gsap.ticker.add(() => {
      if (gone) return;
      if (!atBottom()) acc = Math.max(0, acc - 40);
      shown += (acc / TARGET - shown) * 0.12;
      gsap.set(bar, { scaleX: shown });
      if (shown > 0.999) { gone = true; leave(next.href); }
    });
  }

  /* ------------------------------------------------------------------------
     Status bars and footer wordmark (letters lean further into the italic on hover)
     ------------------------------------------------------------------------ */
  function statusBars() {
    $$('.bars').forEach((b) => {
      if (!MOTION) return;
      const bars = $$('i', b);
      gsap.set(bars, { scaleY: 0 });
      onEnter(b, () => gsap.to(bars, { scaleY: 1, duration: 0.8, ease: OUT, stagger: { each: 0.008, from: 'start' } }), 'top 92%');
    });
  }
  function footerMark() {
    $$('.footer__mark svg').forEach((svg) => {
      const letters = $$('path', svg);
      if (MOTION) {
        gsap.set(letters, { y: 620, x: -620 * SL, visibility: 'visible' });
        onEnter(svg, () => gsap.to(letters, { y: 0, x: 0, duration: 1.1, ease: EASE, stagger: 0.12, delay: 0.15 }), 'top 98%');
      } else gsap.set(letters, { visibility: 'visible' });
      if (!FINE || !MOTION) return;
      letters.forEach((p) => {
        let busy = false;
        // each letter leans from its foot; the svg does not clip, so N's head may swing out past the screen edge
        const origin = '50% 100%';
        p.addEventListener('pointerenter', () => {
          if (busy) return;
          busy = true;
          gsap.timeline({ onComplete: () => { busy = false; } })
            .to(p, { skewX: -12, transformOrigin: origin, duration: 0.35, ease: OUT })
            .to(p, { skewX: 0, duration: 0.7, ease: EASE });
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Year, refresh hooks, boot
     ------------------------------------------------------------------------ */
  function misc() {
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    const refresh = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 150); }; })();
    $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
    $$('video').forEach((v) => v.addEventListener('loadedmetadata', refresh, { once: true }));
  }

  async function boot() {
    const fontsReady = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    await fontsReady;
    nav();
    sheets();
    rotWords();
    logoFlight();
    reveals();
    parallax();
    figures();
    clients();
    spot();
    reel();
    abacus();
    whySec();
    chat();
    chaos();
    process();
    works();
    consoleSec();
    pricing();
    faq();
    forms();
    cursor();
    videos();
    blogIndex();
    article();
    statusBars();
    footerMark();
    misc();
    minimap();
    html.classList.remove('anim');
    ScrollTrigger.refresh();

    const hash = location.hash && d.getElementById(decodeURIComponent(location.hash.slice(1)));
    const intro = loader();
    if (intro) await intro;
    else if (!enter()) releaseIntro();
    if (hash) setTimeout(() => scrollToEl(hash), introDone ? 300 : 900);
  }
  boot();
})();
