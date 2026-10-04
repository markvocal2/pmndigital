import { renderHome } from '@/lib/site/pages/home';
import { page } from '@/lib/site/shell';

// Public pages are plain HTML from the PMN design (motion engine in /assets/js/main.js), rendered per request.
export const dynamic = 'force-dynamic';

export async function GET() {
  return page(await renderHome());
}
