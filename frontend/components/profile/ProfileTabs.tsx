"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/profile/general", label: "General", th: "ทั่วไป" },
  { href: "/profile/security", label: "Security", th: "ความปลอดภัย" },
  { href: "/profile/payments", label: "Payments", th: "การชำระเงิน" },
  { href: "/profile/products", label: "My Products", th: "ผลิตภัณฑ์" },
  { href: "/profile/billing", label: "Billing", th: "ใบแจ้งหนี้" },
  { href: "/profile/danger", label: "Danger Zone", th: "ตั้งค่าขั้นสูง" },
];

export function ProfileTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex flex-col gap-1 lg:w-56">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "group rounded-md border px-4 py-3 text-left transition",
              active
                ? "border-blue-400/40 bg-blue-500/[0.08]"
                : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]",
            ].join(" ")}
          >
            <div
              className={[
                "text-[10px] font-semibold uppercase tracking-[0.25em]",
                active ? "text-blue-200" : "text-slate-400 group-hover:text-blue-200/80",
              ].join(" ")}
            >
              {t.label}
            </div>
            <div className="mt-0.5 text-sm text-slate-200/90">{t.th}</div>
          </Link>
        );
      })}
    </nav>
  );
}
