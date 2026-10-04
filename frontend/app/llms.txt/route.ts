import { getPublicArticles, getPublicSettings } from '@/lib/cms';

const SITE = 'https://pmndigital.co';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [s, { items }] = await Promise.all([getPublicSettings(), getPublicArticles('limit=200')]);
  const name = s?.siteName || 'PMN Digital';
  const lines = [
    `# ${name}`,
    '',
    `> ${s?.defaultMetaDesc || 'เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทางแบบครบวงจร โดยทีมยุคใหม่ที่เข้าใจธุรกิจ'}`,
    '',
    '## Pages',
    `- [หน้าแรก](${SITE}/): บริการออกแบบและพัฒนาระบบ Database, ERP, CRM และ Custom Software`,
    `- [บริการ](${SITE}/services): ฐานข้อมูล, ERP, CRM, ซอฟต์แวร์สั่งทำ และบริการเสริม`,
    `- [ผลงาน](${SITE}/portfolio)`,
    `- [ราคา](${SITE}/pricing): แพ็กเกจ Starter / Pro / Enterprise และคำถามที่พบบ่อย`,
    `- [ติดต่อเรา](${SITE}/contact)`,
    `- [บทความ](${SITE}/blog)`,
    `- [สถานะระบบ](${SITE}/status)`,
    '',
    '## Articles',
    ...items.map((a) => `- [${a.title}](${SITE}/blog/${a.slug})${a.excerpt ? ': ' + a.excerpt : ''}`),
    '',
    '## Contact',
    s?.contactEmail ? `- Email: ${s.contactEmail}` : '',
    s?.contactPhone ? `- Phone: ${s.contactPhone}` : '',
  ].filter(Boolean);
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
