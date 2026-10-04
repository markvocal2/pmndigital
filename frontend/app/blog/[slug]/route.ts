import { renderArticle, renderNotFound } from '@/lib/site/pages/blog';
import { page } from '@/lib/site/shell';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const out = await renderArticle(slug);
  return out ? page(out) : page(await renderNotFound(), 404);
}
