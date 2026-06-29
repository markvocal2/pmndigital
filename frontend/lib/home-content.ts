/* Home page content model — single source of truth for the data-driven
   AgencySite + the /admin/home editor. Stored as HomeContent.data (JSON);
   unedited fields fall back to these defaults via mergeHome(). */

export interface Svc { t: string; th: string; d: string; icon: string }
export interface BentoItem { h: string; d: string }
export interface Step { n: string; t: string; d: string }
export interface Work { tag: string; t: string; m: string; hue: string }
export interface Tier {
  name: string; th: string; base: number; disc: number; custom: boolean;
  feats: string[]; popular: boolean;
}
export interface Priv { t: string; d: string }
export interface Quote { q: string; n: string; r: string }
export interface Faq { q: string; a: string }
export interface SvcDetail { n: string; h: string; p: string; feats: string[] }
export interface MoreSvc { k: string; h: string; d: string }
export interface AllWork { cat: string; tag: string; t: string; d: string; m: string }
export interface Stat { target: number; suffix: string; label: string }

export interface HomeData {
  hero: {
    badge: string; title1: string; highlight: string; title2: string;
    subtitle: string; ctaPrimary: string; ctaSecondary: string; statNote: string;
  };
  trustedLabel: string;
  clients: string[];
  services: Svc[];
  stats: Stat[];
  why: { eyebrow: string; title: string; subtitle: string; techTitle: string; techDesc: string; bento: BentoItem[] };
  techs: string[];
  process: Step[];
  works: Work[];
  pricing: { tiers: Tier[] };
  register: { title: string; subtitle: string; privileges: Priv[]; couponCode: string };
  testimonials: Quote[];
  ctaBand: { title: string; subtitle: string };
  servicesPage: {
    title: string; titleMuted: string; subtitle: string;
    details: SvcDetail[]; moreTitle: string; more: MoreSvc[];
    expertiseTitle: string; expertiseDesc: string;
  };
  portfolio: {
    title: string; titleMuted: string; subtitle: string;
    allWork: AllWork[]; stats: { v: string; l: string }[];
  };
  pricingPage: { title: string; titleMuted: string; subtitle: string };
  faqs: Faq[];
  contact: {
    title: string; titleMuted: string; subtitle: string;
    email: string; phone: string; office: string;
    hoursWeekday: string; hoursWeekend: string; responseNote: string;
  };
  footer: { desc: string };
}

export const defaultHomeContent: HomeData = {
  hero: {
    badge: 'Digital Systems Agency',
    title1: 'ออกแบบ',
    highlight: '“ระบบ”',
    title2: 'ที่ธุรกิจคุณต้องการจริง ๆ',
    subtitle:
      'PMN Digital รับออกแบบและพัฒนา ระบบฐานข้อมูล · ERP · CRM และซอฟต์แวร์เฉพาะทางแบบครบวงจร ทำงานออนไลน์ บริหารโดยทีมยุคใหม่ที่เข้าใจทั้งเทคโนโลยีและธุรกิจของคุณ',
    ctaPrimary: 'รับสิทธิพิเศษฟรี',
    ctaSecondary: 'ดูบริการทั้งหมด',
    statNote: '80+ องค์กรไว้วางใจ · 120+ โปรเจกต์ส่งมอบแล้ว',
  },
  trustedLabel: 'หน่วยงานที่ไว้วางใจ — Trusted by teams',
  clients: ['NIMBUS', 'SIAM LOGISTICS', 'METROBANK', 'VOLT RETAIL', 'AETHER HEALTH', 'ORBIT FINANCE', 'THANA GROUP', 'KASET CO-OP'],
  services: [
    { t: 'Database Systems', th: 'ออกแบบ & วิศวกรรมฐานข้อมูล', d: 'ออกแบบโครงสร้างข้อมูล จัดการ migration และปรับจูนประสิทธิภาพให้เร็วและปลอดภัย', icon: 'db' },
    { t: 'ERP', th: 'บริหารทรัพยากรองค์กร', d: 'บัญชี การเงิน คลังสินค้า จัดซื้อ ผลิต และ HR รวมไว้ในระบบเดียวที่เชื่อมกัน', icon: 'erp' },
    { t: 'CRM', th: 'บริหารลูกค้าสัมพันธ์', d: 'ดูแลไปป์ไลน์การขาย บริการหลังการขาย และการตลาดอัตโนมัติแบบครบวงจร', icon: 'crm' },
    { t: 'Custom Software', th: 'ซอฟต์แวร์สั่งทำเฉพาะทาง', d: 'เว็บแอป ระบบอัตโนมัติ API และแดชบอร์ดที่ออกแบบตามโจทย์ธุรกิจของคุณ', icon: 'code' },
  ],
  stats: [
    { target: 120, suffix: '+', label: 'โปรเจกต์ที่ส่งมอบ' },
    { target: 80, suffix: '+', label: 'องค์กรที่ไว้วางใจ' },
    { target: 8, suffix: '+', label: 'ปีของประสบการณ์' },
    { target: 99.9, suffix: '%', label: 'ความเสถียรเฉลี่ย' },
  ],
  why: {
    eyebrow: 'Why PMN',
    title: 'ทีมยุคใหม่<br/>ที่เข้าใจธุรกิจ',
    subtitle: 'เราไม่ได้แค่เขียนโค้ด — เราเข้าใจกระบวนการทำงานของคุณ แล้วออกแบบระบบให้คนใช้งานได้จริง วัดผลได้ และเติบโตต่อไปกับธุรกิจ',
    techTitle: 'เครื่องมือระดับโลก เลือกใช้ให้เหมาะกับงาน',
    techDesc: 'เราเลือกเทคโนโลยีจากโจทย์จริง ไม่ยึดติดเครื่องมือเดียว เพื่อความเร็ว ความปลอดภัย และการดูแลระยะยาว',
    bento: [
      { h: 'ทำงานออนไลน์ 100%', d: 'ประชุม ส่งงาน ติดตามความคืบหน้าผ่านระบบออนไลน์ โปร่งใส ตรวจสอบได้ทุกขั้นตอน' },
      { h: 'ความปลอดภัยเป็นมาตรฐาน', d: 'เข้ารหัสข้อมูล สำรองอัตโนมัติ และวางสิทธิ์การเข้าถึงตามบทบาท ตั้งแต่วันแรก' },
      { h: 'ส่งมอบตรงเวลา', d: 'วางแผนเป็นสปรินต์ มีเดโมให้เห็นภาพทุกช่วง ลดความเสี่ยงงานบานปลาย' },
      { h: 'ดูแลต่อเนื่องหลังส่งมอบ', d: 'มีทีม support คอยดูแล อัปเดต และพัฒนาต่อยอดให้ระบบโตไปกับธุรกิจ' },
    ],
  },
  techs: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Node.js', '.NET', 'Python', 'React', 'Next.js', 'AWS', 'Google Cloud', 'Docker', 'Kubernetes'],
  process: [
    { n: '01', t: 'Discovery', d: 'เข้าใจธุรกิจ เป้าหมาย และปัญหาที่แท้จริง' },
    { n: '02', t: 'Design', d: 'ออกแบบสถาปัตยกรรมระบบและ UX ที่ใช้ง่าย' },
    { n: '03', t: 'Build', d: 'พัฒนาเป็นสปรินต์ พร้อมเดโมให้เห็นทุกช่วง' },
    { n: '04', t: 'Deploy', d: 'นำขึ้นใช้งานจริง ทดสอบ และส่งมอบ' },
    { n: '05', t: 'Support', d: 'ดูแล อัปเดต และพัฒนาต่อยอดต่อเนื่อง' },
  ],
  works: [
    { tag: 'ERP · Manufacturing', t: 'ระบบ ERP โรงงานผลิต', m: 'ลดต้นทุนสต็อก 32%', hue: '#2563EB' },
    { tag: 'CRM · Retail', t: 'CRM เครือค้าปลีก', m: 'ยอดซื้อซ้ำ +28%', hue: '#38BDF8' },
    { tag: 'Database · Fintech', t: 'ปรับสถาปัตยกรรมฐานข้อมูล', m: 'Query เร็วขึ้น 5 เท่า', hue: '#60A5FA' },
  ],
  pricing: {
    tiers: [
      { name: 'Starter', th: 'ธุรกิจเริ่มต้น / SME', base: 35000, disc: 28000, custom: false, feats: ['ระบบเดียว ขอบเขตชัดเจน', 'ฐานข้อมูลมาตรฐาน', 'ดูแลฟรี 3 เดือน'], popular: false },
      { name: 'Pro', th: 'ธุรกิจกำลังเติบโต', base: 149000, disc: 119000, custom: false, feats: ['หลายโมดูลเชื่อมกัน', 'ออกแบบ UX เฉพาะ + API', 'ดูแลฟรี 6 เดือน'], popular: true },
      { name: 'Enterprise', th: 'องค์กรขนาดใหญ่', base: 0, disc: 0, custom: true, feats: ['ออกแบบสถาปัตยกรรมเฉพาะ', 'รองรับสเกล + ความปลอดภัยสูง', 'SLA + ทีมดูแลเฉพาะ'], popular: false },
    ],
  },
  register: {
    title: 'ลงทะเบียนวันนี้<br/>รับสิทธิพิเศษทันที',
    subtitle: 'กรอกข้อมูลสั้น ๆ เพื่อรับคูปองส่วนลดและสิทธิ์เฉพาะสมาชิก ใช้ได้กับทุกบริการของ PMN Digital',
    privileges: [
      { t: 'ส่วนลด 20% สำหรับโปรเจกต์แรก', d: 'ใช้ได้กับทุกบริการ' },
      { t: 'ปรึกษาวางระบบฟรี 1 ชั่วโมง', d: 'มูลค่า ฿3,500 กับผู้เชี่ยวชาญ' },
      { t: 'ตรวจสุขภาพระบบ/ฐานข้อมูลฟรี', d: 'System & Database Audit' },
      { t: 'Priority support 3 เดือน', d: 'ตอบกลับเร็วเป็นพิเศษ' },
    ],
    couponCode: 'PMN-WELCOME20',
  },
  testimonials: [
    { q: 'ทีม PMN เข้าใจปัญหาหน้างานจริง ระบบ ERP ที่ได้ช่วยให้เราปิดบัญชีเร็วขึ้นมาก', n: 'คุณวีระ ส.', r: 'ผู้จัดการโรงงาน, SIAM LOGISTICS' },
    { q: 'ทำงานออนไลน์ตลอด เห็นความคืบหน้าทุกสัปดาห์ ส่งมอบตรงเวลาแบบที่หาได้ยาก', n: 'คุณนภัส ก.', r: 'COO, VOLT RETAIL' },
    { q: 'ฐานข้อมูลที่เคยช้ามาก หลังปรับใหม่เร็วขึ้นหลายเท่า คุ้มค่ามาก', n: 'คุณธนา พ.', r: 'CTO, ORBIT FINANCE' },
  ],
  ctaBand: {
    title: 'พร้อมเปลี่ยนธุรกิจให้เป็นระบบแล้วหรือยัง?',
    subtitle: 'นัดคุยกับทีม PMN ฟรี ไม่มีข้อผูกมัด — เราจะช่วยวางแผนระบบที่เหมาะกับคุณที่สุด',
  },
  servicesPage: {
    title: 'บริการที่เราดำเนินการให้',
    titleMuted: 'ครบทุกขั้นตอน ในที่เดียว',
    subtitle: 'ตั้งแต่วางสถาปัตยกรรมข้อมูล จนถึงระบบที่พนักงานใช้งานจริงทุกวัน — PMN ออกแบบ พัฒนา ติดตั้ง และดูแลให้แบบจบในทีมเดียว',
    details: [
      { n: '01 · Database', h: 'ออกแบบ & วิศวกรรมฐานข้อมูล', p: 'หัวใจของทุกระบบคือข้อมูลที่ออกแบบมาดี เราวางโครงสร้างให้ขยายได้ ปลอดภัย และเร็ว พร้อมย้ายข้อมูลเดิมอย่างไร้รอยต่อ', feats: ['Data Modeling & Schema Design', 'Migration จากระบบเดิมอย่างปลอดภัย', 'Query Optimization & Indexing', 'Backup, Replication & Security'] },
      { n: '02 · ERP', h: 'ระบบบริหารทรัพยากรองค์กร', p: 'รวมทุกฝ่ายให้ทำงานบนข้อมูลชุดเดียวกัน ลดงานซ้ำซ้อน เห็นภาพรวมธุรกิจแบบเรียลไทม์ ตัดสินใจได้เร็วขึ้น', feats: ['บัญชี การเงิน และงบประมาณ', 'คลังสินค้า จัดซื้อ และซัพพลายเชน', 'การผลิตและการวางแผน (MRP)', 'HR และระบบเงินเดือน'] },
      { n: '03 · CRM', h: 'ระบบบริหารลูกค้าสัมพันธ์', p: 'ดูแลลูกค้าตั้งแต่ลีดแรกจนปิดการขายและบริการหลังการขาย เก็บทุกปฏิสัมพันธ์ไว้ในที่เดียว เพิ่มยอดขายซ้ำ', feats: ['Sales Pipeline & Lead Management', 'Ticketing & บริการหลังการขาย', 'Marketing Automation', 'รายงานและการวิเคราะห์ลูกค้า'] },
      { n: '04 · Custom', h: 'ซอฟต์แวร์สั่งทำเฉพาะทาง', p: 'เมื่อระบบสำเร็จรูปไม่ตอบโจทย์ เราสร้างให้ตรงกับกระบวนการของคุณเป๊ะ ๆ ทั้งเว็บแอป ระบบอัตโนมัติ และการเชื่อมต่อ', feats: ['Web Application & Dashboard', 'Workflow & Process Automation', 'API & System Integration', 'Mobile-ready & Cloud-native'] },
    ],
    moreTitle: 'บริการเสริมที่ทำให้ระบบสมบูรณ์',
    more: [
      { k: 'CLOUD', h: 'Cloud & DevOps', d: 'ติดตั้งบนคลาวด์ ปรับขนาดอัตโนมัติ และ CI/CD' },
      { k: 'DATA', h: 'Analytics & BI', d: 'แดชบอร์ดและรายงานที่อ่านง่าย ตัดสินใจไว' },
      { k: 'CONNECT', h: 'System Integration', d: 'เชื่อมระบบเดิม ภาครัฐ และ third-party' },
      { k: 'CARE', h: 'Maintenance & Support', d: 'ดูแล อัปเดต และพัฒนาต่อยอดต่อเนื่อง' },
    ],
    expertiseTitle: 'ความเชี่ยวชาญด้านเทคโนโลยี',
    expertiseDesc: 'เราเลือกเครื่องมือจากโจทย์จริง ผสานความรู้ด้านสถาปัตยกรรมระบบ ความปลอดภัย และประสบการณ์จากหลายอุตสาหกรรม',
  },
  portfolio: {
    title: 'ผลงานที่เราภูมิใจ',
    titleMuted: 'วัดผลได้จริง',
    subtitle: 'ระบบที่เราส่งมอบให้ลูกค้าหลากหลายอุตสาหกรรม พร้อมผลลัพธ์ที่จับต้องได้',
    allWork: [
      { cat: 'erp', tag: 'ERP · Manufacturing', t: 'ระบบ ERP โรงงานผลิตชิ้นส่วน', d: 'รวมการผลิต คลัง และบัญชีไว้ในระบบเดียว', m: 'ลดต้นทุนสต็อก 32%' },
      { cat: 'crm', tag: 'CRM · Retail', t: 'CRM เครือร้านค้าปลีก 40 สาขา', d: 'รวมข้อมูลลูกค้าและโปรแกรมสมาชิก', m: 'ยอดซื้อซ้ำ +28%' },
      { cat: 'database', tag: 'Database · Fintech', t: 'ปรับสถาปัตยกรรมฐานข้อมูล', d: 'ออกแบบใหม่และทำ indexing เชิงลึก', m: 'Query เร็วขึ้น 5 เท่า' },
      { cat: 'custom', tag: 'Custom · Logistics', t: 'แพลตฟอร์มติดตามขนส่งเรียลไทม์', d: 'เว็บแอป + แดชบอร์ด + API', m: 'ลดเวลาตรวจงาน 45%' },
      { cat: 'erp', tag: 'ERP · Distribution', t: 'ระบบจัดจำหน่ายและคลังกระจายสินค้า', d: 'จัดการหลายคลังและเส้นทางจัดส่ง', m: 'ส่งตรงเวลา 99.2%' },
      { cat: 'custom', tag: 'Custom · Healthcare', t: 'ระบบนัดหมายและเวชระเบียน', d: 'ออกแบบ UX สำหรับบุคลากรแพทย์', m: 'ลดเวลารอคิว 38%' },
    ],
    stats: [
      { v: '120+', l: 'โปรเจกต์ส่งมอบ' },
      { v: '80+', l: 'องค์กรลูกค้า' },
      { v: '14', l: 'อุตสาหกรรม' },
      { v: '98%', l: 'ลูกค้ากลับมาใช้ซ้ำ' },
    ],
  },
  pricingPage: {
    title: 'ราคาที่โปร่งใส',
    titleMuted: 'ยืดหยุ่นตามธุรกิจ',
    subtitle: 'เลือกแพ็กเกจที่เหมาะกับขนาดธุรกิจคุณ ทุกแพ็กเกจปรับแต่งได้ และมีทีมดูแลหลังส่งมอบ',
  },
  faqs: [
    { q: 'เริ่มต้นโปรเจกต์ต้องทำอย่างไร?', a: 'เริ่มจากนัดคุยฟรีเพื่อเข้าใจโจทย์ จากนั้นเราสรุปขอบเขตงานและใบเสนอราคาให้ — ขั้นปรึกษาไม่มีค่าใช้จ่าย' },
    { q: 'ระยะเวลาในการพัฒนานานแค่ไหน?', a: 'ขึ้นกับขอบเขต โดยทั่วไประบบขนาดเล็ก 4–8 สัปดาห์ และระบบองค์กรขนาดใหญ่ 3–6 เดือน เราทำงานเป็นสปรินต์พร้อมเดโมเป็นระยะ' },
    { q: 'มีบริการดูแลหลังส่งมอบไหม?', a: 'มีครับ ทุกแพ็กเกจรวมระยะดูแลฟรี และต่อสัญญา support รายเดือน/รายปีเพื่อดูแลและพัฒนาต่อยอดได้' },
    { q: 'ราคาที่แสดงรวมอะไรบ้าง?', a: 'รวมการออกแบบ พัฒนา ทดสอบ ติดตั้ง และอบรมการใช้งานเบื้องต้น ส่วนค่าคลาวด์/ไลเซนส์ภายนอกแจ้งแยกตามจริง' },
    { q: 'ทำงานกับธุรกิจขนาดเล็กไหม?', a: 'แน่นอน แพ็กเกจ Starter ออกแบบมาเพื่อ SME โดยเฉพาะ เริ่มต้นได้ในงบที่จับต้องได้' },
  ],
  contact: {
    title: 'คุยกับทีม PMN',
    titleMuted: 'เริ่มได้เลยวันนี้',
    subtitle: 'บอกโจทย์ของคุณกับเรา แล้วทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง — ปรึกษาฟรี ไม่มีข้อผูกมัด',
    email: 'hello@pmndigital.co',
    phone: '02-XXX-XXXX',
    office: 'กรุงเทพมหานคร, ประเทศไทย',
    hoursWeekday: '09:00 – 18:00',
    hoursWeekend: 'ตามนัดหมาย',
    responseNote: 'ตอบกลับเฉลี่ยภายใน 24 ชม.',
  },
  footer: {
    desc: 'เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทางแบบครบวงจร โดยทีมยุคใหม่ที่เข้าใจธุรกิจ',
  },
};

function deepMerge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(over)) return over as unknown as T;
  if (typeof over === 'object' && typeof base === 'object' && base !== null && !Array.isArray(base)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(over as Record<string, unknown>)) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], (over as Record<string, unknown>)[k]);
    }
    return out as T;
  }
  return over as T;
}

export function mergeHome(data: unknown): HomeData {
  return deepMerge(defaultHomeContent, data ?? {});
}
