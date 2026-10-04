import { renderServices } from '@/lib/site/pages/pages';
import { page } from '@/lib/site/shell';

export const dynamic = 'force-dynamic';

export async function GET() {
  return page(await renderServices());
}
