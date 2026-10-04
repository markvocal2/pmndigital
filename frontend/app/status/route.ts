import { renderStatus } from '@/lib/site/pages/status';
import { page } from '@/lib/site/shell';

export const dynamic = 'force-dynamic';

export async function GET() {
  return page(await renderStatus());
}
