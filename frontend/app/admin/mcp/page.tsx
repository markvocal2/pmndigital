import { McpConnectCard } from '@/components/admin/McpConnectCard';

export const dynamic = 'force-dynamic';

const STEPS: { n: number; title: string; body: React.ReactNode }[] = [
  {
    n: 1,
    title: 'ตั้งค่า API key ก่อน (ครั้งเดียว)',
    body: (
      <>
        ไปที่หน้า <a href="/admin/integrations" className="text-blue-300 hover:underline">การเชื่อมต่อ AI</a> แล้วใส่ +
        ทดสอบ API key ของ <b>Claude</b> และ <b>Gemini</b> — จำเป็นสำหรับเครื่องมือที่ให้เซิร์ฟเวอร์เขียนข้อความ/สร้างภาพเอง
        (งานที่ Claude เขียนเองในแชตไม่ต้องใช้ key เพราะใช้ Subscription ของคุณ)
      </>
    ),
  },
  {
    n: 2,
    title: 'เปิด claude.ai → Settings → Connectors',
    body: (
      <>
        เข้า <a href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">claude.ai → Settings → Connectors</a> (เมนู
        “Connectors” หรือ “Add connectors”). ฟีเจอร์ Custom Connector รองรับบนแพ็กเกจ Pro / Max / Team / Enterprise
      </>
    ),
  },
  {
    n: 3,
    title: 'Add custom connector → วาง URL',
    body: (
      <>
        กด <b>“Add custom connector”</b> แล้ววาง URL ด้านบน (<code className="rounded bg-slate-800 px-1.5 py-0.5 text-blue-200">https://pmndigital.co/mcp</code>) จากนั้นกด Add —
        ระบบจะลงทะเบียนอัตโนมัติ (Dynamic Client Registration) ไม่ต้องกรอก Client ID/Secret เอง
      </>
    ),
  },
  {
    n: 4,
    title: 'เข้าสู่ระบบด้วยบัญชีผู้ดูแล (ADMIN)',
    body: (
      <>
        Claude จะเปิดหน้า <b>“เชื่อมต่อ Claude กับ PMN Digital”</b> ของเรา — กรอกอีเมล/รหัสผ่าน <b>แอดมิน</b> ของเว็บไซต์ แล้วกด
        “อนุญาตและเชื่อมต่อ” (OAuth 2.1 + PKCE)
      </>
    ),
  },
  {
    n: 5,
    title: 'เสร็จ — เริ่มสั่งงานใน Claude ได้เลย',
    body: (
      <>
        กลับมาที่ claude.ai จะเห็นสถานะ “Connected” และรายการเครื่องมือ. พิมพ์สั่งได้ เช่น{' '}
        <i>“ช่วยร่างบทความเรื่องเทรนด์ AI 2026 แล้วสร้างภาพปกให้ด้วย”</i> — Claude จะเรียกเครื่องมือของเว็บให้อัตโนมัติ
      </>
    ),
  },
];

const TOOLS: { name: string; desc: string; tag: string }[] = [
  { name: 'write_and_publish_article', desc: 'เขียนบทความเต็ม (Claude) + ภาพปก (Gemini) → บันทึกเป็นฉบับร่าง', tag: 'เนื้อหา' },
  { name: 'draft_article', desc: 'ร่างบทความภาษาไทยจากหัวข้อ (Claude) — คืน Markdown', tag: 'เนื้อหา' },
  { name: 'list_articles / set_article_status', desc: 'ดูบทความ / เผยแพร่หรือถอนกลับเป็นร่าง', tag: 'เนื้อหา' },
  { name: 'generate_image', desc: 'สร้างภาพ (Gemini Imagen) → อัปขึ้น PMN Drive คืน URL', tag: 'ภาพ' },
  { name: 'list/create_promotion · set_promotion_state', desc: 'ดู/สร้าง/เปิด-ปิดโปรโมชั่น', tag: 'การตลาด' },
  { name: 'list/create_coupon · coupon_redemptions', desc: 'ดู/สร้างคูปอง + ประวัติการใช้', tag: 'การตลาด' },
  { name: 'list_leads · update_lead_status · lead_insights', desc: 'ดู/อัปเดตสถานะ leads + วิเคราะห์ด้วย Claude', tag: 'ลูกค้า' },
  { name: 'list_pending_comments · moderate_comment', desc: 'ดู/อนุมัติ/ปฏิเสธ/ลบ ความคิดเห็น', tag: 'คอมเมนต์' },
  { name: 'get_site_settings · get_home_content · get_server_status', desc: 'อ่านการตั้งค่า/หน้าหลัก/สถานะเซิร์ฟเวอร์', tag: 'ระบบ' },
  { name: 'list_ai_providers · ai_health', desc: 'สถานะผู้ให้บริการ AI', tag: 'ระบบ' },
];

export default function AdminMcpPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">เชื่อมต่อ Claude (MCP Connector)</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        เปิดให้ Claude (claude.ai) เชื่อมต่อเข้ามาสั่งงานในเว็บได้โดยตรง — เขียนบทความ สร้างภาพ และจัดการระบบ
        ผ่านมาตรฐาน Model Context Protocol (MCP) ด้วยการยืนยันตัวตนแบบ OAuth 2.1
      </p>

      <McpConnectCard />

      <h2 className="mt-8 mb-3 text-lg font-semibold text-white">ขั้นตอนการเชื่อมต่อ</h2>
      <ol className="space-y-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {s.n}
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{s.title}</div>
              <div className="mt-0.5 text-sm leading-relaxed text-slate-300">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-white">เครื่องมือที่ใช้ได้ (Full Option)</h2>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <tbody>
            {TOOLS.map((t) => (
              <tr key={t.name} className="border-b border-white/5 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-blue-200">{t.name}</td>
                <td className="px-4 py-3 text-slate-300">{t.desc}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">{t.tag}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        เนื้อหาและโปรโมชั่นที่ AI สร้างจะถูกบันทึกเป็น “ฉบับร่าง/ปิดอยู่” ก่อนเสมอ ให้ตรวจทานแล้วค่อยเผยแพร่เอง
      </p>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-white">ความปลอดภัย</h2>
      <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-300">
        <li>ต้องเข้าสู่ระบบด้วยบัญชี <b>ADMIN</b> เท่านั้นจึงจะเชื่อมต่อได้ (OAuth 2.1 + PKCE)</li>
        <li>โทเค็นเก็บแบบเข้ารหัสในฐานข้อมูล และเพิกถอนได้ (revoke) — ตัดการเชื่อมต่อได้จาก claude.ai</li>
        <li>ผลงานที่ AI สร้าง (บทความ/โปรโมชั่น) จะเป็น <b>ฉบับร่าง (DRAFT)</b> ให้รีวิวก่อนเผยแพร่เสมอ</li>
        <li>คีย์ AI ทั้งหมดเก็บเข้ารหัสในฐานข้อมูล ไม่อยู่ในโค้ด/Git</li>
      </ul>
    </div>
  );
}
