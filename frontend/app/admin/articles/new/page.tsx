import { adminListCategories } from '@/lib/cms';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  const categories = await adminListCategories().catch(() => []);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">เขียนบทความใหม่</h1>
      <ArticleEditor article={null} categories={categories} />
    </div>
  );
}
