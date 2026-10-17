import { notFound } from 'next/navigation';
import { adminGetArticle, adminListCategories, isScheduled } from '@/lib/cms';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const [article, categories] = await Promise.all([
    adminGetArticle(numId).catch(() => null),
    adminListCategories().catch(() => []),
  ]);
  if (!article) notFound();
  const live = article.status === 'PUBLISHED' && !isScheduled(article);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">แก้ไขบทความ</h1>
        {live && (
          <a
            href={`/blog/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="เปิดบทความบนเว็บไซต์ (แท็บใหม่) — แสดงฉบับที่บันทึกล่าสุด"
            className="whitespace-nowrap rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:border-blue-400/50 hover:text-white"
          >
            เปิดอ่านบทความ ↗
          </a>
        )}
      </div>
      <ArticleEditor article={article} categories={categories} />
    </div>
  );
}
