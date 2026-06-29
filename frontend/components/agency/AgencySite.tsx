'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, Fragment } from 'react';
import { mergeHome } from '@/lib/home-content';
import { submitLeadAction } from '@/lib/cms-actions';
import { ArticlesCarousel } from './ArticlesCarousel';
import type { Article } from '@/lib/cms';

/* Parse an inline CSS declaration string ("a:b;c:d") into a React style object. */
function css(s: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    o[prop.replace(/-([a-z])/g, (_m, x: string) => x.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return o as CSSProperties;
}

/* Render a string that may contain <br> into React nodes. */
function ml(text: string) {
  const parts = text.split(/<br\s*\/?>/i);
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 && <br />}
    </Fragment>
  ));
}

const fmt = (n: number) => '฿' + n.toLocaleString('en-US');
const MONO = "font-family:'IBM Plex Mono',monospace";

const SVC_ICON = '#60A5FA';
function ServiceIcon({ kind }: { kind: string }) {
  if (kind === 'db') return (
    <span style={css('display:flex;flex-direction:column;gap:3px')}>
      <span style={css(`width:20px;height:6px;border:1.6px solid ${SVC_ICON};border-radius:4px`)} />
      <span style={css(`width:20px;height:6px;border:1.6px solid ${SVC_ICON};border-radius:4px;opacity:.7`)} />
      <span style={css(`width:20px;height:6px;border:1.6px solid ${SVC_ICON};border-radius:4px;opacity:.45`)} />
    </span>
  );
  if (kind === 'erp') return (
    <span style={css('display:grid;grid-template-columns:1fr 1fr;gap:3px')}>
      {[0, 1, 2, 3].map((i) => <span key={i} style={css(`width:8px;height:8px;border:1.6px solid ${SVC_ICON};border-radius:2px`)} />)}
    </span>
  );
  if (kind === 'crm') return (
    <span style={css('display:flex;align-items:center;gap:4px')}>
      <span style={css(`width:11px;height:11px;border-radius:50%;background:${SVC_ICON}`)} />
      <span style={css(`width:9px;height:9px;border-radius:50%;border:1.6px solid ${SVC_ICON}`)} />
      <span style={css(`width:7px;height:7px;border-radius:50%;border:1.6px solid ${SVC_ICON};opacity:.6`)} />
    </span>
  );
  return <span style={css(`width:16px;height:16px;border:1.6px solid ${SVC_ICON};transform:rotate(45deg);border-radius:3px`)} />;
}

const SOCIAL_GLYPHS: { key: string; label: string; d: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { key: 'facebook', label: 'Facebook', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { key: 'x', label: 'X', d: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  { key: 'instagram', label: 'Instagram', d: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z' },
];

const STYLE = `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@keyframes fadeUp{from{transform:translateY(26px)}to{transform:none}}
@keyframes fadeIn{from{transform:translateY(-10px)}to{transform:none}}
@keyframes popIn{0%{transform:scale(.94)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
@keyframes driftA{0%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,-40px) scale(1.12)}100%{transform:translate(0,0) scale(1)}}
@keyframes driftB{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-70px,50px) scale(1.18)}100%{transform:translate(0,0) scale(1)}}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(13px)}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes pulseDot{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
@keyframes sweep{0%{left:-60%}100%{left:150%}}
@keyframes growBar{from{transform:scaleY(.12)}to{transform:scaleY(1)}}
.ag-root ::selection{background:#2563EB;color:#fff}
.agP{transition:transform .15s,box-shadow .2s,background .2s}
.agP:hover{background:#3B82F6 !important;transform:translateY(-2px)}
.agG{transition:background .2s,border-color .2s}
.agG:hover{background:rgba(255,255,255,.09) !important;border-color:rgba(255,255,255,.3) !important}
.agCard{transition:transform .25s,border-color .25s,background .25s}
.agCard:hover{transform:translateY(-4px);border-color:rgba(37,99,235,.4) !important;background:rgba(37,99,235,.06) !important}
.agMore{transition:transform .25s,border-color .25s}
.agMore:hover{transform:translateY(-5px);border-color:rgba(37,99,235,.4) !important}
.agWork{transition:transform .25s,border-color .25s}
.agWork:hover{transform:translateY(-6px);border-color:rgba(37,99,235,.4) !important}
.agLink{transition:color .2s}
.agLink:hover{color:#fff !important}
.agInp{transition:border-color .2s}
.agInp:focus{border-color:#2563EB !important}
.agNav:hover{color:#EAEEF6 !important}
.agSoc{transition:background .2s,color .2s,border-color .2s}
.agSoc:hover{background:#2563EB !important;color:#fff !important;border-color:#2563EB !important}
@media (max-width:980px){
  [data-hero-grid]{grid-template-columns:1fr !important;gap:34px !important}
  [data-sec-head]{grid-template-columns:1fr !important;gap:16px !important}
  [data-svc-grid]{grid-template-columns:repeat(2,1fr) !important}
  [data-stats-grid]{grid-template-columns:repeat(2,1fr) !important;gap:30px 16px !important}
  [data-process]{grid-template-columns:repeat(2,1fr) !important}
  [data-bento]{grid-template-columns:1fr 1fr !important}
  [data-work-grid]{grid-template-columns:repeat(2,1fr) !important}
  [data-pricing-mini]{grid-template-columns:1fr !important;max-width:440px;margin-left:auto;margin-right:auto}
  [data-price-grid]{grid-template-columns:1fr !important;max-width:440px;margin-left:auto;margin-right:auto}
  [data-reg-grid]{grid-template-columns:1fr !important;gap:30px !important}
  [data-quotes]{grid-template-columns:1fr !important}
  [data-portfolio-grid]{grid-template-columns:repeat(2,1fr) !important}
  [data-contact-grid]{grid-template-columns:1fr !important}
  [data-svc-detail]{grid-template-columns:1fr !important;gap:22px !important}
  [data-exp-grid]{grid-template-columns:1fr !important;gap:24px !important}
  [data-more-grid]{grid-template-columns:repeat(2,1fr) !important}
  [data-footer-grid]{grid-template-columns:1fr 1fr !important;gap:30px !important}
}
@media (max-width:820px){
  [data-desktop-nav]{display:none !important}
  [data-mobile-btn]{display:flex !important}
}
@media (max-width:600px){
  [data-svc-grid],[data-process],[data-bento],[data-work-grid],[data-portfolio-grid],[data-more-grid],[data-footer-grid]{grid-template-columns:1fr !important}
  [data-stats-grid]{grid-template-columns:repeat(2,1fr) !important}
}
`;

const CTA_P = 'display:inline-flex;align-items:center;gap:9px;background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 26px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)';
const CTA_G = 'display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 26px;font-size:16px;font-weight:500;cursor:pointer';
const INP = 'width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;color:#EAEEF6;font-size:14.5px;outline:none';
const CHECK = 'display:flex;gap:10px;font-size:14.5px;color:#C7D0E0';
const SERVICE_OPTS = ['ระบบฐานข้อมูล (Database)', 'ระบบ ERP', 'ระบบ CRM', 'ซอฟต์แวร์สั่งทำ (Custom)', 'อื่น ๆ / ยังไม่แน่ใจ'];

type Page = 'home' | 'services' | 'portfolio' | 'pricing' | 'contact';

interface SettingsLite {
  logoDarkUrl?: string | null;
  logoLightUrl?: string | null;
  socials?: Record<string, string> | null;
  siteName?: string;
}

export default function AgencySite({
  content,
  settings,
  articles,
}: {
  content?: unknown;
  settings?: SettingsLite | null;
  articles?: Article[];
}) {
  const c = mergeHome(content);
  const logoUrl = settings?.logoDarkUrl || '/assets/logo-white.png';
  const socials = settings?.socials || {};

  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [discount, setDiscount] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [workFilter, setWorkFilter] = useState('all');
  const [reg, setReg] = useState({ name: '', email: '', phone: '', service: SERVICE_OPTS[0], hp: '' });
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', company: '', service: SERVICE_OPTS[0], msg: '', hp: '' });
  const [cSubmitted, setCSubmitted] = useState(false);
  const [stats, setStats] = useState<number[]>(c.stats.map(() => 0));

  const progressRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const counted = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      setScrolled(y > 14);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function runCounter() {
    if (counted.current) return;
    counted.current = true;
    const targets = c.stats.map((s) => s.target);
    const dur = 1500, t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setStats(targets.map((t) => (Number.isInteger(t) ? Math.round(t * e) : +(t * e).toFixed(1))));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (mounted.current) {
      window.scrollTo(0, 0);
      if (page !== 'home') counted.current = false;
    }
    mounted.current = true;
    let io: IntersectionObserver | null = null;
    const timer = setTimeout(() => {
      const els = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
      if (!('IntersectionObserver' in window)) {
        els.forEach((el) => { if (el.hasAttribute('data-count')) runCounter(); });
        return;
      }
      io = new IntersectionObserver((entries) => {
        entries.forEach((ev) => {
          if (ev.isIntersecting) {
            const el = ev.target as HTMLElement;
            el.style.animation = 'fadeUp .7s cubic-bezier(.22,.7,.2,1) both';
            io!.unobserve(el);
            if (el.hasAttribute('data-count')) runCounter();
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach((el) => { if (!el.style.animation) io!.observe(el); });
    }, 40);
    return () => { clearTimeout(timer); if (io) io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const go = (p: Page) => { setPage(p); setMenuOpen(false); };
  const goReg = () => {
    setPage('home');
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('register');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }, 90);
  };
  const onHeroMove = (e: ReactMouseEvent) => {
    const r = heroRef.current; const v = heroVisualRef.current;
    if (!r || !v) return;
    const b = r.getBoundingClientRect();
    const cx = (e.clientX - b.left) / b.width - 0.5;
    const cy = (e.clientY - b.top) / b.height - 0.5;
    v.style.transform = `rotateY(${cx * 7}deg) rotateX(${-cy * 7}deg)`;
  };
  const onHeroLeave = () => { if (heroVisualRef.current) heroVisualRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)'; };
  const copyCoupon = () => {
    try { navigator.clipboard?.writeText(c.register.couponCode)?.catch(() => {}); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  function submitReg(e: React.FormEvent) {
    e.preventDefault();
    void submitLeadAction({ type: 'REGISTER', name: reg.name, email: reg.email, phone: reg.phone, service: reg.service, source: 'home-register', hp: reg.hp });
    setRegSubmitted(true);
    setCopied(false);
  }
  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    void submitLeadAction({ type: 'CONTACT', name: contact.name, email: contact.email, company: contact.company, service: contact.service, message: contact.msg, source: 'contact-page', hp: contact.hp });
    setCSubmitted(true);
  }

  const navStyle = (p: Page): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500, letterSpacing: '.01em',
    color: page === p ? '#EAEEF6' : '#99A3B8', padding: '8px 2px', position: 'relative',
  });
  const NAV: { p: Page; label: string }[] = [
    { p: 'home', label: 'Home' }, { p: 'services', label: 'Services' }, { p: 'portfolio', label: 'Portfolio' },
    { p: 'pricing', label: 'Pricing' }, { p: 'contact', label: 'Contact' },
  ];
  const Logo = ({ h = 30 }: { h?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={settings?.siteName || 'PMN Digital'} style={{ height: h, width: 'auto', display: 'block' }} />
  );

  const statDisplay = (i: number) => {
    const v = stats[i] ?? 0;
    return (Number.isInteger(c.stats[i].target) ? v : v.toFixed(1)) + c.stats[i].suffix;
  };

  /* ---------------- HOME ---------------- */
  const renderHome = () => (
    <div style={css('animation:fadeUp .6s cubic-bezier(.22,.7,.2,1) both')}>
      <section ref={heroRef} onMouseMove={onHeroMove} onMouseLeave={onHeroLeave} style={css('position:relative;overflow:hidden;padding:148px 24px 92px')}>
        <div style={css('position:absolute;top:-160px;left:-120px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.5),transparent 62%);filter:blur(40px);animation:driftA 17s ease-in-out infinite;pointer-events:none')} />
        <div style={css('position:absolute;top:60px;right:-160px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.32),transparent 64%);filter:blur(44px);animation:driftB 21s ease-in-out infinite;pointer-events:none')} />
        <div style={css('position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:54px 54px;-webkit-mask-image:radial-gradient(ellipse 90% 70% at 50% 35%,#000 40%,transparent 78%);mask-image:radial-gradient(ellipse 90% 70% at 50% 35%,#000 40%,transparent 78%);pointer-events:none')} />
        <div style={css('position:relative;max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center')} data-hero-grid>
          <div>
            <div style={css('display:inline-flex;align-items:center;gap:9px;padding:7px 14px;border:1px solid rgba(255,255,255,.12);border-radius:100px;background:rgba(255,255,255,.03);margin-bottom:26px;animation:fadeUp .6s .05s both')}>
              <span style={css('width:7px;height:7px;border-radius:50%;background:#38BDF8;box-shadow:0 0 10px #38BDF8;animation:pulseDot 2s infinite')} />
              <span style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase`)}>{c.hero.badge}</span>
            </div>
            <h1 style={css('margin:0 0 22px;font-size:clamp(38px,5vw,62px);line-height:1.06;letter-spacing:-.02em;font-weight:700;animation:fadeUp .6s .12s both')}>
              {c.hero.title1} <span style={css('background:linear-gradient(100deg,#60A5FA,#38BDF8);-webkit-background-clip:text;background-clip:text;color:transparent')}>{c.hero.highlight}</span> {ml(c.hero.title2)}
            </h1>
            <p style={css('margin:0 0 34px;max-width:540px;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300;animation:fadeUp .6s .2s both')}>{c.hero.subtitle}</p>
            <div style={css('display:flex;flex-wrap:wrap;gap:14px;margin-bottom:36px;animation:fadeUp .6s .28s both')}>
              <button className="agP" onClick={goReg} style={css(CTA_P)}>{c.hero.ctaPrimary}<span>→</span></button>
              <button className="agG" onClick={() => go('services')} style={css(CTA_G)}>{c.hero.ctaSecondary}</button>
            </div>
            <div style={css(`display:flex;align-items:center;gap:10px;${MONO};font-size:12.5px;color:#9FC0FF;letter-spacing:.04em;animation:fadeUp .6s .36s both`)}>{c.hero.statNote}</div>
          </div>
          <div style={css('perspective:1400px;animation:fadeUp .7s .2s both')}>
            <div ref={heroVisualRef} style={css('position:relative;transform-style:preserve-3d;transition:transform .35s cubic-bezier(.2,.7,.2,1)')}>
              <div style={css('position:relative;border-radius:20px;background:linear-gradient(160deg,rgba(20,28,48,.95),rgba(9,13,24,.95));border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 90px -30px rgba(0,0,0,.8),0 0 0 1px rgba(37,99,235,.08) inset;padding:18px;overflow:hidden')}>
                <div style={css('position:absolute;top:0;left:-60%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);animation:sweep 6s ease-in-out infinite;pointer-events:none')} />
                <div style={css('display:flex;align-items:center;justify-content:space-between;padding:4px 6px 14px;border-bottom:1px solid rgba(255,255,255,.07)')}>
                  <div style={css('display:flex;gap:7px;align-items:center')}>
                    <span style={css('width:11px;height:11px;border-radius:50%;background:#2a3550')} />
                    <span style={css('width:11px;height:11px;border-radius:50%;background:#2a3550')} />
                    <span style={css('width:11px;height:11px;border-radius:50%;background:#2a3550')} />
                    <span style={css(`${MONO};font-size:11px;color:#7B86A1;margin-left:8px`)}>pmn-console</span>
                  </div>
                  <span style={css(`display:inline-flex;align-items:center;gap:6px;${MONO};font-size:10.5px;color:#4ade80`)}><span style={css('width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:pulseDot 1.6s infinite')} />LIVE</span>
                </div>
                <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:16px 6px 14px')}>
                  {[['UPTIME', '99.9%'], ['QUERIES', '1.2M'], ['LATENCY', '42ms']].map(([k, v]) => (
                    <div key={k} style={css('background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:11px 12px')}>
                      <div style={css(`${MONO};font-size:10px;color:#7B86A1;letter-spacing:.08em`)}>{k}</div>
                      <div style={css('font-size:19px;font-weight:600;margin-top:5px')}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={css('padding:8px 8px 6px')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
                    <span style={css('font-size:12.5px;color:#A7B0C4')}>Throughput · 7 วัน</span>
                    <span style={css(`${MONO};font-size:11px;color:#4ade80`)}>▲ 18.4%</span>
                  </div>
                  <div style={css('display:flex;align-items:flex-end;gap:9px;height:84px')}>
                    {[[42, '#2563EB,#1d4ed8', .1], [60, '#2563EB,#1d4ed8', .18], [48, '#2563EB,#1d4ed8', .26], [74, '#38BDF8,#0ea5e9', .34], [64, '#2563EB,#1d4ed8', .42], [88, '#38BDF8,#0ea5e9', .5], [100, '#60A5FA,#38BDF8', .58]].map((b, i) => (
                      <div key={i} style={css(`flex:1;height:${b[0]}%;background:linear-gradient(180deg,${b[1]});border-radius:5px 5px 0 0;transform-origin:bottom;animation:growBar .8s ${b[2]}s both`)} />
                    ))}
                  </div>
                </div>
              </div>
              {[['top:-22px;right:-16px;animation:floaty 6s ease-in-out infinite', 'ERP'], ['top:38%;left:-26px;animation:floaty2 7s ease-in-out infinite', 'CRM'], ['bottom:-18px;left:30px;animation:floaty 8s ease-in-out infinite', 'Database'], ['bottom:30px;right:-30px;animation:floaty2 6.5s ease-in-out infinite', 'API']].map(([pos, label]) => (
                <div key={label} style={css(`position:absolute;${pos};background:rgba(13,19,35,.95);border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:9px 13px;${MONO};font-size:12px;color:#9FC0FF;box-shadow:0 14px 30px -12px rgba(0,0,0,.7)`)}>{label}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={css('padding:34px 24px 20px;border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05)')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <p style={css(`text-align:center;${MONO};font-size:11px;letter-spacing:.22em;color:#5C6680;text-transform:uppercase;margin:0 0 22px`)}>{c.trustedLabel}</p>
          <div style={css('overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)')}>
            <div style={css('display:flex;gap:64px;width:max-content;animation:marquee 32s linear infinite;align-items:center;opacity:.62')}>
              {[...c.clients, ...c.clients].map((cl, i) => (
                <span key={i} style={css("font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:20px;letter-spacing:.04em;color:#C7D0E0;white-space:nowrap")}>{cl}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:104px 24px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          {sectionHead('01', 'What we build', 'บริการที่เราดำเนินการให้', <button className="agG" onClick={() => go('services')} style={css('display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.16);color:#EAEEF6;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;align-self:flex-end')}>ดูบริการทั้งหมด →</button>)}
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:18px')} data-svc-grid>
            {c.services.map((sv, i) => (
              <div key={i} className="agCard" style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:26px 22px;cursor:default')}>
                <div style={css('width:46px;height:46px;border-radius:12px;background:rgba(37,99,235,.14);border:1px solid rgba(37,99,235,.32);display:flex;align-items:center;justify-content:center;margin-bottom:18px')}><ServiceIcon kind={sv.icon} /></div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.1em;color:#7FB0FF;text-transform:uppercase;margin-bottom:8px`)}>{sv.t}</div>
                <h3 style={css('margin:0 0 9px;font-size:17px;font-weight:600;letter-spacing:-.01em')}>{sv.th}</h3>
                <p style={css('margin:0;color:#8B95AC;font-size:13.5px;line-height:1.62')}>{sv.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal data-count style={css('padding:24px 24px 96px')}>
        <div style={css('max-width:1240px;margin:0 auto;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:repeat(4,1fr)')} data-stats-grid>
          {c.stats.map((st, i) => (
            <div key={i} style={css(`padding:36px 30px${i < c.stats.length - 1 ? ';border-right:1px solid rgba(255,255,255,.08)' : ''}`)}>
              <div style={css('font-size:clamp(34px,4.4vw,54px);font-weight:700;letter-spacing:-.035em;line-height:1')}>{statDisplay(i)}</div>
              <div style={css('color:#7B86A1;font-size:13.5px;margin-top:10px')}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')} data-sec-head>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>02</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>{c.why.eyebrow}</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.06;letter-spacing:-.025em;font-weight:700')}>{ml(c.why.title)}</h2>
              </div>
            </div>
            <p style={css('margin:0 0 4px;color:#A7B0C4;font-size:16px;line-height:1.72;font-weight:300')}>{c.why.subtitle}</p>
          </div>
          <div style={css('display:grid;grid-template-columns:1.4fr 1fr 1fr;grid-auto-rows:minmax(0,auto);gap:18px')} data-bento>
            <div style={css('grid-row:span 2;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:30px;position:relative;overflow:hidden')}>
              <div style={css('position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.35),transparent 65%);filter:blur(20px)')} />
              <div style={css('position:relative')}>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>Tech Stack</div>
                <h3 style={css('margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:-.01em')}>{c.why.techTitle}</h3>
                <p style={css('margin:0 0 22px;color:#A7B0C4;font-size:14.5px;line-height:1.65')}>{c.why.techDesc}</p>
                <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>{c.techs.map((t) => <span key={t} style={css(`${MONO};font-size:12px;color:#C7D0E0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 11px`)}>{t}</span>)}</div>
              </div>
            </div>
            {c.why.bento.map((b, i) => (
              <div key={i} className="agCard" style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:26px')}>
                <div style={css('width:42px;height:42px;border-radius:11px;background:rgba(37,99,235,.16);border:1px solid rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center;margin-bottom:16px')}><span style={css('width:16px;height:16px;border:2px solid #60A5FA;border-radius:5px;display:block')} /></div>
                <h3 style={css('margin:0 0 8px;font-size:17px;font-weight:600')}>{b.h}</h3>
                <p style={css('margin:0;color:#8B95AC;font-size:13.5px;line-height:1.6')}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          {sectionHead('03', 'How we work', 'กระบวนการทำงานแบบครบวงจร', <div style={css(`${MONO};font-size:12px;color:#5C6680;letter-spacing:.04em;align-self:flex-end`)}>5 ขั้นตอน · จบในทีมเดียว</div>)}
          <div style={css('display:grid;grid-template-columns:repeat(5,1fr);gap:14px;position:relative')} data-process>{renderSteps()}</div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          {sectionHead('04', 'Selected work', 'ผลงานล่าสุด', <button className="agG" onClick={() => go('portfolio')} style={css('display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.16);color:#EAEEF6;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;align-self:flex-end')}>ดูผลงานทั้งหมด →</button>)}
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px')} data-work-grid>
            {c.works.map((w, i) => (
              <div key={i} className="agWork" onClick={() => go('portfolio')} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;cursor:pointer')}>
                <div style={css('aspect-ratio:16/10;background:repeating-linear-gradient(135deg,#0e1424,#0e1424 11px,#0b101d 11px,#0b101d 22px);display:flex;align-items:center;justify-content:center;position:relative;border-bottom:1px solid rgba(255,255,255,.06)')}>
                  <span style={css(`position:absolute;inset:0;background:radial-gradient(circle at 70% 20%,${w.hue}22,transparent 60%)`)} />
                  <span style={css(`${MONO};font-size:11.5px;color:#5C6680;position:relative`)}>[ project screenshot ]</span>
                </div>
                <div style={css('padding:20px 22px')}>
                  <div style={css(`${MONO};font-size:10.5px;letter-spacing:.1em;color:#7FB0FF;text-transform:uppercase;margin-bottom:9px`)}>{w.tag}</div>
                  <h3 style={css('margin:0 0 12px;font-size:17px;font-weight:600')}>{w.t}</h3>
                  <div style={css('display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#4ade80;font-weight:500')}>▲ {w.m}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          {sectionHead('05', 'Plans', 'แพ็กเกจที่ยืดหยุ่นตามธุรกิจ', renderDiscountToggle('align-self:flex-end'))}
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch')} data-pricing-mini>{renderPricingMini()}</div>
        </div>
      </section>

      <section id="register" data-reveal style={css('padding:30px 24px 100px;scroll-margin-top:90px')}>
        <div style={css('max-width:1240px;margin:0 auto;position:relative;border:1px solid rgba(255,255,255,.1);border-radius:26px;overflow:hidden;background:linear-gradient(135deg,rgba(37,99,235,.16),rgba(7,10,20,.4))')}>
          <div style={css('position:absolute;top:-120px;left:-80px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.28),transparent 65%);filter:blur(40px);pointer-events:none')} />
          <div style={css('position:relative;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:52px 46px')} data-reg-grid>
            <div>
              <div style={css('display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border:1px solid rgba(56,189,248,.4);background:rgba(56,189,248,.1);border-radius:100px;margin-bottom:22px')}><span style={css(`${MONO};font-size:11px;letter-spacing:.18em;color:#7FD7FF;text-transform:uppercase`)}>Members only</span></div>
              <h2 style={css('margin:0 0 16px;font-size:clamp(28px,3.2vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>{ml(c.register.title)}</h2>
              <p style={css('margin:0 0 26px;color:#B6C0D4;font-size:16px;line-height:1.7;font-weight:300;max-width:440px')}>{c.register.subtitle}</p>
              <div style={css('display:flex;flex-direction:column;gap:14px')}>
                {c.register.privileges.map((p, i) => (
                  <div key={i} style={css('display:flex;align-items:flex-start;gap:13px')}>
                    <span style={css(`flex-shrink:0;width:24px;height:24px;border-radius:7px;background:rgba(56,189,248,.14);border:1px solid rgba(56,189,248,.4);color:#7FD7FF;display:flex;align-items:center;justify-content:center;font-size:13px;margin-top:1px`)}>✓</span>
                    <div><div style={css('font-size:15px;font-weight:500;color:#EAEEF6')}>{p.t}</div><div style={css('font-size:13px;color:#8B95AC;margin-top:2px')}>{p.d}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              {regSubmitted ? (
                <div style={css('background:rgba(8,12,22,.7);border:1px solid rgba(56,189,248,.3);border-radius:20px;padding:34px;animation:popIn .5s cubic-bezier(.2,.8,.2,1) both;height:100%;display:flex;flex-direction:column;justify-content:center')}>
                  <div style={css('width:56px;height:56px;border-radius:50%;background:rgba(74,222,128,.14);border:1px solid rgba(74,222,128,.5);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:26px;color:#4ade80')}>✓</div>
                  <h3 style={css('margin:0 0 8px;font-size:22px;font-weight:600')}>ยินดีต้อนรับสู่ PMN</h3>
                  <p style={css('margin:0 0 22px;color:#A7B0C4;font-size:14.5px;line-height:1.6')}>คูปองของคุณพร้อมใช้งานแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชม.</p>
                  <div style={css(`${MONO};font-size:11px;letter-spacing:.14em;color:#7B86A1;text-transform:uppercase;margin-bottom:8px`)}>คูปองส่วนลดของคุณ</div>
                  <div style={css('display:flex;align-items:center;gap:10px;background:rgba(37,99,235,.12);border:1px dashed rgba(96,165,250,.6);border-radius:12px;padding:14px 16px;margin-bottom:14px')}>
                    <span style={css(`${MONO};font-size:22px;font-weight:600;letter-spacing:.06em;color:#9FC0FF;flex:1`)}>{c.register.couponCode}</span>
                    <button className="agP" onClick={copyCoupon} style={css('background:#2563EB;color:#fff;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap')}>{copied ? 'Copied ✓' : 'Copy'}</button>
                  </div>
                  <button className="agG" onClick={() => { setRegSubmitted(false); setReg({ name: '', email: '', phone: '', service: SERVICE_OPTS[0], hp: '' }); setCopied(false); }} style={css('background:none;border:1px solid rgba(255,255,255,.16);color:#A7B0C4;border-radius:10px;padding:11px;font-size:13.5px;cursor:pointer')}>ลงทะเบียนอีกครั้ง</button>
                </div>
              ) : (
                <form onSubmit={submitReg} style={css('background:rgba(8,12,22,.6);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:30px;display:flex;flex-direction:column;gap:14px')}>
                  <div style={css(`${MONO};font-size:11px;letter-spacing:.14em;color:#7B86A1;text-transform:uppercase;margin-bottom:2px`)}>Register form</div>
                  <input value={reg.hp} onChange={(e) => setReg({ ...reg, hp: e.target.value })} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden />
                  <div>
                    <label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>ชื่อ-นามสกุล</label>
                    <input className="agInp" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} required placeholder="ชื่อของคุณ" style={css(INP)} />
                  </div>
                  <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:12px')}>
                    <div>
                      <label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>อีเมล</label>
                      <input className="agInp" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} type="email" required placeholder="you@company.com" style={css(INP)} />
                    </div>
                    <div>
                      <label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>เบอร์โทร</label>
                      <input className="agInp" value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} placeholder="08X-XXX-XXXX" style={css(INP)} />
                    </div>
                  </div>
                  <div>
                    <label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>บริการที่สนใจ</label>
                    <select value={reg.service} onChange={(e) => setReg({ ...reg, service: e.target.value })} style={css(INP + ';cursor:pointer')}>
                      {SERVICE_OPTS.map((o) => <option key={o} style={css('background:#0b101d')}>{o}</option>)}
                    </select>
                  </div>
                  <button className="agP" type="submit" style={css('margin-top:6px;background:#2563EB;color:#fff;border:none;border-radius:11px;padding:15px;font-size:15.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 30px -10px rgba(37,99,235,.8)')}>{c.hero.ctaPrimary} →</button>
                  <p style={css('margin:2px 0 0;font-size:11.5px;color:#5C6680;text-align:center')}>เราเคารพความเป็นส่วนตัวของคุณ · ไม่มีค่าใช้จ่าย</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 110px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          {sectionHead('06', 'Testimonials', 'ลูกค้าพูดถึงเรา', <div style={css(`${MONO};font-size:12px;color:#5C6680;letter-spacing:.04em;align-self:flex-end`)}>จากลูกค้าจริงของเรา</div>)}
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:18px')} data-quotes>
            {c.testimonials.map((q, i) => (
              <div key={i} style={css('background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:32px 28px;display:flex;flex-direction:column;gap:18px')}>
                <div style={css("font-family:'IBM Plex Sans',serif;font-size:46px;line-height:1;color:#33508a;height:22px;user-select:none")}>“</div>
                <p style={css('margin:0;font-size:16px;line-height:1.72;color:#D6DDEA;flex:1')}>{q.q}</p>
                <div style={css('display:flex;align-items:center;gap:13px;border-top:1px solid rgba(255,255,255,.07);padding-top:18px')}>
                  <span style={css('width:22px;height:2px;background:#2563EB;flex-shrink:0')} />
                  <div><div style={css('font-size:14px;font-weight:600;color:#EAEEF6')}>{q.n}</div><div style={css(`font-size:12px;color:#7B86A1;${MONO};margin-top:4px`)}>{q.r}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {articles && articles.length > 0 && (
        <section data-reveal style={css('padding:30px 24px 100px')}>
          <div style={css('max-width:1240px;margin:0 auto')}>
            {sectionHead(
              '07',
              'Articles',
              'บทความล่าสุด',
              <a
                href="/blog"
                className="agG"
                style={css('display:inline-flex;align-items:center;gap:8px;align-self:flex-end;background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:11px 20px;font-size:14px;font-weight:500;text-decoration:none')}
              >
                อ่านบทความทั้งหมด <span>→</span>
              </a>,
            )}
            <ArticlesCarousel articles={articles} />
          </div>
        </section>
      )}

      <section data-reveal style={css('padding:20px 24px 110px')}>
        <div style={css('max-width:1080px;margin:0 auto;position:relative;border:1px solid rgba(255,255,255,.1);border-radius:26px;padding:64px 40px;text-align:center;overflow:hidden;background:radial-gradient(ellipse 80% 120% at 50% 0%,rgba(37,99,235,.22),rgba(7,10,20,.2))')}>
          <div style={css('position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:40px 40px;-webkit-mask-image:radial-gradient(ellipse 70% 80% at 50% 30%,#000,transparent 75%);mask-image:radial-gradient(ellipse 70% 80% at 50% 30%,#000,transparent 75%)')} />
          <div style={css('position:relative')}>
            <h2 style={css('margin:0 0 16px;font-size:clamp(28px,3.6vw,46px);line-height:1.12;letter-spacing:-.02em;font-weight:700')}>{c.ctaBand.title}</h2>
            <p style={css('margin:0 auto 30px;max-width:520px;color:#B6C0D4;font-size:17px;line-height:1.7;font-weight:300')}>{c.ctaBand.subtitle}</p>
            <div style={css('display:flex;gap:14px;justify-content:center;flex-wrap:wrap')}>
              <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>{c.hero.ctaPrimary} →</button>
              <button className="agG" onClick={() => go('contact')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ติดต่อทีมงาน</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  function sectionHead(num: string, eyebrow: string, title: string, right: React.ReactNode) {
    return (
      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')}>
        <div style={css('display:flex;align-items:baseline;gap:16px')}>
          <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>{num}</span>
          <div>
            <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>{eyebrow}</div>
            <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>{title}</h2>
          </div>
        </div>
        {right}
      </div>
    );
  }

  function renderSteps() {
    return c.process.map((st, i) => (
      <div key={i} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px 18px;position:relative')}>
        <div style={css(`${MONO};font-size:13px;font-weight:600;color:#2563EB;margin-bottom:14px`)}>{st.n}</div>
        <div style={css('width:34px;height:2px;background:linear-gradient(90deg,#2563EB,transparent);margin-bottom:14px')} />
        <h3 style={css('margin:0 0 7px;font-size:16px;font-weight:600')}>{st.t}</h3>
        <p style={css('margin:0;color:#8B95AC;font-size:12.8px;line-height:1.55')}>{st.d}</p>
      </div>
    ));
  }

  function renderDiscountToggle(extra: string) {
    return (
      <button onClick={() => setDiscount((d) => !d)} style={css(`display:inline-flex;align-items:center;gap:10px;background:rgba(37,99,235,.1);border:1px solid rgba(37,99,235,.3);border-radius:100px;padding:10px 16px;cursor:pointer;color:#EAEEF6;font-size:13.5px;${extra}`)}>
        <span style={css(`width:38px;height:22px;border-radius:100px;background:${discount ? '#2563EB' : 'rgba(255,255,255,.18)'};position:relative;transition:background .25s;flex-shrink:0`)}><span style={css(`position:absolute;top:2px;left:${discount ? '18px' : '2px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:left .25s`)} /></span>
        จองภายในเดือนนี้ — ลดทันที 20%
      </button>
    );
  }

  function renderPricingMini() {
    return c.pricing.tiers.map((t, i) => (
      <div key={i} style={css(`background:${t.popular ? 'linear-gradient(165deg,rgba(37,99,235,.16),rgba(255,255,255,.02))' : 'rgba(255,255,255,.025)'};border:${t.popular ? '1px solid rgba(96,165,250,.5)' : '1px solid rgba(255,255,255,.08)'};border-radius:20px;padding:28px 26px;position:relative;display:flex;flex-direction:column;box-shadow:${t.popular ? '0 24px 60px -28px rgba(37,99,235,.7)' : 'none'}`)}>
        {t.popular && <div style={css('position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2563EB;color:#fff;font-size:11px;font-weight:600;letter-spacing:.04em;padding:5px 14px;border-radius:100px;white-space:nowrap;box-shadow:0 8px 20px -6px rgba(37,99,235,.8)')}>แนะนำ · MOST POPULAR</div>}
        <div style={css(`${MONO};font-size:12px;letter-spacing:.12em;color:${t.popular ? '#9FC0FF' : '#7B86A1'};text-transform:uppercase;margin-bottom:6px`)}>{t.name}</div>
        <div style={css('font-size:14px;color:#A7B0C4;margin-bottom:8px')}>{t.th}</div>
        <div style={css('margin:4px 0 18px')}>
          {t.custom ? (
            <>
              <span style={css('font-size:30px;font-weight:700;letter-spacing:-.02em')}>Custom</span>
              <div style={css('font-size:12.5px;color:#8B95AC;margin-top:4px')}>ตามขอบเขตงาน</div>
            </>
          ) : (
            <>
              {discount && <span style={css('font-size:15px;color:#5C6680;text-decoration:line-through;margin-right:8px')}>{fmt(t.base)}</span>}
              <span style={css('font-size:30px;font-weight:700;letter-spacing:-.02em;color:#fff')}>{fmt(discount ? t.disc : t.base)}</span>
              <div style={css('font-size:12.5px;color:#8B95AC;margin-top:4px')}>เริ่มต้น · ราคาต่อโปรเจกต์</div>
            </>
          )}
        </div>
        <div style={css('display:flex;flex-direction:column;gap:10px;margin-bottom:22px;flex:1')}>
          {t.feats.map((f, j) => <div key={j} style={css('display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#C7D0E0')}><span style={css('color:#60A5FA;flex-shrink:0')}>✓</span>{f}</div>)}
        </div>
        <button className={t.popular ? 'agP' : 'agG'} onClick={() => go('pricing')} style={css(`background:${t.popular ? '#2563EB' : 'rgba(255,255,255,.05)'};color:#fff;border:${t.popular ? 'none' : '1px solid rgba(255,255,255,.16)'};border-radius:11px;padding:13px;font-size:14.5px;font-weight:600;cursor:pointer`)}>{t.custom ? 'ขอใบเสนอราคา' : 'เลือกแพ็กเกจนี้'}</button>
      </div>
    ));
  }

  /* ---------------- SERVICES ---------------- */
  const renderServices = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 40px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.28),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:820px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Services</div>
          <h1 style={css('margin:0 0 20px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>{c.servicesPage.title}<br /><span style={css('color:#5C6680')}>{c.servicesPage.titleMuted}</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>{c.servicesPage.subtitle}</p>
        </div>
      </section>
      <section data-reveal style={css('padding:50px 24px 30px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:20px')}>
          {c.servicesPage.details.map((s, i) => (
            <div key={i} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:40px')} data-svc-detail>
              <div>
                <div style={css('display:flex;align-items:center;gap:14px;margin-bottom:18px')}>
                  <div style={css('width:52px;height:52px;border-radius:14px;background:rgba(37,99,235,.16);border:1px solid rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center')}><ServiceIcon kind={c.services[i]?.icon ?? 'code'} /></div>
                  <div><div style={css(`${MONO};font-size:11px;letter-spacing:.12em;color:#7FB0FF;text-transform:uppercase`)}>{s.n}</div><h2 style={css('margin:4px 0 0;font-size:24px;font-weight:700;letter-spacing:-.01em')}>{s.h}</h2></div>
                </div>
                <p style={css('margin:0;color:#A7B0C4;font-size:15px;line-height:1.7')}>{s.p}</p>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:11px;justify-content:center')}>
                {s.feats.map((f, j) => <div key={j} style={css(CHECK)}><span style={css('color:#60A5FA')}>✓</span> {f}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section data-reveal style={css('padding:50px 24px 40px')}>
        <div style={css('max-width:1180px;margin:0 auto')}>
          <div style={css('text-align:center;margin-bottom:40px')}><div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>More</div><h2 style={css('margin:0;font-size:clamp(26px,3vw,38px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>{c.servicesPage.moreTitle}</h2></div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px')} data-more-grid>
            {c.servicesPage.more.map((m, i) => (
              <div key={i} className="agMore" style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px')}>
                <div style={css(`${MONO};font-size:11px;color:#7FB0FF;letter-spacing:.1em;margin-bottom:10px`)}>{m.k}</div>
                <h3 style={css('margin:0 0 8px;font-size:16px;font-weight:600')}>{m.h}</h3>
                <p style={css('margin:0;color:#8B95AC;font-size:13px;line-height:1.6')}>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section data-reveal style={css('padding:50px 24px 40px')}>
        <div style={css('max-width:1180px;margin:0 auto;background:linear-gradient(135deg,rgba(37,99,235,.1),rgba(56,189,248,.04));border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:44px 40px')}>
          <div style={css('display:grid;grid-template-columns:1fr 1.2fr;gap:40px;align-items:center')} data-exp-grid>
            <div>
              <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>Expertise</div>
              <h2 style={css('margin:0 0 14px;font-size:clamp(24px,2.6vw,34px);line-height:1.18;letter-spacing:-.02em;font-weight:700')}>{c.servicesPage.expertiseTitle}</h2>
              <p style={css('margin:0;color:#A7B0C4;font-size:15px;line-height:1.7')}>{c.servicesPage.expertiseDesc}</p>
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>{c.techs.map((t) => <span key={t} style={css(`${MONO};font-size:12px;color:#C7D0E0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 11px`)}>{t}</span>)}</div>
          </div>
        </div>
      </section>
      <section data-reveal style={css('padding:50px 24px 60px')}>
        <div style={css('max-width:1180px;margin:0 auto')}>
          <div style={css('text-align:center;margin-bottom:46px')}><div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>How we work</div><h2 style={css('margin:0;font-size:clamp(26px,3vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>กระบวนการทำงานแบบครบวงจร</h2></div>
          <div style={css('display:grid;grid-template-columns:repeat(5,1fr);gap:14px')} data-process>{renderSteps()}</div>
        </div>
      </section>
      <section data-reveal style={css('padding:10px 24px 100px')}>
        <div style={css('max-width:1080px;margin:0 auto;border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:56px 40px;text-align:center;background:radial-gradient(ellipse 80% 120% at 50% 0%,rgba(37,99,235,.2),rgba(7,10,20,.2))')}>
          <h2 style={css('margin:0 0 14px;font-size:clamp(26px,3.4vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>ไม่แน่ใจว่าธุรกิจคุณต้องการระบบแบบไหน?</h2>
          <p style={css('margin:0 auto 28px;max-width:520px;color:#B6C0D4;font-size:16px;line-height:1.7;font-weight:300')}>คุยกับเราฟรี เราจะช่วยวิเคราะห์และแนะนำแนวทางที่เหมาะกับคุณที่สุด</p>
          <div style={css('display:flex;gap:14px;justify-content:center;flex-wrap:wrap')}>
            <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>{c.hero.ctaPrimary} →</button>
            <button className="agG" onClick={() => go('pricing')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ดูแพ็กเกจและราคา</button>
          </div>
        </div>
      </section>
    </div>
  );

  /* ---------------- PORTFOLIO ---------------- */
  const FILTERS = [
    { label: 'ทั้งหมด', cat: 'all' }, { label: 'ERP', cat: 'erp' }, { label: 'CRM', cat: 'crm' },
    { label: 'Database', cat: 'database' }, { label: 'Custom', cat: 'custom' },
  ];
  const filteredWork = workFilter === 'all' ? c.portfolio.allWork : c.portfolio.allWork.filter((w) => w.cat === workFilter);
  const renderPortfolio = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 24px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.26),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:780px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Portfolio</div>
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>{c.portfolio.title} <span style={css('color:#5C6680')}>{c.portfolio.titleMuted}</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>{c.portfolio.subtitle}</p>
        </div>
      </section>
      <section data-reveal style={css('padding:24px 24px 20px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:flex;justify-content:center;flex-wrap:wrap;gap:10px')}>
          {FILTERS.map((f) => {
            const on = workFilter === f.cat;
            return <button key={f.cat} onClick={() => setWorkFilter(f.cat)} style={css(`background:${on ? '#2563EB' : 'rgba(255,255,255,.04)'};color:${on ? '#fff' : '#A7B0C4'};border:${on ? '1px solid #2563EB' : '1px solid rgba(255,255,255,.14)'};border-radius:100px;padding:9px 18px;font-size:14px;font-weight:500;cursor:pointer;transition:background .2s,color .2s,border-color .2s`)}>{f.label}</button>;
          })}
        </div>
      </section>
      <section data-reveal style={css('padding:20px 24px 50px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px')} data-portfolio-grid>
          {filteredWork.map((w, i) => (
            <div key={i} className="agWork" style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden')}>
              <div style={css('aspect-ratio:16/10;background:repeating-linear-gradient(135deg,#0e1424,#0e1424 11px,#0b101d 11px,#0b101d 22px);position:relative;display:flex;align-items:center;justify-content:center;border-bottom:1px solid rgba(255,255,255,.06)')}>
                <div style={css('position:absolute;inset:0;background:radial-gradient(circle at 75% 18%,rgba(37,99,235,.18),transparent 60%)')} />
                <span style={css(`${MONO};font-size:11.5px;color:#5C6680;position:relative`)}>[ project screenshot ]</span>
              </div>
              <div style={css('padding:22px')}>
                <div style={css(`${MONO};font-size:10.5px;letter-spacing:.1em;color:#7FB0FF;text-transform:uppercase;margin-bottom:9px`)}>{w.tag}</div>
                <h3 style={css('margin:0 0 8px;font-size:17px;font-weight:600')}>{w.t}</h3>
                <p style={css('margin:0 0 14px;color:#8B95AC;font-size:13.5px;line-height:1.6')}>{w.d}</p>
                <div style={css('display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#4ade80;font-weight:500;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);padding:5px 11px;border-radius:8px')}>▲ {w.m}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section data-reveal style={css('padding:20px 24px 50px')}>
        <div style={css('max-width:1180px;margin:0 auto;background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(56,189,248,.06));border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:40px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px')}>
          {c.portfolio.stats.map((st, i) => (
            <div key={i} style={css('text-align:center')}><div style={css('font-size:clamp(30px,3.4vw,44px);font-weight:700;letter-spacing:-.02em;background:linear-gradient(180deg,#fff,#9FC0FF);-webkit-background-clip:text;background-clip:text;color:transparent')}>{st.v}</div><div style={css('color:#A7B0C4;font-size:14px;margin-top:6px')}>{st.l}</div></div>
          ))}
        </div>
      </section>
      <section data-reveal style={css('padding:10px 24px 100px')}>
        <div style={css('max-width:1080px;margin:0 auto;border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:56px 40px;text-align:center;background:radial-gradient(ellipse 80% 120% at 50% 0%,rgba(37,99,235,.2),rgba(7,10,20,.2))')}>
          <h2 style={css('margin:0 0 14px;font-size:clamp(26px,3.4vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>อยากให้ธุรกิจคุณเป็นผลงานชิ้นต่อไป?</h2>
          <p style={css('margin:0 auto 28px;max-width:520px;color:#B6C0D4;font-size:16px;line-height:1.7;font-weight:300')}>เริ่มต้นด้วยการลงทะเบียนรับสิทธิพิเศษ แล้วเราจะติดต่อกลับเพื่อวางแผนร่วมกัน</p>
          <div style={css('display:flex;gap:14px;justify-content:center;flex-wrap:wrap')}>
            <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>{c.hero.ctaPrimary} →</button>
            <button className="agG" onClick={() => go('contact')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ติดต่อเรา</button>
          </div>
        </div>
      </section>
    </div>
  );

  /* ---------------- PRICING ---------------- */
  const starterPrice = discount ? fmt(c.pricing.tiers[0]?.disc ?? 28000) : fmt(c.pricing.tiers[0]?.base ?? 35000);
  const proPrice = discount ? fmt(c.pricing.tiers[1]?.disc ?? 119000) : fmt(c.pricing.tiers[1]?.base ?? 149000);
  const cmpRows: [string, string, string, string][] = [
    ['จำนวนโมดูล', '1', 'สูงสุด 5', 'ไม่จำกัด'],
    ['ออกแบบ UX เฉพาะ', '—', '✓', '✓'],
    ['API & Integration', 'พื้นฐาน', '✓', 'ขั้นสูง'],
    ['รายงาน & BI', 'พื้นฐาน', '✓', 'ขั้นสูง'],
    ['ระยะดูแลฟรี', '3 เดือน', '6 เดือน', '12 เดือน + SLA'],
    ['Priority Support', '—', '✓', 'ทีมเฉพาะ'],
    ['การติดตั้ง', 'Cloud', 'Cloud', 'Cloud / On-prem'],
  ];
  const renderPricing = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 24px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.26),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:780px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Pricing</div>
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>{c.pricingPage.title} <span style={css('color:#5C6680')}>{c.pricingPage.titleMuted}</span></h1>
          <p style={css('margin:0 0 30px;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>{c.pricingPage.subtitle}</p>
          <div style={css('display:flex;justify-content:center')}>{renderDiscountToggle('')}</div>
        </div>
      </section>
      <section data-reveal style={css('padding:30px 24px 30px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch')} data-price-grid>
          {c.pricing.tiers.map((t, i) => (
            <div key={i} style={css(`background:${t.popular ? 'linear-gradient(165deg,rgba(37,99,235,.18),rgba(255,255,255,.02))' : 'rgba(255,255,255,.025)'};border:${t.popular ? '1px solid rgba(96,165,250,.5)' : '1px solid rgba(255,255,255,.08)'};border-radius:22px;padding:32px 30px;display:flex;flex-direction:column;position:relative;${t.popular ? 'box-shadow:0 28px 70px -30px rgba(37,99,235,.8)' : ''}`)}>
              {t.popular && <div style={css('position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#2563EB;color:#fff;font-size:11px;font-weight:600;letter-spacing:.04em;padding:6px 15px;border-radius:100px;white-space:nowrap;box-shadow:0 8px 20px -6px rgba(37,99,235,.8)')}>แนะนำ · MOST POPULAR</div>}
              <div style={css(`${MONO};font-size:12px;letter-spacing:.12em;color:${t.popular ? '#9FC0FF' : '#7B86A1'};text-transform:uppercase;margin-bottom:6px`)}>{t.name}</div>
              <div style={css('font-size:14px;color:#A7B0C4;margin-bottom:14px')}>{t.th}</div>
              <div style={css('margin-bottom:8px;min-height:30px')}>
                {t.custom ? (
                  <span style={css('font-size:34px;font-weight:700;letter-spacing:-.02em;color:#fff')}>Custom</span>
                ) : (
                  <>
                    {discount && <span style={css('font-size:16px;color:#5C6680;text-decoration:line-through;margin-right:9px')}>{fmt(t.base)}</span>}
                    <span style={css('font-size:34px;font-weight:700;letter-spacing:-.02em;color:#fff')}>{fmt(discount ? t.disc : t.base)}</span>
                  </>
                )}
              </div>
              <div style={css('font-size:13px;color:#8B95AC;margin-bottom:24px')}>{t.custom ? 'ราคาตามขอบเขตงาน' : 'เริ่มต้น · ราคาต่อโปรเจกต์'}</div>
              <div style={css('display:flex;flex-direction:column;gap:12px;margin-bottom:28px;flex:1')}>
                {t.feats.map((f, j) => <div key={j} style={css('display:flex;gap:10px;font-size:14px;color:#C7D0E0')}><span style={css('color:#60A5FA')}>✓</span> {f}</div>)}
              </div>
              <button className={t.popular ? 'agP' : 'agG'} onClick={t.custom ? () => go('contact') : goReg} style={css(`background:${t.popular ? '#2563EB' : 'rgba(255,255,255,.05)'};color:#fff;border:${t.popular ? 'none' : '1px solid rgba(255,255,255,.16)'};border-radius:11px;padding:13px;font-size:14.5px;font-weight:600;cursor:pointer`)}>{t.custom ? 'ขอใบเสนอราคา' : 'เลือกแพ็กเกจนี้'}</button>
            </div>
          ))}
        </div>
      </section>
      <section data-reveal style={css('padding:30px 24px 40px')}>
        <div style={css('max-width:1180px;margin:0 auto')}>
          <div style={css('text-align:center;margin-bottom:34px')}><div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:12px`)}>Compare</div><h2 style={css('margin:0;font-size:clamp(24px,2.8vw,36px);line-height:1.16;letter-spacing:-.02em;font-weight:700')}>เปรียบเทียบแพ็กเกจ</h2></div>
          <div style={css('border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden')}>
            <div style={css('display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.08)')}>
              <div style={css(`padding:16px 20px;font-size:13px;color:#7B86A1;${MONO};letter-spacing:.08em`)}>FEATURE</div>
              <div style={css('padding:16px 14px;text-align:center;font-weight:600;font-size:14.5px')}>Starter</div>
              <div style={css('padding:16px 14px;text-align:center;font-weight:600;font-size:14.5px;color:#9FC0FF')}>Pro</div>
              <div style={css('padding:16px 14px;text-align:center;font-weight:600;font-size:14.5px')}>Enterprise</div>
            </div>
            {cmpRows.map((row, i) => (
              <div key={i} style={css(`display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr${i < cmpRows.length - 1 ? ';border-bottom:1px solid rgba(255,255,255,.06)' : ''}`)}>
                <div style={css('padding:15px 20px;font-size:14px;color:#C7D0E0')}>{row[0]}</div>
                {[row[1], row[2], row[3]].map((cell, j) => (
                  <div key={j} style={css(`padding:15px 14px;text-align:center;font-size:14px;${cell === '✓' ? 'color:#60A5FA' : cell === '—' ? 'color:#3a4456' : 'color:#A7B0C4'}`)}>{cell}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:820px;margin:0 auto')}>
          <div style={css('text-align:center;margin-bottom:34px')}><div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:12px`)}>FAQ</div><h2 style={css('margin:0;font-size:clamp(24px,2.8vw,36px);line-height:1.16;letter-spacing:-.02em;font-weight:700')}>คำถามที่พบบ่อย</h2></div>
          <div style={css('display:flex;flex-direction:column;gap:12px')}>
            {c.faqs.map((f, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} style={css('border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.02);overflow:hidden')}>
                  <button onClick={() => setFaqOpen(open ? null : i)} style={css('width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;background:none;border:none;color:#EAEEF6;padding:19px 22px;cursor:pointer;text-align:left;font-size:16px;font-weight:500')}>
                    {f.q}
                    <span style={css('color:#60A5FA;font-size:22px;flex-shrink:0;width:22px;text-align:center')}>{open ? '−' : '+'}</span>
                  </button>
                  {open && <div style={css('padding:0 22px 20px;color:#A7B0C4;font-size:14.5px;line-height:1.7')}>{f.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  /* ---------------- CONTACT ---------------- */
  const renderContact = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 24px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.26),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:780px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Contact</div>
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>{c.contact.title} <span style={css('color:#5C6680')}>{c.contact.titleMuted}</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>{c.contact.subtitle}</p>
        </div>
      </section>
      <section data-reveal style={css('padding:40px 24px 100px')}>
        <div style={css('max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.25fr 1fr;gap:24px;align-items:start')} data-contact-grid>
          <div style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:34px')}>
            {cSubmitted ? (
              <div style={css('animation:popIn .5s cubic-bezier(.2,.8,.2,1) both;display:flex;flex-direction:column;align-items:flex-start;min-height:380px;justify-content:center')}>
                <div style={css('width:58px;height:58px;border-radius:50%;background:rgba(74,222,128,.14);border:1px solid rgba(74,222,128,.5);display:flex;align-items:center;justify-content:center;margin-bottom:22px;font-size:28px;color:#4ade80')}>✓</div>
                <h3 style={css('margin:0 0 10px;font-size:24px;font-weight:700')}>ส่งข้อความเรียบร้อย!</h3>
                <p style={css('margin:0 0 26px;color:#A7B0C4;font-size:15px;line-height:1.7')}>ขอบคุณที่ติดต่อ PMN Digital ทีมงานของเราจะติดต่อกลับภายใน 24 ชั่วโมง ระหว่างนี้อย่าลืมลงทะเบียนรับสิทธิพิเศษด้วยนะครับ</p>
                <div style={css('display:flex;gap:12px;flex-wrap:wrap')}>
                  <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:11px;padding:13px 22px;font-size:14.5px;font-weight:600;cursor:pointer')}>รับสิทธิพิเศษ →</button>
                  <button className="agG" onClick={() => { setCSubmitted(false); setContact({ name: '', email: '', company: '', service: SERVICE_OPTS[0], msg: '', hp: '' }); }} style={css('background:none;border:1px solid rgba(255,255,255,.16);color:#A7B0C4;border-radius:11px;padding:13px 22px;font-size:14.5px;cursor:pointer')}>ส่งอีกข้อความ</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitContact} style={css('display:flex;flex-direction:column;gap:16px')}>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.14em;color:#7B86A1;text-transform:uppercase`)}>Send a message</div>
                <input value={contact.hp} onChange={(e) => setContact({ ...contact, hp: e.target.value })} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden />
                <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
                  <div><label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>ชื่อ-นามสกุล</label><input className="agInp" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required placeholder="ชื่อของคุณ" style={css(INP)} /></div>
                  <div><label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>บริษัท / องค์กร</label><input className="agInp" value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} placeholder="ชื่อองค์กร" style={css(INP)} /></div>
                </div>
                <div><label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>อีเมล</label><input className="agInp" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} type="email" required placeholder="you@company.com" style={css(INP)} /></div>
                <div><label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>บริการที่สนใจ</label><select value={contact.service} onChange={(e) => setContact({ ...contact, service: e.target.value })} style={css(INP + ';cursor:pointer')}>{SERVICE_OPTS.map((o) => <option key={o} style={css('background:#0b101d')}>{o}</option>)}</select></div>
                <div><label style={css('display:block;font-size:13px;color:#A7B0C4;margin-bottom:7px')}>รายละเอียดโครงการ</label><textarea className="agInp" value={contact.msg} onChange={(e) => setContact({ ...contact, msg: e.target.value })} rows={4} placeholder="เล่าให้เราฟังเกี่ยวกับสิ่งที่คุณอยากทำ..." style={css(INP + ';resize:vertical;font-family:inherit;line-height:1.6')} /></div>
                <button className="agP" type="submit" style={css('background:#2563EB;color:#fff;border:none;border-radius:11px;padding:15px;font-size:15.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 30px -10px rgba(37,99,235,.8)')}>ส่งข้อความ →</button>
              </form>
            )}
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            {[
              { icon: css('width:18px;height:13px;border:1.7px solid #60A5FA;border-radius:3px'), k: 'EMAIL', v: c.contact.email },
              { icon: css('width:15px;height:15px;border:1.7px solid #60A5FA;border-radius:50%'), k: 'PHONE', v: c.contact.phone },
              { icon: css('width:13px;height:13px;border:1.7px solid #60A5FA;transform:rotate(45deg)'), k: 'OFFICE', v: c.contact.office },
            ].map((it) => (
              <div key={it.k} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;display:flex;align-items:center;gap:15px')}>
                <div style={css('width:44px;height:44px;border-radius:11px;background:rgba(37,99,235,.14);border:1px solid rgba(37,99,235,.32);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><span style={{ ...it.icon, display: 'block' }} /></div>
                <div><div style={css(`font-size:12px;color:#7B86A1;${MONO};letter-spacing:.06em;margin-bottom:3px`)}>{it.k}</div><div style={css('font-size:15px;font-weight:500')}>{it.v}</div></div>
              </div>
            ))}
            <div style={css('background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(56,189,248,.05));border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:22px')}>
              <div style={css(`font-size:12px;color:#7B86A1;${MONO};letter-spacing:.06em;margin-bottom:10px`)}>HOURS</div>
              <div style={css('display:flex;justify-content:space-between;font-size:14px;color:#C7D0E0;margin-bottom:6px')}><span>จันทร์ – ศุกร์</span><span>{c.contact.hoursWeekday}</span></div>
              <div style={css('display:flex;justify-content:space-between;font-size:14px;color:#8B95AC')}><span>เสาร์ – อาทิตย์</span><span>{c.contact.hoursWeekend}</span></div>
              <div style={css('margin-top:14px;display:flex;align-items:center;gap:8px;font-size:13px;color:#4ade80')}><span style={css('width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:pulseDot 1.8s infinite')} />{c.contact.responseNote}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="ag-root" style={{ position: 'relative', minHeight: '100vh', background: '#05070E', color: '#EAEEF6', fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',system-ui,sans-serif", overflowX: 'clip' }}>
      <style>{STYLE}</style>
      <div ref={progressRef} style={css('position:fixed;top:0;left:0;height:2px;width:100%;background:linear-gradient(90deg,#2563EB,#38BDF8);transform:scaleX(0);transform-origin:0 50%;z-index:120;transition:transform .1s linear')} />

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(7,9,16,.82)' : 'rgba(7,9,16,0)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : '1px solid rgba(255,255,255,0)', transition: 'background .3s,border-color .3s' }}>
        <div style={css('max-width:1240px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;justify-content:space-between;gap:24px')}>
          <button onClick={() => go('home')} style={css('background:none;border:none;cursor:pointer;display:flex;align-items:center;padding:0')}><Logo /></button>
          <div style={css('display:flex;align-items:center;gap:30px')} data-desktop-nav>
            {NAV.map((n) => (
              <button key={n.p} className="agNav" onClick={() => go(n.p)} style={navStyle(n.p)}>
                {n.label}
                {page === n.p && <span style={css('position:absolute;left:0;right:0;bottom:-3px;height:2px;background:#2563EB;border-radius:2px')} />}
              </button>
            ))}
          </div>
          <div style={css('display:flex;align-items:center;gap:12px')}>
            <button className="agP" onClick={goReg} style={css('display:inline-flex;align-items:center;gap:8px;background:#2563EB;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 6px 22px -6px rgba(37,99,235,.7)')}>รับสิทธิพิเศษ<span style={css('font-size:15px')}>→</span></button>
            <button onClick={() => setMenuOpen((o) => !o)} data-mobile-btn style={css('display:none;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;width:40px;height:40px;cursor:pointer;color:#EAEEF6;align-items:center;justify-content:center;font-size:18px')}>☰</button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div style={css('position:fixed;inset:0;z-index:99;background:rgba(5,7,14,.96);backdrop-filter:blur(8px);animation:fadeIn .25s both;display:flex;flex-direction:column;padding:90px 28px 28px')}>
          <button onClick={() => setMenuOpen(false)} style={css('position:absolute;top:18px;right:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:9px;width:42px;height:42px;color:#EAEEF6;font-size:20px;cursor:pointer')}>✕</button>
          {NAV.map((n) => (
            <button key={n.p} onClick={() => go(n.p)} style={css('background:none;border:none;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;color:#EAEEF6;font-size:22px;font-weight:600;padding:18px 4px;cursor:pointer')}>{n.label}</button>
          ))}
          <button onClick={goReg} style={css('margin-top:24px;background:#2563EB;color:#fff;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:600;cursor:pointer')}>{c.hero.ctaPrimary} →</button>
        </div>
      )}

      <main>
        {page === 'home' && renderHome()}
        {page === 'services' && renderServices()}
        {page === 'portfolio' && renderPortfolio()}
        {page === 'pricing' && renderPricing()}
        {page === 'contact' && renderContact()}
      </main>

      <footer style={css('border-top:1px solid rgba(255,255,255,.07);padding:64px 24px 36px;background:#070A12')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:36px;margin-bottom:48px')} data-footer-grid>
            <div>
              <div style={css('margin-bottom:18px')}><Logo h={34} /></div>
              <p style={css('margin:0 0 18px;color:#8B95AC;font-size:14px;line-height:1.7;max-width:320px;font-weight:300')}>{c.footer.desc}</p>
              <div style={css('display:flex;gap:10px')}>
                {SOCIAL_GLYPHS.map((sg) => {
                  const href = socials[sg.key] || '#';
                  return (
                    <a key={sg.key} href={href} aria-label={sg.label} target={href !== '#' ? '_blank' : undefined} rel="noopener noreferrer" className="agSoc" onClick={href === '#' ? (e) => e.preventDefault() : undefined} style={css('width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#A7B0C4;text-decoration:none')}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d={sg.d} /></svg>
                    </a>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#5C6680;text-transform:uppercase;margin-bottom:16px`)}>Services</div>
              {['ระบบฐานข้อมูล', 'ระบบ ERP', 'ระบบ CRM', 'ซอฟต์แวร์สั่งทำ'].map((t) => <button key={t} className="agLink" onClick={() => go('services')} style={css('display:block;background:none;border:none;color:#A7B0C4;font-size:14px;padding:6px 0;cursor:pointer;text-align:left')}>{t}</button>)}
            </div>
            <div>
              <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#5C6680;text-transform:uppercase;margin-bottom:16px`)}>Company</div>
              <button className="agLink" onClick={() => go('portfolio')} style={css('display:block;background:none;border:none;color:#A7B0C4;font-size:14px;padding:6px 0;cursor:pointer;text-align:left')}>ผลงาน</button>
              <button className="agLink" onClick={() => go('pricing')} style={css('display:block;background:none;border:none;color:#A7B0C4;font-size:14px;padding:6px 0;cursor:pointer;text-align:left')}>ราคา</button>
              <button className="agLink" onClick={() => go('contact')} style={css('display:block;background:none;border:none;color:#A7B0C4;font-size:14px;padding:6px 0;cursor:pointer;text-align:left')}>ติดต่อเรา</button>
              <a className="agLink" href="/blog" style={css('display:block;color:#A7B0C4;font-size:14px;padding:6px 0;text-decoration:none')}>บทความ</a>
            </div>
            <div>
              <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#5C6680;text-transform:uppercase;margin-bottom:16px`)}>Contact</div>
              <div style={css('color:#A7B0C4;font-size:14px;line-height:1.9')}>{c.contact.email}<br />{c.contact.phone}<br />{c.contact.office}</div>
            </div>
          </div>
          <div style={css('border-top:1px solid rgba(255,255,255,.07);padding-top:26px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap')}>
            <span style={css(`${MONO};font-size:12px;color:#5C6680`)}>© 2027 {settings?.siteName || 'PMN Digital'} Agency Co.,Ltd. — All rights reserved.</span>
            <span style={css(`${MONO};font-size:12px;color:#5C6680`)}>Crafted with precision in Bangkok</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
