import { EmptyState } from "@/components/profile/EmptyState";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          วิธีการชำระเงิน
        </h2>
        <EmptyState
          title="ยังไม่มีวิธีการชำระเงิน"
          subtitle="ระบบกำลังพัฒนา — รองรับ QR PromptPay, บัตรเครดิต, และ Internet Banking ในอนาคต"
          hint="Coming soon"
        />
      </section>
    </div>
  );
}
