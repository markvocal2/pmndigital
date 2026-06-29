// Rule-based promotion advisor — encodes standard pricing/marketing math.
// No external calls; deterministic. Used by the admin "ตัวช่วยคิดโปรโมชั่น" panel.

export interface AdvisorInput {
  cost: number; // ต้นทุนต่อหน่วย (THB)
  price: number; // ราคาปกติต่อหน่วย (THB)
  discountPct: number; // ส่วนลด % ที่ต้องการลอง
  expectedUnits?: number; // ยอดขายคาดหวังต่อแคมเปญ (ไว้แนะนำจำนวนคูปอง)
}

export type Health = 'good' | 'caution' | 'risk';

export interface AdvisorResult {
  valid: boolean;
  salePrice: number;
  profitPerUnit: number;
  marginPct: number; // gross margin บนราคาโปร
  originalMarginPct: number;
  marginDropPts: number; // จุด % ที่มาร์จิ้นหายไป
  breakEvenUpliftPct: number | null; // ต้องขายเพิ่ม % เท่าไรให้กำไรรวมเท่าเดิม (null = ขายขาดทุน)
  sellingAtLoss: boolean;
  charmPrice: number; // ราคาจิตวิทยา
  suggestedCouponQty: number | null;
  health: Health;
  notes: string[];
}

export interface PromoTemplate {
  key: string;
  badge: string;
  title: string;
  principle: string; // หลักการตลาดที่ใช้
  discountType: 'PERCENT' | 'FIXED' | 'BUNDLE';
  discountValue: number;
  durationDays: number;
  limitedQty: number | null;
  featured: boolean;
  terms: string;
}

export const fmtTHB = (n: number): string =>
  '฿' + Math.round(n).toLocaleString('en-US');

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ราคาจิตวิทยา (charm pricing) — ลงท้าย 9 / 90 / 990 และไม่เกินราคาโปร */
export function charmPrice(p: number): number {
  if (!isFinite(p) || p <= 0) return 0;
  if (p < 100) return Math.max(0, Math.floor(p / 10) * 10 - 1); // 50→49
  if (p < 1000) return Math.floor(p / 10) * 10 - 1; // 290→289
  return Math.floor(p / 100) * 100 - 10; // 1,900→1,890 ; 2,000→1,990
}

export function computeAdvice(input: AdvisorInput): AdvisorResult {
  const cost = Math.max(0, Number(input.cost) || 0);
  const price = Math.max(0, Number(input.price) || 0);
  const d = Math.min(100, Math.max(0, Number(input.discountPct) || 0));
  const notes: string[] = [];

  if (price <= 0) {
    return {
      valid: false,
      salePrice: 0,
      profitPerUnit: 0,
      marginPct: 0,
      originalMarginPct: 0,
      marginDropPts: 0,
      breakEvenUpliftPct: null,
      sellingAtLoss: false,
      charmPrice: 0,
      suggestedCouponQty: null,
      health: 'caution',
      notes: ['กรอกราคาปกติเพื่อเริ่มคำนวณ'],
    };
  }

  const salePrice = round2(price * (1 - d / 100));
  const profitPerUnit = round2(salePrice - cost);
  const marginPct = salePrice > 0 ? round2(((salePrice - cost) / salePrice) * 100) : 0;
  const originalMarginPct = round2(((price - cost) / price) * 100);
  const marginDropPts = round2(originalMarginPct - marginPct);

  const origContribution = price - cost;
  const newContribution = salePrice - cost;
  const sellingAtLoss = newContribution <= 0;
  const breakEvenUpliftPct =
    !sellingAtLoss && newContribution > 0
      ? round2((origContribution / newContribution - 1) * 100)
      : null;

  const charm = charmPrice(salePrice);

  // health
  let health: Health = 'good';
  if (sellingAtLoss || marginPct < 10) health = 'risk';
  else if (marginPct < 25 || d > 40) health = 'caution';

  // marketing guidance (หลักการที่ถูกต้อง)
  notes.push(
    `Anchoring: แสดงราคาเดิม ${fmtTHB(price)} (ขีดฆ่า) คู่กับราคาโปร ${fmtTHB(salePrice)} เพื่อให้เห็นส่วนต่างชัดเจน`,
  );
  if (charm > 0 && charm !== salePrice) {
    notes.push(`Charm pricing: ตั้งราคาโปรเป็น ${fmtTHB(charm)} ให้รู้สึกถูกกว่าตัวเลขกลม`);
  }
  if (breakEvenUpliftPct !== null) {
    notes.push(
      `Break-even: ต้องขายเพิ่มอย่างน้อย ${breakEvenUpliftPct}% จึงจะได้กำไรรวมเท่าเดิม — ตั้งเป้ายอดให้ถึงก่อนเริ่มโปร`,
    );
  }
  if (sellingAtLoss) {
    notes.push(
      `🚫 ราคาโปร (${fmtTHB(salePrice)}) ต่ำกว่าต้นทุน (${fmtTHB(cost)}) — ขาดทุนทุกหน่วย ใช้เฉพาะเป็น loss-leader ที่ตั้งใจดึงลูกค้าเท่านั้น`,
    );
  } else if (marginPct < 10) {
    notes.push(`⚠️ มาร์จิ้นเหลือ ${marginPct}% ต่ำมาก เสี่ยงขาดทุนเมื่อรวมค่าการตลาด/ค่าธรรมเนียม`);
  }
  if (d > 50) {
    notes.push(
      `ส่วนลด >50% อาจลดคุณค่าแบรนด์และสร้างความคาดหวังราคาถูกระยะยาว — พิจารณาเพิ่มมูลค่า (ของแถม/Bundle) แทนการลดราคาลึก`,
    );
  } else if (d >= 10 && d <= 25) {
    notes.push(`ส่วนลด ${d}% อยู่ในช่วงที่มักได้ผลดีต่อ conversion โดยยังรักษาภาพลักษณ์แบรนด์`);
  } else if (d > 0 && d < 10) {
    notes.push(`ส่วนลด ${d}% อาจน้อยเกินจะกระตุ้นการตัดสินใจ — ลองเพิ่มความเร่งด่วน (กำหนดเวลา/จำนวนจำกัด)`);
  }
  notes.push('Scarcity/Urgency: กำหนดวันหมดเขต + จำนวนจำกัด พร้อมตัวนับถอยหลัง เพิ่มอัตราการตัดสินใจ');

  // suggested coupon quantity = ~30% ของยอดคาดหวัง (สร้าง scarcity แต่ไม่ตึงเกินไป)
  let suggestedCouponQty: number | null = null;
  if (input.expectedUnits && input.expectedUnits > 0) {
    suggestedCouponQty = Math.max(10, Math.round(input.expectedUnits * 0.3));
    notes.push(
      `แนะนำจำนวนคูปอง ~${suggestedCouponQty} สิทธิ์ (≈30% ของยอดคาดหวัง ${input.expectedUnits}) เพื่อสร้างความขาดแคลนแต่ยังขายได้จริง`,
    );
  }

  return {
    valid: true,
    salePrice,
    profitPerUnit,
    marginPct,
    originalMarginPct,
    marginDropPts,
    breakEvenUpliftPct,
    sellingAtLoss,
    charmPrice: charm,
    suggestedCouponQty,
    health,
    notes,
  };
}

/** ร่างเทมเพลตโปรโมชั่นตามหลักการตลาด พร้อมตัวเลขที่คำนวณแล้ว — ใช้ prefill ฟอร์มสร้างโปร */
export function suggestTemplates(input: AdvisorInput, advice: AdvisorResult): PromoTemplate[] {
  const d = Math.min(100, Math.max(0, Number(input.discountPct) || 0)) || 15;
  const qty = advice.suggestedCouponQty ?? 50;
  const out: PromoTemplate[] = [
    {
      key: 'monthly',
      badge: 'โปรเด็ดประจำเดือน',
      title: `ลด ${d}% โปรเด็ดประจำเดือน`,
      principle: 'Anchoring + Recurring expectation — สร้างจังหวะให้ลูกค้ารอโปรประจำ',
      discountType: 'PERCENT',
      discountValue: d,
      durationDays: 30,
      limitedQty: null,
      featured: true,
      terms: 'เฉพาะเดือนนี้เท่านั้น',
    },
    {
      key: 'flash',
      badge: 'Flash Sale',
      title: `Flash Sale ลด ${Math.min(100, d + 5)}% ภายใน 48 ชม.`,
      principle: 'Urgency — หน้าต่างเวลาสั้นกระตุ้นการตัดสินใจทันที',
      discountType: 'PERCENT',
      discountValue: Math.min(100, d + 5),
      durationDays: 2,
      limitedQty: null,
      featured: true,
      terms: 'ภายใน 48 ชั่วโมงเท่านั้น',
    },
    {
      key: 'scarcity',
      badge: `จำกัด ${qty} สิทธิ์`,
      title: `${qty} สิทธิ์แรก รับส่วนลด ${d}%`,
      principle: 'Scarcity — จำนวนจำกัดเพิ่มมูลค่าการรับรู้',
      discountType: 'PERCENT',
      discountValue: d,
      durationDays: 14,
      limitedQty: qty,
      featured: false,
      terms: `จำกัดเพียง ${qty} สิทธิ์`,
    },
    {
      key: 'earlybird',
      badge: 'Early Bird',
      title: `จองก่อนลดเพิ่ม รวม ${Math.min(100, d + 10)}%`,
      principle: 'Early commitment — ให้รางวัลผู้ตัดสินใจไว ช่วยคาดการณ์ยอด',
      discountType: 'PERCENT',
      discountValue: Math.min(100, d + 10),
      durationDays: 7,
      limitedQty: Math.max(10, Math.round(qty / 2)),
      featured: false,
      terms: 'เฉพาะผู้จองช่วงเปิดตัว',
    },
    {
      key: 'bundle',
      badge: 'Bundle',
      title: 'แพ็กคู่คุ้มกว่า — เพิ่มมูลค่าแทนการลดราคา',
      principle: 'Value-add (เพิ่ม AOV) — รักษามาร์จิ้นดีกว่าการลดราคาลึก',
      discountType: 'BUNDLE',
      discountValue: 0,
      durationDays: 30,
      limitedQty: null,
      featured: false,
      terms: 'เมื่อซื้อแพ็กที่กำหนด',
    },
  ];
  return out;
}
