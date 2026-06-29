import { notFound } from 'next/navigation';
import { adminGetArticle, adminListCategories } from '@/lib/cms';
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
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">แก้ไขบทความ</h1>
      <ArticleEditor article={article} categories={categories} />
    </div>
  );
}
