import { backendFetch } from "@/lib/api-client";
import { EmptyState } from "@/components/profile/EmptyState";

interface ErpOrder {
  id: number;
  ref: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export default async function BillingPage() {
  let orders: ErpOrder[] = [];
  try {
    const data = await backendFetch<{ items: ErpOrder[] }>("/users/me/orders");
    orders = data.items ?? [];
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/80">
          ประวัติใบแจ้งหนี้
        </h2>

        {orders.length === 0 ? (
          <EmptyState
            title="ยังไม่มีรายการ"
            subtitle="ใบแจ้งหนี้และคำสั่งซื้อของคุณจะแสดงที่นี่"
            hint="Synced from ERP"
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.2em] text-blue-300/60">
                <tr>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono text-blue-200">{o.ref}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(o.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.status}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">
                      {o.total.toLocaleString("th-TH")} {o.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
