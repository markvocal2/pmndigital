import { backendFetch } from "@/lib/api-client";
import { EmptyState } from "@/components/profile/EmptyState";

interface ErpLicense {
  id: number;
  customerId: number;
  productId: number;
  licenseKey: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  metadata?: Record<string, unknown> | null;
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string) {
  const tone =
    status === "active"
      ? "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200"
      : status === "expired"
        ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-200"
        : status === "revoked"
          ? "border-rose-400/30 bg-rose-500/[0.08] text-rose-200"
          : "border-white/10 bg-white/[0.04] text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone}`}
    >
      {status}
    </span>
  );
}

export default async function ProductsPage() {
  let licenses: ErpLicense[] = [];
  try {
    const data = await backendFetch<{ items: ErpLicense[] }>(
      "/users/me/licenses",
    );
    licenses = data.items ?? [];
  } catch {
    licenses = [];
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          ผลิตภัณฑ์ของฉัน
        </h2>

        {licenses.length === 0 ? (
          <EmptyState
            title="ยังไม่มี License"
            subtitle="License ของคุณจะแสดงที่นี่หลังการสั่งซื้อสำเร็จ"
            hint="Synced from ERP"
          />
        ) : (
          <div className="space-y-3">
            {licenses.map((l) => {
              const days = daysLeft(l.expiresAt);
              return (
                <div
                  key={l.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-400">License Key</div>
                      <code className="font-mono text-sm text-blue-200">
                        {l.licenseKey}
                      </code>
                    </div>
                    {statusBadge(l.status)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Issued</div>
                      <div className="text-slate-200">
                        {new Date(l.issuedAt).toLocaleDateString("th-TH")}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Expires</div>
                      <div className="text-slate-200">
                        {l.expiresAt
                          ? `${new Date(l.expiresAt).toLocaleDateString("th-TH")} ${
                              days !== null
                                ? days >= 0
                                  ? `(${days} วัน)`
                                  : `(หมดแล้ว ${-days} วัน)`
                                : ""
                            }`
                          : "Perpetual"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
