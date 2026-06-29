'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';

/* Parse an inline CSS declaration string ("a:b;c:d") into a React style object,
   so the design's inline styles can be ported verbatim without hand camel-casing. */
function css(s: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (!prop) continue;
    o[prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return o as CSSProperties;
}

const C = {
  accent: '#2563EB',
  text: '#EAEEF6',
  bg: '#05070E',
};

const CLIENTS = ['NIMBUS', 'SIAM LOGISTICS', 'METROBANK', 'VOLT RETAIL', 'AETHER HEALTH', 'ORBIT FINANCE', 'THANA GROUP', 'KASET CO-OP'];

const SVCS = [
  { t: 'Database Systems', th: 'ออกแบบ & วิศวกรรมฐานข้อมูล', d: 'ออกแบบโครงสร้างข้อมูล จัดการ migration และปรับจูนประสิทธิภาพให้เร็วและปลอดภัย', icon: 'db' },
  { t: 'ERP', th: 'บริหารทรัพยากรองค์กร', d: 'บัญชี การเงิน คลังสินค้า จัดซื้อ ผลิต และ HR รวมไว้ในระบบเดียวที่เชื่อมกัน', icon: 'erp' },
  { t: 'CRM', th: 'บริหารลูกค้าสัมพันธ์', d: 'ดูแลไปป์ไลน์การขาย บริการหลังการขาย และการตลาดอัตโนมัติแบบครบวงจร', icon: 'crm' },
  { t: 'Custom Software', th: 'ซอฟต์แวร์สั่งทำเฉพาะทาง', d: 'เว็บแอป ระบบอัตโนมัติ API และแดชบอร์ดที่ออกแบบตามโจทย์ธุรกิจของคุณ', icon: 'code' },
];

const TECHS = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Node.js', '.NET', 'Python', 'React', 'Next.js', 'AWS', 'Google Cloud', 'Docker', 'Kubernetes'];

const STEPS = [
  { n: '01', t: 'Discovery', d: 'เข้าใจธุรกิจ เป้าหมาย และปัญหาที่แท้จริง' },
  { n: '02', t: 'Design', d: 'ออกแบบสถาปัตยกรรมระบบและ UX ที่ใช้ง่าย' },
  { n: '03', t: 'Build', d: 'พัฒนาเป็นสปรินต์ พร้อมเดโมให้เห็นทุกช่วง' },
  { n: '04', t: 'Deploy', d: 'นำขึ้นใช้งานจริง ทดสอบ และส่งมอบ' },
  { n: '05', t: 'Support', d: 'ดูแล อัปเดต และพัฒนาต่อยอดต่อเนื่อง' },
];

const WORKS = [
  { tag: 'ERP · Manufacturing', t: 'ระบบ ERP โรงงานผลิต', m: 'ลดต้นทุนสต็อก 32%', hue: '#2563EB' },
  { tag: 'CRM · Retail', t: 'CRM เครือค้าปลีก', m: 'ยอดซื้อซ้ำ +28%', hue: '#38BDF8' },
  { tag: 'Database · Fintech', t: 'ปรับสถาปัตยกรรมฐานข้อมูล', m: 'Query เร็วขึ้น 5 เท่า', hue: '#60A5FA' },
];

const PRIVS = [
  { t: 'ส่วนลด 20% สำหรับโปรเจกต์แรก', d: 'ใช้ได้กับทุกบริการ' },
  { t: 'ปรึกษาวางระบบฟรี 1 ชั่วโมง', d: 'มูลค่า ฿3,500 กับผู้เชี่ยวชาญ' },
  { t: 'ตรวจสุขภาพระบบ/ฐานข้อมูลฟรี', d: 'System & Database Audit' },
  { t: 'Priority support 3 เดือน', d: 'ตอบกลับเร็วเป็นพิเศษ' },
];

const QUOTES = [
  { q: 'ทีม PMN เข้าใจปัญหาหน้างานจริง ระบบ ERP ที่ได้ช่วยให้เราปิดบัญชีเร็วขึ้นมาก', n: 'คุณวีระ ส.', r: 'ผู้จัดการโรงงาน, SIAM LOGISTICS' },
  { q: 'ทำงานออนไลน์ตลอด เห็นความคืบหน้าทุกสัปดาห์ ส่งมอบตรงเวลาแบบที่หาได้ยาก', n: 'คุณนภัส ก.', r: 'COO, VOLT RETAIL' },
  { q: 'ฐานข้อมูลที่เคยช้ามาก หลังปรับใหม่เร็วขึ้นหลายเท่า คุ้มค่ามาก', n: 'คุณธนา พ.', r: 'CTO, ORBIT FINANCE' },
];

const SOCIALS = [
  { label: 'LinkedIn', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { label: 'Facebook', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { label: 'X', d: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  { label: 'Instagram', d: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z' },
];

const FAQS = [
  { q: 'เริ่มต้นโปรเจกต์ต้องทำอย่างไร?', a: 'เริ่มจากนัดคุยฟรีเพื่อเข้าใจโจทย์ จากนั้นเราสรุปขอบเขตงานและใบเสนอราคาให้ — ขั้นปรึกษาไม่มีค่าใช้จ่าย' },
  { q: 'ระยะเวลาในการพัฒนานานแค่ไหน?', a: 'ขึ้นกับขอบเขต โดยทั่วไประบบขนาดเล็ก 4–8 สัปดาห์ และระบบองค์กรขนาดใหญ่ 3–6 เดือน เราทำงานเป็นสปรินต์พร้อมเดโมเป็นระยะ' },
  { q: 'มีบริการดูแลหลังส่งมอบไหม?', a: 'มีครับ ทุกแพ็กเกจรวมระยะดูแลฟรี และต่อสัญญา support รายเดือน/รายปีเพื่อดูแลและพัฒนาต่อยอดได้' },
  { q: 'ราคาที่แสดงรวมอะไรบ้าง?', a: 'รวมการออกแบบ พัฒนา ทดสอบ ติดตั้ง และอบรมการใช้งานเบื้องต้น ส่วนค่าคลาวด์/ไลเซนส์ภายนอกแจ้งแยกตามจริง' },
  { q: 'ทำงานกับธุรกิจขนาดเล็กไหม?', a: 'แน่นอน แพ็กเกจ Starter ออกแบบมาเพื่อ SME โดยเฉพาะ เริ่มต้นได้ในงบที่จับต้องได้' },
];

const ALL_WORK = [
  { cat: 'erp', tag: 'ERP · Manufacturing', t: 'ระบบ ERP โรงงานผลิตชิ้นส่วน', d: 'รวมการผลิต คลัง และบัญชีไว้ในระบบเดียว', m: 'ลดต้นทุนสต็อก 32%' },
  { cat: 'crm', tag: 'CRM · Retail', t: 'CRM เครือร้านค้าปลีก 40 สาขา', d: 'รวมข้อมูลลูกค้าและโปรแกรมสมาชิก', m: 'ยอดซื้อซ้ำ +28%' },
  { cat: 'database', tag: 'Database · Fintech', t: 'ปรับสถาปัตยกรรมฐานข้อมูล', d: 'ออกแบบใหม่และทำ indexing เชิงลึก', m: 'Query เร็วขึ้น 5 เท่า' },
  { cat: 'custom', tag: 'Custom · Logistics', t: 'แพลตฟอร์มติดตามขนส่งเรียลไทม์', d: 'เว็บแอป + แดชบอร์ด + API', m: 'ลดเวลาตรวจงาน 45%' },
  { cat: 'erp', tag: 'ERP · Distribution', t: 'ระบบจัดจำหน่ายและคลังกระจายสินค้า', d: 'จัดการหลายคลังและเส้นทางจัดส่ง', m: 'ส่งตรงเวลา 99.2%' },
  { cat: 'custom', tag: 'Custom · Healthcare', t: 'ระบบนัดหมายและเวชระเบียน', d: 'ออกแบบ UX สำหรับบุคลากรแพทย์', m: 'ลดเวลารอคิว 38%' },
];

const FILTERS = [
  { label: 'ทั้งหมด', cat: 'all' },
  { label: 'ERP', cat: 'erp' },
  { label: 'CRM', cat: 'crm' },
  { label: 'Database', cat: 'database' },
  { label: 'Custom', cat: 'custom' },
];

const fmt = (n: number) => '฿' + n.toLocaleString('en-US');

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
const MONO = "font-family:'IBM Plex Mono',monospace";
const INP = 'width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;color:#EAEEF6;font-size:14.5px;outline:none';
const CHECK = 'display:flex;gap:10px;font-size:14.5px;color:#C7D0E0';
const SERVICE_OPTS = ['ระบบฐานข้อมูล (Database)', 'ระบบ ERP', 'ระบบ CRM', 'ซอฟต์แวร์สั่งทำ (Custom)', 'อื่น ๆ / ยังไม่แน่ใจ'];

type Page = 'home' | 'services' | 'portfolio' | 'pricing' | 'contact';

export default function AgencySite() {
  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [discount, setDiscount] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [workFilter, setWorkFilter] = useState('all');
  const [reg, setReg] = useState({ name: '', email: '', phone: '', service: SERVICE_OPTS[0] });
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', company: '', service: SERVICE_OPTS[0], msg: '' });
  const [cSubmitted, setCSubmitted] = useState(false);
  const [stats, setStats] = useState({ projects: 0, clients: 0, years: 0, uptime: 0 });

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
    const targets = { projects: 120, clients: 80, years: 8, uptime: 99.9 };
    const dur = 1500, t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setStats({
        projects: Math.round(targets.projects * e),
        clients: Math.round(targets.clients * e),
        years: Math.round(targets.years * e),
        uptime: +(targets.uptime * e).toFixed(1),
      });
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
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
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
    try { navigator.clipboard?.writeText('PMN-WELCOME20')?.catch(() => {}); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  const navStyle = (p: Page): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500, letterSpacing: '.01em',
    color: page === p ? '#EAEEF6' : '#99A3B8', padding: '8px 2px', position: 'relative',
  });
  const NAV: { p: Page; label: string }[] = [
    { p: 'home', label: 'Home' }, { p: 'services', label: 'Services' }, { p: 'portfolio', label: 'Portfolio' },
    { p: 'pricing', label: 'Pricing' }, { p: 'contact', label: 'Contact' },
  ];

  const Logo = ({ size = 19 }: { size?: number }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={css('width:28px;height:28px;border-radius:8px;background:linear-gradient(150deg,#2563EB,#38BDF8);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;box-shadow:0 6px 18px -6px rgba(37,99,235,.8)')}>P</span>
      <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 700, fontSize: size, letterSpacing: '-.01em', color: '#EAEEF6', whiteSpace: 'nowrap' }}>
        PMN <span style={{ color: '#60A5FA' }}>Digital</span>
      </span>
    </span>
  );

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
              <span style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase`)}>Digital Systems Agency</span>
            </div>
            <h1 style={css('margin:0 0 22px;font-size:clamp(38px,5vw,62px);line-height:1.06;letter-spacing:-.02em;font-weight:700;animation:fadeUp .6s .12s both')}>ออกแบบ <span style={css('background:linear-gradient(100deg,#60A5FA,#38BDF8);-webkit-background-clip:text;background-clip:text;color:transparent')}>“ระบบ”</span> ที่ธุรกิจคุณ<br />ต้องการจริง ๆ</h1>
            <p style={css('margin:0 0 34px;max-width:540px;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300;animation:fadeUp .6s .2s both')}>PMN Digital รับออกแบบและพัฒนา <strong style={css('color:#EAEEF6;font-weight:500')}>ระบบฐานข้อมูล · ERP · CRM</strong> และซอฟต์แวร์เฉพาะทางแบบครบวงจร ทำงานออนไลน์ บริหารโดยทีมยุคใหม่ที่เข้าใจทั้งเทคโนโลยีและธุรกิจของคุณ</p>
            <div style={css('display:flex;flex-wrap:wrap;gap:14px;margin-bottom:36px;animation:fadeUp .6s .28s both')}>
              <button className="agP" onClick={goReg} style={css(CTA_P)}>รับสิทธิพิเศษฟรี<span>→</span></button>
              <button className="agG" onClick={() => go('services')} style={css(CTA_G)}>ดูบริการทั้งหมด</button>
            </div>
            <div style={css(`display:flex;align-items:center;gap:10px;${MONO};font-size:12.5px;color:#5C6680;letter-spacing:.04em;animation:fadeUp .6s .36s both`)}>
              <span style={css('color:#9FC0FF')}>80+</span> องค์กรไว้วางใจ<span style={css('opacity:.4')}>·</span><span style={css('color:#9FC0FF')}>120+</span> โปรเจกต์ส่งมอบแล้ว
            </div>
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
          <p style={css(`text-align:center;${MONO};font-size:11px;letter-spacing:.22em;color:#5C6680;text-transform:uppercase;margin:0 0 22px`)}>หน่วยงานที่ไว้วางใจ — Trusted by teams</p>
          <div style={css('overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)')}>
            <div style={css('display:flex;gap:64px;width:max-content;animation:marquee 32s linear infinite;align-items:center;opacity:.62')}>
              {[...CLIENTS, ...CLIENTS].map((c, i) => (
                <span key={i} style={css("font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:20px;letter-spacing:.04em;color:#C7D0E0;white-space:nowrap")}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:104px 24px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')}>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>01</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>What we build</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>บริการที่เราดำเนินการให้</h2>
              </div>
            </div>
            <button className="agG" onClick={() => go('services')} style={css('display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.16);color:#EAEEF6;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;align-self:flex-end')}>ดูบริการทั้งหมด →</button>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:18px')} data-svc-grid>
            {SVCS.map((sv, i) => (
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
          {[[`${stats.projects}+`, 'โปรเจกต์ที่ส่งมอบ', true], [`${stats.clients}+`, 'องค์กรที่ไว้วางใจ', true], [`${stats.years}+`, 'ปีของประสบการณ์', true], [`${stats.uptime}%`, 'ความเสถียรเฉลี่ย', false]].map(([v, l, br], i) => (
            <div key={i} style={css(`padding:36px 30px${br ? ';border-right:1px solid rgba(255,255,255,.08)' : ''}`)}>
              <div style={css('font-size:clamp(34px,4.4vw,54px);font-weight:700;letter-spacing:-.035em;line-height:1')}>{v}</div>
              <div style={css('color:#7B86A1;font-size:13.5px;margin-top:10px')}>{l}</div>
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
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>Why PMN</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.06;letter-spacing:-.025em;font-weight:700')}>ทีมยุคใหม่<br />ที่เข้าใจธุรกิจ</h2>
              </div>
            </div>
            <p style={css('margin:0 0 4px;color:#A7B0C4;font-size:16px;line-height:1.72;font-weight:300')}>เราไม่ได้แค่เขียนโค้ด — เราเข้าใจกระบวนการทำงานของคุณ แล้วออกแบบระบบให้คนใช้งานได้จริง วัดผลได้ และเติบโตต่อไปกับธุรกิจ</p>
          </div>
          <div style={css('display:grid;grid-template-columns:1.4fr 1fr 1fr;grid-auto-rows:minmax(0,auto);gap:18px')} data-bento>
            <div style={css('grid-row:span 2;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:30px;position:relative;overflow:hidden')}>
              <div style={css('position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.35),transparent 65%);filter:blur(20px)')} />
              <div style={css('position:relative')}>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>Tech Stack</div>
                <h3 style={css('margin:0 0 10px;font-size:22px;font-weight:600;letter-spacing:-.01em')}>เครื่องมือระดับโลก เลือกใช้ให้เหมาะกับงาน</h3>
                <p style={css('margin:0 0 22px;color:#A7B0C4;font-size:14.5px;line-height:1.65')}>เราเลือกเทคโนโลยีจากโจทย์จริง ไม่ยึดติดเครื่องมือเดียว เพื่อความเร็ว ความปลอดภัย และการดูแลระยะยาว</p>
                <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>{TECHS.map((t) => <span key={t} style={css(`${MONO};font-size:12px;color:#C7D0E0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 11px`)}>{t}</span>)}</div>
              </div>
            </div>
            {[
              { icon: css('width:16px;height:16px;border:2px solid #60A5FA;border-radius:50%'), h: 'ทำงานออนไลน์ 100%', d: 'ประชุม ส่งงาน ติดตามความคืบหน้าผ่านระบบออนไลน์ โปร่งใส ตรวจสอบได้ทุกขั้นตอน' },
              { icon: css('width:15px;height:18px;border:2px solid #60A5FA;border-radius:4px'), h: 'ความปลอดภัยเป็นมาตรฐาน', d: 'เข้ารหัสข้อมูล สำรองอัตโนมัติ และวางสิทธิ์การเข้าถึงตามบทบาท ตั้งแต่วันแรก' },
              { icon: css('width:16px;height:16px;border:2px solid #60A5FA;transform:rotate(45deg)'), h: 'ส่งมอบตรงเวลา', d: 'วางแผนเป็นสปรินต์ มีเดโมให้เห็นภาพทุกช่วง ลดความเสี่ยงงานบานปลาย' },
              { icon: css('width:18px;height:12px;border:2px solid #60A5FA;border-radius:3px'), h: 'ดูแลต่อเนื่องหลังส่งมอบ', d: 'มีทีม support คอยดูแล อัปเดต และพัฒนาต่อยอดให้ระบบโตไปกับธุรกิจ' },
            ].map((b, i) => (
              <div key={i} className="agCard" style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:26px')}>
                <div style={css('width:42px;height:42px;border-radius:11px;background:rgba(37,99,235,.16);border:1px solid rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center;margin-bottom:16px')}><span style={{ ...b.icon, display: 'block' }} /></div>
                <h3 style={css('margin:0 0 8px;font-size:17px;font-weight:600')}>{b.h}</h3>
                <p style={css('margin:0;color:#8B95AC;font-size:13.5px;line-height:1.6')}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')}>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>03</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>How we work</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>กระบวนการทำงานแบบครบวงจร</h2>
              </div>
            </div>
            <div style={css(`${MONO};font-size:12px;color:#5C6680;letter-spacing:.04em;align-self:flex-end`)}>5 ขั้นตอน · จบในทีมเดียว</div>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(5,1fr);gap:14px;position:relative')} data-process>{renderSteps()}</div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 100px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')}>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>04</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>Selected work</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>ผลงานล่าสุด</h2>
              </div>
            </div>
            <button className="agG" onClick={() => go('portfolio')} style={css('display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.16);color:#EAEEF6;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;align-self:flex-end')}>ดูผลงานทั้งหมด →</button>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px')} data-work-grid>
            {WORKS.map((w, i) => (
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
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:38px')}>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>05</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>Plans</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>แพ็กเกจที่ยืดหยุ่นตามธุรกิจ</h2>
              </div>
            </div>
            {renderDiscountToggle('align-self:flex-end')}
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch')} data-pricing-mini>{renderPricingMini()}</div>
        </div>
      </section>

      <section id="register" data-reveal style={css('padding:30px 24px 100px;scroll-margin-top:90px')}>
        <div style={css('max-width:1240px;margin:0 auto;position:relative;border:1px solid rgba(255,255,255,.1);border-radius:26px;overflow:hidden;background:linear-gradient(135deg,rgba(37,99,235,.16),rgba(7,10,20,.4))')}>
          <div style={css('position:absolute;top:-120px;left:-80px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.28),transparent 65%);filter:blur(40px);pointer-events:none')} />
          <div style={css('position:relative;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:52px 46px')} data-reg-grid>
            <div>
              <div style={css('display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border:1px solid rgba(56,189,248,.4);background:rgba(56,189,248,.1);border-radius:100px;margin-bottom:22px')}><span style={css(`${MONO};font-size:11px;letter-spacing:.18em;color:#7FD7FF;text-transform:uppercase`)}>Members only</span></div>
              <h2 style={css('margin:0 0 16px;font-size:clamp(28px,3.2vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>ลงทะเบียนวันนี้<br />รับสิทธิพิเศษทันที</h2>
              <p style={css('margin:0 0 26px;color:#B6C0D4;font-size:16px;line-height:1.7;font-weight:300;max-width:440px')}>กรอกข้อมูลสั้น ๆ เพื่อรับคูปองส่วนลดและสิทธิ์เฉพาะสมาชิก ใช้ได้กับทุกบริการของ PMN Digital</p>
              <div style={css('display:flex;flex-direction:column;gap:14px')}>
                {PRIVS.map((p, i) => (
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
                    <span style={css(`${MONO};font-size:22px;font-weight:600;letter-spacing:.06em;color:#9FC0FF;flex:1`)}>PMN-WELCOME20</span>
                    <button className="agP" onClick={copyCoupon} style={css('background:#2563EB;color:#fff;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap')}>{copied ? 'Copied ✓' : 'Copy'}</button>
                  </div>
                  <div style={css('font-size:13px;color:#8B95AC;line-height:1.6;margin-bottom:24px')}>ส่วนลด <strong style={css('color:#EAEEF6')}>20%</strong> สำหรับโปรเจกต์แรก + สิทธิ์สมาชิกทั้งหมดด้านซ้าย</div>
                  <button className="agG" onClick={() => { setRegSubmitted(false); setReg({ name: '', email: '', phone: '', service: SERVICE_OPTS[0] }); setCopied(false); }} style={css('background:none;border:1px solid rgba(255,255,255,.16);color:#A7B0C4;border-radius:10px;padding:11px;font-size:13.5px;cursor:pointer')}>ลงทะเบียนอีกครั้ง</button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setRegSubmitted(true); setCopied(false); }} style={css('background:rgba(8,12,22,.6);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:30px;display:flex;flex-direction:column;gap:14px')}>
                  <div style={css(`${MONO};font-size:11px;letter-spacing:.14em;color:#7B86A1;text-transform:uppercase;margin-bottom:2px`)}>Register form</div>
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
                  <button className="agP" type="submit" style={css('margin-top:6px;background:#2563EB;color:#fff;border:none;border-radius:11px;padding:15px;font-size:15.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 30px -10px rgba(37,99,235,.8)')}>รับสิทธิพิเศษฟรี →</button>
                  <p style={css('margin:2px 0 0;font-size:11.5px;color:#5C6680;text-align:center')}>เราเคารพความเป็นส่วนตัวของคุณ · ไม่มีค่าใช้จ่าย</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal style={css('padding:30px 24px 110px')}>
        <div style={css('max-width:1240px;margin:0 auto')}>
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:28px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;margin-bottom:46px')}>
            <div style={css('display:flex;align-items:baseline;gap:16px')}>
              <span style={css(`${MONO};font-size:13px;color:#3f6fc4;font-weight:500`)}>06</span>
              <div>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.2em;color:#5C6680;text-transform:uppercase;margin-bottom:10px`)}>Testimonials</div>
                <h2 style={css('margin:0;font-size:clamp(29px,3.5vw,43px);line-height:1.08;letter-spacing:-.025em;font-weight:700')}>ลูกค้าพูดถึงเรา</h2>
              </div>
            </div>
            <div style={css(`${MONO};font-size:12px;color:#5C6680;letter-spacing:.04em;align-self:flex-end`)}>จากลูกค้าจริงของเรา</div>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:18px')} data-quotes>
            {QUOTES.map((q, i) => (
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

      <section data-reveal style={css('padding:20px 24px 110px')}>
        <div style={css('max-width:1080px;margin:0 auto;position:relative;border:1px solid rgba(255,255,255,.1);border-radius:26px;padding:64px 40px;text-align:center;overflow:hidden;background:radial-gradient(ellipse 80% 120% at 50% 0%,rgba(37,99,235,.22),rgba(7,10,20,.2))')}>
          <div style={css('position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:40px 40px;-webkit-mask-image:radial-gradient(ellipse 70% 80% at 50% 30%,#000,transparent 75%);mask-image:radial-gradient(ellipse 70% 80% at 50% 30%,#000,transparent 75%)')} />
          <div style={css('position:relative')}>
            <h2 style={css('margin:0 0 16px;font-size:clamp(28px,3.6vw,46px);line-height:1.12;letter-spacing:-.02em;font-weight:700')}>พร้อมเปลี่ยนธุรกิจให้เป็นระบบแล้วหรือยัง?</h2>
            <p style={css('margin:0 auto 30px;max-width:520px;color:#B6C0D4;font-size:17px;line-height:1.7;font-weight:300')}>นัดคุยกับทีม PMN ฟรี ไม่มีข้อผูกมัด — เราจะช่วยวางแผนระบบที่เหมาะกับคุณที่สุด</p>
            <div style={css('display:flex;gap:14px;justify-content:center;flex-wrap:wrap')}>
              <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>รับสิทธิพิเศษฟรี →</button>
              <button className="agG" onClick={() => go('contact')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ติดต่อทีมงาน</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  function renderSteps() {
    return STEPS.map((st, i) => (
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
    const tiers = [
      { name: 'Starter', th: 'ธุรกิจเริ่มต้น / SME', base: 35000, disc: 28000, custom: false, feats: ['ระบบเดียว ขอบเขตชัดเจน', 'ฐานข้อมูลมาตรฐาน', 'ดูแลฟรี 3 เดือน'], popular: false },
      { name: 'Pro', th: 'ธุรกิจกำลังเติบโต', base: 149000, disc: 119000, custom: false, feats: ['หลายโมดูลเชื่อมกัน', 'ออกแบบ UX เฉพาะ + API', 'ดูแลฟรี 6 เดือน'], popular: true },
      { name: 'Enterprise', th: 'องค์กรขนาดใหญ่', base: 0, disc: 0, custom: true, feats: ['ออกแบบสถาปัตยกรรมเฉพาะ', 'รองรับสเกล + ความปลอดภัยสูง', 'SLA + ทีมดูแลเฉพาะ'], popular: false },
    ];
    return tiers.map((t, i) => (
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
  const SVC_DETAILS = [
    { n: '01 · Database', h: 'ออกแบบ & วิศวกรรมฐานข้อมูล', p: 'หัวใจของทุกระบบคือข้อมูลที่ออกแบบมาดี เราวางโครงสร้างให้ขยายได้ ปลอดภัย และเร็ว พร้อมย้ายข้อมูลเดิมอย่างไร้รอยต่อ', feats: ['Data Modeling & Schema Design', 'Migration จากระบบเดิมอย่างปลอดภัย', 'Query Optimization & Indexing', 'Backup, Replication & Security'] },
    { n: '02 · ERP', h: 'ระบบบริหารทรัพยากรองค์กร', p: 'รวมทุกฝ่ายให้ทำงานบนข้อมูลชุดเดียวกัน ลดงานซ้ำซ้อน เห็นภาพรวมธุรกิจแบบเรียลไทม์ ตัดสินใจได้เร็วขึ้น', feats: ['บัญชี การเงิน และงบประมาณ', 'คลังสินค้า จัดซื้อ และซัพพลายเชน', 'การผลิตและการวางแผน (MRP)', 'HR และระบบเงินเดือน'] },
    { n: '03 · CRM', h: 'ระบบบริหารลูกค้าสัมพันธ์', p: 'ดูแลลูกค้าตั้งแต่ลีดแรกจนปิดการขายและบริการหลังการขาย เก็บทุกปฏิสัมพันธ์ไว้ในที่เดียว เพิ่มยอดขายซ้ำ', feats: ['Sales Pipeline & Lead Management', 'Ticketing & บริการหลังการขาย', 'Marketing Automation', 'รายงานและการวิเคราะห์ลูกค้า'] },
    { n: '04 · Custom', h: 'ซอฟต์แวร์สั่งทำเฉพาะทาง', p: 'เมื่อระบบสำเร็จรูปไม่ตอบโจทย์ เราสร้างให้ตรงกับกระบวนการของคุณเป๊ะ ๆ ทั้งเว็บแอป ระบบอัตโนมัติ และการเชื่อมต่อ', feats: ['Web Application & Dashboard', 'Workflow & Process Automation', 'API & System Integration', 'Mobile-ready & Cloud-native'] },
  ];
  const MORE = [
    { k: 'CLOUD', h: 'Cloud & DevOps', d: 'ติดตั้งบนคลาวด์ ปรับขนาดอัตโนมัติ และ CI/CD' },
    { k: 'DATA', h: 'Analytics & BI', d: 'แดชบอร์ดและรายงานที่อ่านง่าย ตัดสินใจไว' },
    { k: 'CONNECT', h: 'System Integration', d: 'เชื่อมระบบเดิม ภาครัฐ และ third-party' },
    { k: 'CARE', h: 'Maintenance & Support', d: 'ดูแล อัปเดต และพัฒนาต่อยอดต่อเนื่อง' },
  ];
  const renderServices = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 40px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.28),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:820px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Services</div>
          <h1 style={css('margin:0 0 20px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>บริการที่เราดำเนินการให้<br /><span style={css('color:#5C6680')}>ครบทุกขั้นตอน ในที่เดียว</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>ตั้งแต่วางสถาปัตยกรรมข้อมูล จนถึงระบบที่พนักงานใช้งานจริงทุกวัน — PMN ออกแบบ พัฒนา ติดตั้ง และดูแลให้แบบจบในทีมเดียว</p>
        </div>
      </section>
      <section data-reveal style={css('padding:50px 24px 30px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:20px')}>
          {SVC_DETAILS.map((s, i) => (
            <div key={i} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:40px')} data-svc-detail>
              <div>
                <div style={css('display:flex;align-items:center;gap:14px;margin-bottom:18px')}>
                  <div style={css('width:52px;height:52px;border-radius:14px;background:rgba(37,99,235,.16);border:1px solid rgba(37,99,235,.35);display:flex;align-items:center;justify-content:center')}><ServiceIcon kind={SVCS[i].icon} /></div>
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
          <div style={css('text-align:center;margin-bottom:40px')}><div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:14px`)}>More</div><h2 style={css('margin:0;font-size:clamp(26px,3vw,38px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>บริการเสริมที่ทำให้ระบบสมบูรณ์</h2></div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:16px')} data-more-grid>
            {MORE.map((m, i) => (
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
              <h2 style={css('margin:0 0 14px;font-size:clamp(24px,2.6vw,34px);line-height:1.18;letter-spacing:-.02em;font-weight:700')}>ความเชี่ยวชาญด้านเทคโนโลยี</h2>
              <p style={css('margin:0;color:#A7B0C4;font-size:15px;line-height:1.7')}>เราเลือกเครื่องมือจากโจทย์จริง ผสานความรู้ด้านสถาปัตยกรรมระบบ ความปลอดภัย และประสบการณ์จากหลายอุตสาหกรรม</p>
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>{TECHS.map((t) => <span key={t} style={css(`${MONO};font-size:12px;color:#C7D0E0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 11px`)}>{t}</span>)}</div>
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
            <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>รับสิทธิพิเศษฟรี →</button>
            <button className="agG" onClick={() => go('pricing')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ดูแพ็กเกจและราคา</button>
          </div>
        </div>
      </section>
    </div>
  );

  /* ---------------- PORTFOLIO ---------------- */
  const filteredWork = workFilter === 'all' ? ALL_WORK : ALL_WORK.filter((w) => w.cat === workFilter);
  const renderPortfolio = () => (
    <div style={css('animation:fadeUp .55s cubic-bezier(.22,.7,.2,1) both;padding-top:40px')}>
      <section style={css('padding:96px 24px 24px;text-align:center;position:relative;overflow:hidden')}>
        <div style={css('position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:680px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.26),transparent 65%);filter:blur(50px);pointer-events:none')} />
        <div style={css('position:relative;max-width:780px;margin:0 auto')}>
          <div style={css(`${MONO};font-size:11.5px;letter-spacing:.22em;color:#9FC0FF;text-transform:uppercase;margin-bottom:16px`)}>Portfolio</div>
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>ผลงานที่เราภูมิใจ <span style={css('color:#5C6680')}>วัดผลได้จริง</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>ระบบที่เราส่งมอบให้ลูกค้าหลากหลายอุตสาหกรรม พร้อมผลลัพธ์ที่จับต้องได้</p>
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
          {[['120+', 'โปรเจกต์ส่งมอบ'], ['80+', 'องค์กรลูกค้า'], ['14', 'อุตสาหกรรม'], ['98%', 'ลูกค้ากลับมาใช้ซ้ำ']].map(([v, l]) => (
            <div key={l} style={css('text-align:center')}><div style={css('font-size:clamp(30px,3.4vw,44px);font-weight:700;letter-spacing:-.02em;background:linear-gradient(180deg,#fff,#9FC0FF);-webkit-background-clip:text;background-clip:text;color:transparent')}>{v}</div><div style={css('color:#A7B0C4;font-size:14px;margin-top:6px')}>{l}</div></div>
          ))}
        </div>
      </section>
      <section data-reveal style={css('padding:10px 24px 100px')}>
        <div style={css('max-width:1080px;margin:0 auto;border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:56px 40px;text-align:center;background:radial-gradient(ellipse 80% 120% at 50% 0%,rgba(37,99,235,.2),rgba(7,10,20,.2))')}>
          <h2 style={css('margin:0 0 14px;font-size:clamp(26px,3.4vw,40px);line-height:1.14;letter-spacing:-.02em;font-weight:700')}>อยากให้ธุรกิจคุณเป็นผลงานชิ้นต่อไป?</h2>
          <p style={css('margin:0 auto 28px;max-width:520px;color:#B6C0D4;font-size:16px;line-height:1.7;font-weight:300')}>เริ่มต้นด้วยการลงทะเบียนรับสิทธิพิเศษ แล้วเราจะติดต่อกลับเพื่อวางแผนร่วมกัน</p>
          <div style={css('display:flex;gap:14px;justify-content:center;flex-wrap:wrap')}>
            <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:12px;padding:15px 28px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 12px 34px -10px rgba(37,99,235,.85)')}>รับสิทธิพิเศษฟรี →</button>
            <button className="agG" onClick={() => go('contact')} style={css('background:rgba(255,255,255,.04);color:#EAEEF6;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:15px 28px;font-size:16px;font-weight:500;cursor:pointer')}>ติดต่อเรา</button>
          </div>
        </div>
      </section>
    </div>
  );

  /* ---------------- PRICING ---------------- */
  const starterPrice = discount ? fmt(28000) : fmt(35000);
  const proPrice = discount ? fmt(119000) : fmt(149000);
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
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>ราคาที่โปร่งใส <span style={css('color:#5C6680')}>ยืดหยุ่นตามธุรกิจ</span></h1>
          <p style={css('margin:0 0 30px;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>เลือกแพ็กเกจที่เหมาะกับขนาดธุรกิจคุณ ทุกแพ็กเกจปรับแต่งได้ และมีทีมดูแลหลังส่งมอบ</p>
          <div style={css('display:flex;justify-content:center')}>{renderDiscountToggle('')}</div>
        </div>
      </section>
      <section data-reveal style={css('padding:30px 24px 30px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:stretch')} data-price-grid>
          <div style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:32px 30px;display:flex;flex-direction:column')}>
            <div style={css(`${MONO};font-size:12px;letter-spacing:.12em;color:#7B86A1;text-transform:uppercase;margin-bottom:6px`)}>Starter</div>
            <div style={css('font-size:14px;color:#A7B0C4;margin-bottom:14px')}>ธุรกิจเริ่มต้น / SME</div>
            <div style={css('margin-bottom:8px;min-height:30px')}>
              {discount && <span style={css('font-size:16px;color:#5C6680;text-decoration:line-through;margin-right:9px')}>{fmt(35000)}</span>}
              <span style={css('font-size:34px;font-weight:700;letter-spacing:-.02em;color:#fff')}>{starterPrice}</span>
            </div>
            <div style={css('font-size:13px;color:#8B95AC;margin-bottom:24px')}>เริ่มต้น · ราคาต่อโปรเจกต์</div>
            <div style={css('display:flex;flex-direction:column;gap:12px;margin-bottom:28px;flex:1')}>
              {['ระบบเดียว ขอบเขตชัดเจน', 'ฐานข้อมูลมาตรฐาน', 'ออกแบบ UI พื้นฐาน', 'อบรมการใช้งาน', 'ดูแลฟรี 3 เดือน'].map((f) => <div key={f} style={css('display:flex;gap:10px;font-size:14px;color:#C7D0E0')}><span style={css('color:#60A5FA')}>✓</span> {f}</div>)}
            </div>
            <button className="agG" onClick={goReg} style={css('background:rgba(255,255,255,.05);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:13px;font-size:14.5px;font-weight:600;cursor:pointer')}>เริ่มต้นแพ็กเกจนี้</button>
          </div>
          <div style={css('background:linear-gradient(165deg,rgba(37,99,235,.18),rgba(255,255,255,.02));border:1px solid rgba(96,165,250,.5);border-radius:22px;padding:32px 30px;display:flex;flex-direction:column;position:relative;box-shadow:0 28px 70px -30px rgba(37,99,235,.8)')}>
            <div style={css('position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#2563EB;color:#fff;font-size:11px;font-weight:600;letter-spacing:.04em;padding:6px 15px;border-radius:100px;white-space:nowrap;box-shadow:0 8px 20px -6px rgba(37,99,235,.8)')}>แนะนำ · MOST POPULAR</div>
            <div style={css(`${MONO};font-size:12px;letter-spacing:.12em;color:#9FC0FF;text-transform:uppercase;margin-bottom:6px`)}>Pro</div>
            <div style={css('font-size:14px;color:#A7B0C4;margin-bottom:14px')}>ธุรกิจกำลังเติบโต</div>
            <div style={css('margin-bottom:8px;min-height:30px')}>
              {discount && <span style={css('font-size:16px;color:#7B86A1;text-decoration:line-through;margin-right:9px')}>{fmt(149000)}</span>}
              <span style={css('font-size:34px;font-weight:700;letter-spacing:-.02em;color:#fff')}>{proPrice}</span>
            </div>
            <div style={css('font-size:13px;color:#A7B0C4;margin-bottom:24px')}>เริ่มต้น · ราคาต่อโปรเจกต์</div>
            <div style={css('display:flex;flex-direction:column;gap:12px;margin-bottom:28px;flex:1')}>
              {['หลายโมดูลเชื่อมกัน (สูงสุด 5)', 'ออกแบบ UX เฉพาะธุรกิจ', 'API & System Integration', 'รายงาน & แดชบอร์ด BI', 'ดูแลฟรี 6 เดือน + Priority support'].map((f) => <div key={f} style={css('display:flex;gap:10px;font-size:14px;color:#EAEEF6')}><span style={css('color:#60A5FA')}>✓</span> {f}</div>)}
            </div>
            <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:11px;padding:13px;font-size:14.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 30px -10px rgba(37,99,235,.8)')}>เลือกแพ็กเกจนี้</button>
          </div>
          <div style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:32px 30px;display:flex;flex-direction:column')}>
            <div style={css(`${MONO};font-size:12px;letter-spacing:.12em;color:#7B86A1;text-transform:uppercase;margin-bottom:6px`)}>Enterprise</div>
            <div style={css('font-size:14px;color:#A7B0C4;margin-bottom:14px')}>องค์กรขนาดใหญ่</div>
            <div style={css('margin-bottom:8px;min-height:30px')}><span style={css('font-size:34px;font-weight:700;letter-spacing:-.02em;color:#fff')}>Custom</span></div>
            <div style={css('font-size:13px;color:#8B95AC;margin-bottom:24px')}>ราคาตามขอบเขตงาน</div>
            <div style={css('display:flex;flex-direction:column;gap:12px;margin-bottom:28px;flex:1')}>
              {['ออกแบบสถาปัตยกรรมเฉพาะ', 'รองรับสเกลสูง + ความปลอดภัยองค์กร', 'Integration ไม่จำกัด', 'SLA + ทีมดูแลเฉพาะ', 'On-premise / Private cloud'].map((f) => <div key={f} style={css('display:flex;gap:10px;font-size:14px;color:#C7D0E0')}><span style={css('color:#60A5FA')}>✓</span> {f}</div>)}
            </div>
            <button className="agG" onClick={() => go('contact')} style={css('background:rgba(255,255,255,.05);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:13px;font-size:14.5px;font-weight:600;cursor:pointer')}>ขอใบเสนอราคา</button>
          </div>
        </div>
      </section>
      <section data-reveal style={css('padding:20px 24px 40px')}>
        <div style={css('max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:linear-gradient(135deg,rgba(56,189,248,.14),rgba(37,99,235,.08));border:1px dashed rgba(96,165,250,.5);border-radius:18px;padding:24px 30px')}>
          <div style={css('display:flex;align-items:center;gap:16px')}>
            <div style={css(`${MONO};font-size:15px;font-weight:600;color:#7FD7FF;border:1px dashed rgba(127,215,255,.5);border-radius:9px;padding:11px 13px;letter-spacing:.02em;white-space:nowrap`)}>−20%</div>
            <div><div style={css('font-size:17px;font-weight:600;margin-bottom:3px')}>ลงทะเบียนรับคูปองส่วนลด 20%</div><div style={css('font-size:14px;color:#A7B0C4')}>โค้ด <span style={css(`${MONO};color:#9FC0FF`)}>PMN-WELCOME20</span> + ปรึกษาวางระบบฟรี 1 ชั่วโมง</div></div>
          </div>
          <button className="agP" onClick={goReg} style={css('background:#2563EB;color:#fff;border:none;border-radius:11px;padding:13px 22px;font-size:14.5px;font-weight:600;cursor:pointer;white-space:nowrap')}>รับคูปองเลย →</button>
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
            {FAQS.map((f, i) => {
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
          <h1 style={css('margin:0 0 18px;font-size:clamp(34px,4.6vw,56px);line-height:1.08;letter-spacing:-.02em;font-weight:700')}>คุยกับทีม PMN <span style={css('color:#5C6680')}>เริ่มได้เลยวันนี้</span></h1>
          <p style={css('margin:0;font-size:18px;line-height:1.7;color:#A7B0C4;font-weight:300')}>บอกโจทย์ของคุณกับเรา แล้วทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง — ปรึกษาฟรี ไม่มีข้อผูกมัด</p>
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
                  <button className="agG" onClick={() => { setCSubmitted(false); setContact({ name: '', email: '', company: '', service: SERVICE_OPTS[0], msg: '' }); }} style={css('background:none;border:1px solid rgba(255,255,255,.16);color:#A7B0C4;border-radius:11px;padding:13px 22px;font-size:14.5px;cursor:pointer')}>ส่งอีกข้อความ</button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setCSubmitted(true); }} style={css('display:flex;flex-direction:column;gap:16px')}>
                <div style={css(`${MONO};font-size:11px;letter-spacing:.14em;color:#7B86A1;text-transform:uppercase`)}>Send a message</div>
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
              { icon: css('width:18px;height:13px;border:1.7px solid #60A5FA;border-radius:3px'), k: 'EMAIL', v: 'hello@pmndigital.co' },
              { icon: css('width:15px;height:15px;border:1.7px solid #60A5FA;border-radius:50%'), k: 'PHONE', v: '02-XXX-XXXX' },
              { icon: css('width:13px;height:13px;border:1.7px solid #60A5FA;transform:rotate(45deg)'), k: 'OFFICE', v: 'กรุงเทพมหานคร, ประเทศไทย' },
            ].map((it) => (
              <div key={it.k} style={css('background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;display:flex;align-items:center;gap:15px')}>
                <div style={css('width:44px;height:44px;border-radius:11px;background:rgba(37,99,235,.14);border:1px solid rgba(37,99,235,.32);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><span style={{ ...it.icon, display: 'block' }} /></div>
                <div><div style={css(`font-size:12px;color:#7B86A1;${MONO};letter-spacing:.06em;margin-bottom:3px`)}>{it.k}</div><div style={css('font-size:15px;font-weight:500')}>{it.v}</div></div>
              </div>
            ))}
            <div style={css('background:linear-gradient(135deg,rgba(37,99,235,.12),rgba(56,189,248,.05));border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:22px')}>
              <div style={css(`font-size:12px;color:#7B86A1;${MONO};letter-spacing:.06em;margin-bottom:10px`)}>HOURS</div>
              <div style={css('display:flex;justify-content:space-between;font-size:14px;color:#C7D0E0;margin-bottom:6px')}><span>จันทร์ – ศุกร์</span><span>09:00 – 18:00</span></div>
              <div style={css('display:flex;justify-content:space-between;font-size:14px;color:#8B95AC')}><span>เสาร์ – อาทิตย์</span><span>ตามนัดหมาย</span></div>
              <div style={css('margin-top:14px;display:flex;align-items:center;gap:8px;font-size:13px;color:#4ade80')}><span style={css('width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:pulseDot 1.8s infinite')} />ตอบกลับเฉลี่ยภายใน 24 ชม.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="ag-root" style={{ position: 'relative', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',system-ui,sans-serif", overflowX: 'clip' }}>
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
          <button onClick={goReg} style={css('margin-top:24px;background:#2563EB;color:#fff;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:600;cursor:pointer')}>รับสิทธิพิเศษฟรี →</button>
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
              <div style={css('margin-bottom:18px')}><Logo size={22} /></div>
              <p style={css('margin:0 0 18px;color:#8B95AC;font-size:14px;line-height:1.7;max-width:320px;font-weight:300')}>เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทางแบบครบวงจร โดยทีมยุคใหม่ที่เข้าใจธุรกิจ</p>
              <div style={css('display:flex;gap:10px')}>
                {SOCIALS.map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} className="agSoc" onClick={(e) => e.preventDefault()} style={css('width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#A7B0C4;text-decoration:none')}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d={s.d} /></svg>
                  </a>
                ))}
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
              <button className="agLink" onClick={goReg} style={css('display:block;background:none;border:none;color:#A7B0C4;font-size:14px;padding:6px 0;cursor:pointer;text-align:left')}>รับสิทธิพิเศษ</button>
            </div>
            <div>
              <div style={css(`${MONO};font-size:11px;letter-spacing:.16em;color:#5C6680;text-transform:uppercase;margin-bottom:16px`)}>Contact</div>
              <div style={css('color:#A7B0C4;font-size:14px;line-height:1.9')}>hello@pmndigital.co<br />02-XXX-XXXX<br />กรุงเทพมหานคร, ไทย</div>
            </div>
          </div>
          <div style={css('border-top:1px solid rgba(255,255,255,.07);padding-top:26px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap')}>
            <span style={css(`${MONO};font-size:12px;color:#5C6680`)}>© 2027 PMN Digital Agency Co.,Ltd. — All rights reserved.</span>
            <span style={css(`${MONO};font-size:12px;color:#5C6680`)}>Crafted with precision in Bangkok</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
