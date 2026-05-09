import { fetchMe } from "@/lib/api-client";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { TwoFactorSetup } from "@/components/profile/TwoFactorSetup";

export default async function SecurityPage() {
  const user = await fetchMe();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          เปลี่ยนรหัสผ่าน
        </h2>
        <PasswordChangeForm />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          ยืนยันสองชั้น (2FA)
        </h2>
        <TwoFactorSetup enabled={user.twoFactorEnabled} />
      </section>
    </div>
  );
}
