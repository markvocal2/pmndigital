import { renderBlogIndex } from '@/lib/site/pages/blog';
import { page } from '@/lib/site/shell';

export const dynamic = 'force-dynamic';

export async function GET() {
  return page(await renderBlogIndex());
}
