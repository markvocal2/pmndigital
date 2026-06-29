'use client';

import { useState } from 'react';
import type { Lead } from '@/lib/cms';
import { setLeadStatusAction, deleteLeadAction } from '@/lib/cms-actions';

const STATUS_LABEL: Record<string, string> = { NEW: 'ใหม่', CONTACTED: 'ติดต่อแล้ว', CLOSED: 'ปิดแล้ว' };
const STATUS_CLS: Record<string, string> = {
  NEW: 'bg-blue-500/15 text-blue-200',
  CONTACTED: 'bg-amber-500/15 text-amber-200',
  CLOSED: 'bg-white/10 text-slate-300',
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [rows, setRows] = useState<Lead[]>(leads);
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [busy, setBusy] = useState<number | null>(null);

  const shown = rows.filter((l) => (fType === 'all' || l.type === fType) && (fStatus === 'all' || l.status === fStatus));

  async function changeStatus(id: number, status: string) {
    setBusy(id);
    const res = await setLeadStatusAction(id, status);
    setBusy(null);
    if (res.ok) setRows((p) => p.map((l) => (l.id === id ? { ...l, status: status as Lead['status'] } : l)));
  }
  async function remove(id: number) {
    if (!confirm('ลบรายการนี้?')) return;
    setBusy(id);
    const res = await deleteLeadAction(id);
    setBusy(null);
    if (res.ok) setRows((p) => p.filter((l) => l.id !== id));
  }

  const selCls = 'rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-400/60';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={fType} onChange={(e) => setFType(e.target.value)} className={selCls}>
          <option value="all" className="bg-[#0b1020]">ทุกประเภท</option>
          <option value="REGISTER" className="bg-[#0b1020]">ลงทะเบียน</option>
          <option value="CONTACT" className="bg-[#0b1020]">ติดต่อ</option>
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selCls}>
          <option value="all" className="bg-[#0b1020]">ทุกสถานะ</option>
          <option value="NEW" className="bg-[#0b1020]">ใหม่</option>
          <option value="CONTACTED" className="bg-[#0b1020]">ติดต่อแล้ว</option>
          <option value="CLOSED" className="bg-[#0b1020]">ปิดแล้ว</option>
        </select>
        <span className="text-xs text-slate-500">{shown.length} / {rows.length} รายการ</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">ชื่อ / ติดต่อ</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">สนใจ / ข้อความ</th>
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id} className="border-t border-white/[0.06] align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{l.name}</div>
                  <div className="text-xs text-slate-400">{l.email}</div>
                  {l.phone && <div className="text-xs text-slate-500">{l.phone}</div>}
                  {l.company && <div className="text-xs text-slate-500">{l.company}</div>}
                </td>
                <td className="px-4 py-3"><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{l.type === 'REGISTER' ? 'ลงทะเบียน' : 'ติดต่อ'}</span></td>
                <td className="px-4 py-3 max-w-xs">
                  {l.service && <div className="text-xs text-[#9FC0FF]">{l.service}</div>}
                  {l.message && <div className="mt-0.5 text-xs text-slate-400">{l.message}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(l.createdAt).toLocaleString('th-TH')}</td>
                <td className="px-4 py-3">
                  <select value={l.status} disabled={busy === l.id} onChange={(e) => changeStatus(l.id, e.target.value)} className={`${selCls} ${STATUS_CLS[l.status]}`}>
                    {['NEW', 'CONTACTED', 'CLOSED'].map((s) => <option key={s} value={s} className="bg-[#0b1020] text-slate-100">{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(l.id)} disabled={busy === l.id} className="text-xs text-rose-300/80 hover:text-rose-200">ลบ</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">ยังไม่มีรายการ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
