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
      if (html.classList.contains('home') && MOTION) {
        mark.classList.add('is-hidden');
        ScrollTrigger.create({
          start: () => innerHeight * 0.1, end: 'max',
          onEnter: () => mark.classList.remove('is-hidden'),
          onLeaveBack: () => mark.classList.add('is-hidden'),
        });
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
     Hero: the PMN wordmark is a glass of water over the IT city. The page
     opens on a white veil (the city film shows through it at 25%) with the
     letters as faint empty glass; water then rises inside them to near the
     brim, its surface rolling in soft, slow swells, the city clear beneath.
     Scrolling down lets the water go down little by little.
     Canvas 2D: the veil, minus the letters faintly, minus the water fully.
     ------------------------------------------------------------------------ */
  function hero() {
    const sec = $('[data-hero]');
    if (!sec) return;
    const wm = $$('.hero__mark .wm-l', sec);
    if (MOTION && wm.length) {
      gsap.set(wm, { y: 620, x: -620 * SL, visibility: 'visible' });
      whenReady(() => gsap.to(wm, { y: 0, x: 0, duration: 1.3, ease: EASE, stagger: 0.12, delay: 0.1 }));
    } else {
      gsap.set(wm, { visibility: 'visible' });
    }
    if (!MOTION) return;
    const canvas = $('.hero__paper', sec);
    const video = $('video', sec);
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;
    html.classList.add('has-paper');

    const water = { level: 0, amp: 0 }; // level: share of the letters' height under water
    let dpr = 1; let visible = true; let out = 0; let drain = 0;
    const vessel = $('.glass-wm', sec);
    const shapes = vessel ? $$('.wm-rim', vessel).map((p) => new Path2D(p.getAttribute('d'))) : [];
    let letters = null; let lx = 0; let ly = 0; let lw = 0; let lh = 0;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(sec.clientWidth * dpr); canvas.height = Math.round(sec.clientHeight * dpr);
      if (vessel && shapes.length) {
        // the vessel box is exactly the letters' box, so the outlines map onto the canvas one to one
        const s = sec.getBoundingClientRect(); const r = vessel.getBoundingClientRect();
        lx = r.left - s.left; ly = r.top - s.top; lw = r.width; lh = r.height;
        const k = lw / 1612;
        const m = new DOMMatrix([k, 0, 0, k, lx - 243 * k, ly - 139 * k]);
        letters = new Path2D();
        shapes.forEach((p) => letters.addPath(p, m));
      }
    };

    const TAU = Math.PI * 2;
    const wave = (base, A, t) => {
      // a soft surface: three long, slow sine swells (1.6, 3.5 and 6.8 across the word), no sharp crests
      ctx.beginPath();
      ctx.moveTo(lx - 16, ly + lh + 4);
      for (let x = lx - 16; x <= lx + lw + 16; x += 8) {
        const u = (x - lx) / lw;
        ctx.lineTo(x, base - A * (Math.sin(u * TAU * 1.6 + t * 0.9) * 0.6 + Math.sin(u * TAU * 3.5 - t * 1.3 + 1.3) * 0.28 + Math.sin(u * TAU * 6.8 + t * 1.8 + 2.7) * 0.12));
      }
      ctx.lineTo(lx + lw + 16, ly + lh + 4);
      ctx.closePath();
      ctx.fill();
    };
    const tick = () => {
      if (!visible) return;
      const t = performance.now() / 1000;
      drain += (out - drain) * 0.08; // the water follows the scroll a little behind, so it settles rather than jumps
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // the veil is translucent, so each frame starts clean
      ctx.fillStyle = 'rgba(255, 255, 255, .75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // the logo flight hides the wordmark while it travels: the glass leaves with it
      if (!letters || vessel.style.opacity === '0') return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.clip(letters, 'evenodd');
      // the empty glass: the letters read faintly even above the water
      ctx.globalAlpha = 0.22;
      ctx.fillRect(lx - 16, ly - 16, lw + 32, lh + 32);
      const fill = water.level * (1 - drain);
      if (fill > 0.002) {
        const base = ly + lh - fill * lh;
        const A = lh * 0.04 * water.amp * Math.min(1, fill * 4); // calmer as the glass runs dry
        ctx.globalAlpha = 0.5; // a softer swell just behind the surface
        wave(base - A * 0.6, A, t + 1.9);
        ctx.globalAlpha = 1;
        wave(base, A, t);
        // the water itself: a pale blue just under the surface, fading with depth
        ctx.globalCompositeOperation = 'source-over';
        const tint = ctx.createLinearGradient(0, base - A, 0, base + lh * 0.4);
        tint.addColorStop(0, 'rgba(160, 215, 255, .32)');
        tint.addColorStop(1, 'rgba(160, 215, 255, 0)');
        ctx.fillStyle = tint;
        wave(base, A, t);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    size();
    new ResizeObserver(size).observe(sec); // the hero grows when the full-width wordmark needs the room
    ScrollTrigger.addEventListener('refresh', size);
    gsap.ticker.add(tick);
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (video) { if (visible) video.play().catch(() => {}); else video.pause(); }
    }).observe(sec);
    // the water is all gone by the time the logo flight lifts the wordmark off (or once the hero has mostly gone)
    const lift = $('.reel-sec__statement');
    ScrollTrigger.create({ trigger: sec, start: 'top top', ...(lift ? { endTrigger: lift, end: 'top 92%' } : { end: 'bottom 35%' }),
      onUpdate: (st) => { out = st.progress; } });

    // the opening: the water rises inside the letters to near the brim, then its swells settle
    whenReady(() => {
      gsap.timeline({ delay: 0.9, onStart: size })
        .to(water, { amp: 1, duration: 1, ease: 'power1.out' }, 0)
        .to(water, { level: 0.8, duration: 2.4, ease: 'power2.inOut' }, 0)
        .to(water, { amp: 0.75, duration: 1.2, ease: 'power1.inOut' }, 2.2);
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
    let dur = video.duration || 5;
    let want = 0; let applied = -1; let shown = -1; let lastT = -1;
    const seek = () => {
      if (video.readyState < 1 || video.seeking || Math.abs(want - applied) < 0.03) return;
      applied = want;
      try { video.currentTime = want; } catch (e) { /* not seekable yet */ }
    };
    video.addEventListener('seeked', seek);
    video.addEventListener('loadedmetadata', () => { dur = video.duration || dur; applied = -1; lastT = -1; });
    // a streamed film is only seekable when the server honours byte ranges (the local preview does not);
    // a copy in memory can always be scrubbed, so fetch it once the section is near
    let fetched = false;
    const load = () => {
      if (fetched || !window.fetch || !window.URL) return;
      fetched = true;
      fetch(video.currentSrc || video.src).then((r) => (r.ok ? r.blob() : Promise.reject(r.status))).then((blob) => {
        video.src = URL.createObjectURL(blob);
        video.load();
        // touch browsers only paint seeked frames of a film that has played once
        if (!FINE) video.addEventListener('loadeddata', () => { video.play().then(() => { video.pause(); applied = -1; lastT = -1; }).catch(() => {}); }, { once: true });
      }).catch(() => { fetched = false; });
    };
    ScrollTrigger.create({ trigger: sec, start: 'top bottom+=150%', once: true, onEnter: load });

    // the film is full-bleed behind the grid: it covers a landscape screen; on a portrait screen it is a band
    // just wider than the screen (the whole cast and the dashboard stay in view), framed by data-focus
    // (0..1 across the film), its top and bottom feathered into a cobalt ground sampled from the film
    const film = { top: 0, h: 0, band: false };
    const focus = parseFloat(video.dataset.focus) || 0.5;
    const fit = () => {
      const W = sticky.clientWidth; const H = sticky.clientHeight; const ar = 16 / 9;
      film.band = W / H < 0.9;
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
      box.classList.toggle('is-band', film.band);
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
      .fromTo(video, { scale: 1.12 }, { scale: 1, ease: 'power1.out', duration: 0.62 }, 0.06)
      .to(proxy, { t: 1, ease: 'none', duration: 0.76 }, 0.1)
      // the caption ends up over the cobalt film, so its quiet greys turn white
      .to(quiet, { color: '#fff', ease: 'none', duration: 0.16 }, 0.16)
      .to(rule, { borderTopColor: 'rgba(255,255,255,.45)', ease: 'none', duration: 0.16 }, 0.16)
      .to({}, { duration: 0.14 });
    // PMN arrives as the film turns: the rubber stamp drops, presses the white PMN mark onto the scene and lifts away
    const stamp = $('.reel__stamp', sec);
    if (stamp) {
      const tool = $('.reel__stamp-tool', stamp); const print = $('.reel__stamp-print', stamp);
      // the engineers walk in about a quarter of the way through the film; the stamp lands with them
      tl.fromTo(tool, { autoAlpha: 0, yPercent: -160 }, { autoAlpha: 1, yPercent: 0, ease: 'power2.in', duration: 0.07 }, 0.22)
        .fromTo(print, { autoAlpha: 0, scale: 1.3, rotate: -12 }, { autoAlpha: 1, scale: 1, rotate: -6, ease: EASE, duration: 0.035 }, 0.29)
        .to(tool, { yPercent: -180, autoAlpha: 0, ease: 'power2.out', duration: 0.08 }, 0.32)
        // the mark lifts away before the camera pushes into the dashboard, so it never covers the system it introduced
        .to(print, { autoAlpha: 0, scale: 0.92, ease: 'power1.in', duration: 0.05 }, 0.54);
    }
    // the film follows the proxy every frame rather than from tween callbacks, because a ScrollTrigger
    // refresh (fonts, images) restores the timeline silently and would leave the film on its first frame
    gsap.ticker.add(() => {
      if (proxy.t === lastT) return;
      lastT = proxy.t;
      want = Math.min(dur - 0.04, proxy.t * dur);
      seek();
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
     Logo flight (home): as the reel statement scrolls up, the hero's giant
     PMN wordmark lifts off the paper, shrinks and flies down along the scroll
     into the statement in place of the word "PMN"; scrolling back sends it
     home. The small nav mark stays hidden until the statement has gone by. Without motion the statement shows the logo
     where the word was.
     ------------------------------------------------------------------------ */
  function logoFlight() {
    const host = $('.reel-sec__statement');
    const mark = $('.nav__mark');
    const big = $('.hero__mark svg');
    if (!MOTION || !host || !big || !host.querySelector('.pmn-slot')) return;
    host.classList.add('logo-fly');
    const flyer = mk('div', 'logo-flyer');
    flyer.setAttribute('aria-hidden', 'true');
    flyer.innerHTML = host.querySelector('.pmn-slot').innerHTML;
    d.body.appendChild(flyer);
    const vb = big.viewBox.baseVal; const AR = vb.width / vb.height;
    // the letters inside the hero svg: it keeps their aspect and anchors them bottom-left (xMinYMax meet)
    const letters = () => {
      const r = big.getBoundingClientRect();
      const w = Math.min(r.width, r.height * AR); const h = w / AR;
      return { left: r.left, top: r.bottom - h, height: h };
    };
    let p = 0; let past = false;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
    const render = () => {
      const slot = host.querySelector('.pmn-slot svg'); // looked up each time: SplitText rebuilds the heading
      const flying = p > 0.001 && p < 0.999;
      // the small nav mark waits until the statement has gone by; the hero wordmark itself is what travels
      if (mark) mark.classList.toggle('is-away', !past);
      (big.closest('.glass-wm') || big).style.opacity = p > 0.001 ? '0' : ''; // opacity, not visibility: the letters carry their own visibility from the intro
      host.classList.toggle('logo-landed', p >= 0.999);
      flyer.style.display = flying && slot ? 'block' : 'none';
      flyer.style.opacity = String(Math.min(1, p / 0.15)); // the ink logo forms as the emptied window lifts off
      if (!flying || !slot) return;
      const a = letters(); const b = slot.getBoundingClientRect();
      if (!b.height || !a.height) return;
      const e = ease(p);
      const h = a.height + (b.height - a.height) * e;
      // ink follows the ground under it: black while over the white paper, white once over the dark statement
      const y = a.top + (b.top - a.top) * e; const heroEdge = big.closest('[data-hero]').getBoundingClientRect().bottom;
      flyer.style.color = y + h / 2 < heroEdge ? getComputedStyle(big).color : getComputedStyle(host).color;
      flyer.style.width = `${b.width}px`; flyer.style.height = `${b.height}px`;
      flyer.style.transform = `translate(${a.left + (b.left - a.left) * e}px, ${y}px) scale(${h / b.height})`;
    };
    ScrollTrigger.create({ trigger: host, start: 'top 92%', end: 'top 36%', onUpdate: (st) => { p = st.progress; render(); }, onRefresh: (st) => { p = st.progress; render(); } });
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
      mm.add('(min-width: 992px)', () => {
        const stage = $('.process__stage', sec);
        const steps = $$('.step', sec);
        const num = $('.process__num', sec);
        const bars = $$('.process__bar span', sec);
        sec.classList.add('is-pinned-process');
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
        };
        const st = ScrollTrigger.create({
          trigger: sec, start: 'top top', end: () => '+=' + innerHeight * (steps.length - 0.4) * 0.75,
          pin: stage, pinSpacing: true, anticipatePin: 1,
          onUpdate: (s) => go(Math.min(steps.length - 1, Math.floor(s.progress * steps.length * 0.999))),
        });
        return () => { st.kill(); sec.classList.remove('is-pinned-process'); gsap.set(steps, { clearProps: 'all' }); steps.forEach((s) => gsap.set(s.children, { clearProps: 'all' })); };
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
        p.addEventListener('pointerenter', () => {
          if (busy) return;
          busy = true;
          gsap.timeline({ onComplete: () => { busy = false; } })
            .to(p, { skewX: -12, transformOrigin: '50% 100%', duration: 0.35, ease: OUT })
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
    rotWords();
    logoFlight();
    reveals();
    parallax();
    figures();
    clients();
    hero();
    reel();
    abacus();
    whySec();
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
