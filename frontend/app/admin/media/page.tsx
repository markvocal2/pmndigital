import { MediaBrowser } from '@/components/admin/MediaBrowser';

export const dynamic = 'force-dynamic';

export default function AdminMediaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">คลังสื่อ (Media)</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        ไฟล์รูปทั้งหมดที่อัปโหลดในระบบ · อัปโหลดใหม่ / ลบ / คลิกที่รูปเพื่อคัดลอก URL
      </p>
      <MediaBrowser />
    </div>
  );
}
