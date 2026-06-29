'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Article, ArticleCategory, ArticleFaq } from '@/lib/cms';
import { saveArticleAction, deleteArticleAction, createCategoryAction } from '@/lib/cms-actions';
import { renderMarkdown } from '@/lib/md';
import { Button } from '@/components/ui/Button';
import { Section, Field, TextArea, Toggle, ImageUpload, StatusMsg } from '@/components/admin/ui';
import { ObjectListEditor, StringListEditor, type FieldDef } from '@/components/admin/ListEditor';

const FAQ_FIELDS: FieldDef[] = [
  { key: 'q', label: 'คำถาม', full: true },
  { key: 'a', label: 'คำตอบ', type: 'textarea' },
];

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^฀-๿a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export function ArticleEditor({
  article,
  categories,
}: {
  article: Article | null;
  categories: ArticleCategory[];
}) {
  const router = useRouter();
  const [cats, setCats] = useState<ArticleCategory[]>(categories);
  const [a, setA] = useState({
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    excerpt: article?.excerpt ?? '',
    bodyMarkdown: article?.bodyMarkdown ?? '',
    coverImageUrl: article?.coverImageUrl ?? '',
    status: article?.status ?? 'DRAFT',
    categoryId: article?.categoryId ?? null,
    tags: article?.tags ?? [],
    metaTitle: article?.metaTitle ?? '',
    metaDesc: article?.metaDesc ?? '',
    canonicalUrl: article?.canonicalUrl ?? '',
    ogImageUrl: article?.ogImageUrl ?? '',
    noindex: article?.noindex ?? false,
    keyphrase: article?.keyphrase ?? '',
    faq: (article?.faq ?? []) as ArticleFaq[],
    takeaways: article?.takeaways ?? [],
    schemaType: article?.schemaType ?? 'Article',
  });
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCat, setNewCat] = useState('');

  const set = (k: keyof typeof a, v: unknown) => setA((p) => ({ ...p, [k]: v }) as typeof a);

  async function save(status?: 'DRAFT' | 'PUBLISHED') {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const payload: Record<string, unknown> = {
      title: a.title,
      slug: a.slug || slugify(a.title),
      excerpt: a.excerpt,
      bodyMarkdown: a.bodyMarkdown,
      coverImageUrl: a.coverImageUrl,
      status: status ?? a.status,
      tags: a.tags.filter(Boolean),
      metaTitle: a.metaTitle,
      metaDesc: a.metaDesc,
      canonicalUrl: a.canonicalUrl,
      ogImageUrl: a.ogImageUrl,
      noindex: a.noindex,
      keyphrase: a.keyphrase,
      faq: a.faq.filter((f) => f.q || f.a),
      takeaways: a.takeaways.filter(Boolean),
      schemaType: a.schemaType,
    };
    if (typeof a.categoryId === 'number') payload.categoryId = a.categoryId;
    const res = await saveArticleAction(article?.id ?? null, payload as { title: string; slug: string });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    if (status) set('status', status);
    setSuccess('บันทึกแล้ว');
    if (!article) router.push('/admin/articles');
    else router.refresh();
  }

  async function onDelete() {
    if (!article) return;
    if (!confirm('ลบบทความนี้?')) return;
    const res = await deleteArticleAction(article.id);
    if (res.ok) router.push('/admin/articles');
    else setError(res.error);
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const res = await createCategoryAction({ slug: slugify(name) || 'cat-' + Date.now(), name });
    if (res.ok) {
      setCats((p) => [...p, res.data]);
      set('categoryId', res.data.id);
      setNewCat('');
    } else setError(res.error);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <Section title="เนื้อหาบทความ" hint="หัวข้อ · slug · เนื้อหา (Markdown)">
        <Field label="หัวข้อ" value={a.title} onChange={(v) => { set('title', v); if (!slugTouched) set('slug', slugify(v)); }} />
        <Field label="Slug (URL)" value={a.slug} onChange={(v) => { setSlugTouched(true); set('slug', slugify(v)); }} placeholder="my-article" />
        <TextArea label="เกริ่นนำ (excerpt)" value={a.excerpt} onChange={(v) => set('excerpt', v)} rows={2} />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">เนื้อหา (Markdown)</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs text-blue-300 hover:text-blue-200">
              {preview ? '← แก้ไข' : 'ดูตัวอย่าง →'}
            </button>
          </div>
          {preview ? (
            <div className="prose-invert min-h-[200px] rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-200 [&_a]:text-blue-300 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.bodyMarkdown) }} />
          ) : (
            <textarea value={a.bodyMarkdown} onChange={(e) => set('bodyMarkdown', e.target.value)} rows={16} placeholder="# หัวข้อ&#10;&#10;เนื้อหา... รองรับ **ตัวหนา**, *เอียง*, [ลิงก์](url), - รายการ" className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:border-blue-400/60" />
          )}
        </div>
      </Section>

      <Section title="หมวดหมู่ · แท็ก · ปก">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">หมวดหมู่</span>
            <select value={a.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60">
              <option value="" className="bg-[#0b1020]">— ไม่ระบุ</option>
              {cats.map((c) => <option key={c.id} value={c.id} className="bg-[#0b1020]">{c.name}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="หมวดใหม่" className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60" />
            <button type="button" onClick={addCategory} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-blue-200 hover:border-blue-400/40">+ เพิ่มหมวด</button>
          </div>
        </div>
        <StringListEditor label="แท็ก (Tags)" items={a.tags} onChange={(v) => set('tags', v)} placeholder="เช่น erp" />
        <ImageUpload label="รูปปก (Cover)" value={a.coverImageUrl} onChange={(u) => set('coverImageUrl', u)} />
      </Section>

      <Section title="SEO" hint="meta title/description · canonical · OG · index">
        <Field label="Meta Title" value={a.metaTitle} onChange={(v) => set('metaTitle', v)} placeholder="ปล่อยว่าง = ใช้หัวข้อบทความ" />
        <TextArea label="Meta Description" value={a.metaDesc} onChange={(v) => set('metaDesc', v)} rows={2} placeholder="ปล่อยว่าง = ใช้เกริ่นนำ" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Canonical URL" value={a.canonicalUrl} onChange={(v) => set('canonicalUrl', v)} />
          <ImageUpload label="OG Image" value={a.ogImageUrl} onChange={(u) => set('ogImageUrl', u)} />
        </div>
        <Toggle label="ไม่ให้ค้นหาเจอ (noindex)" checked={a.noindex} onChange={(v) => set('noindex', v)} />
      </Section>

      <Section title="GEO (Generative Engine Optimization)" hint="ให้ AI/Search สรุปได้ดี — keyphrase, ประเด็นสำคัญ, FAQ">
        <Field label="Focus Keyphrase" value={a.keyphrase} onChange={(v) => set('keyphrase', v)} />
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">ชนิด Schema</span>
          <select value={a.schemaType} onChange={(e) => set('schemaType', e.target.value)} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60">
            {['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].map((t) => <option key={t} value={t} className="bg-[#0b1020]">{t}</option>)}
          </select>
        </label>
        <StringListEditor label="ประเด็นสำคัญ (Key Takeaways)" items={a.takeaways} onChange={(v) => set('takeaways', v)} placeholder="สรุปสั้น ๆ 1 ประเด็น" />
        <ObjectListEditor label="FAQ (→ FAQPage schema)" items={a.faq} fields={FAQ_FIELDS} onChange={(v) => set('faq', v)} newItem={() => ({ q: '', a: '' })} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#070A12]/95 px-4 py-3 backdrop-blur">
        <Button type="button" loading={loading} onClick={() => void save('PUBLISHED')} className="!w-auto px-6">เผยแพร่</Button>
        <button type="button" disabled={loading} onClick={() => void save('DRAFT')} className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-blue-400/40">บันทึกฉบับร่าง</button>
        <span className="text-xs text-slate-500">สถานะ: {a.status === 'PUBLISHED' ? 'เผยแพร่' : 'ฉบับร่าง'}</span>
        <div className="flex-1"><StatusMsg error={error} success={success} /></div>
        {article && <button type="button" onClick={onDelete} className="text-xs text-rose-300/80 hover:text-rose-200">ลบบทความ</button>}
      </div>
    </form>
  );
}
