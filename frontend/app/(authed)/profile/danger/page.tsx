import { EmptyState } from "@/components/profile/EmptyState";

export default function DangerPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-rose-400/20 bg-rose-500/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-rose-200/80">
          Danger Zone
        </h2>
        <EmptyState
          title="ลบบัญชี"
          subtitle="ฟีเจอร์นี้ยังไม่เปิด — ติดต่อทีมงานหากต้องการลบบัญชี"
          hint="Coming soon"
        />
      </section>
    </div>
  );
}
