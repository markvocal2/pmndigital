import { fetchMe } from "@/lib/api-client";
import { GeneralForm } from "./GeneralForm";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export default async function GeneralPage() {
  const user = await fetchMe();

  const initials =
    (user.firstName?.[0] ?? user.displayName?.[0] ?? user.email[0] ?? "?") +
    (user.lastName?.[0] ?? "");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          รูปโปรไฟล์
        </h2>
        <AvatarUploader currentUrl={user.avatarUrl} initials={initials} />
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          ข้อมูลทั่วไป
        </h2>
        <GeneralForm
          initial={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            displayName: user.displayName ?? "",
            email: user.email,
          }}
        />
      </section>
    </div>
  );
}
