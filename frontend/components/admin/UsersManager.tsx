'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser, UserRole } from '@/lib/admin-users';
import {
  createUserAction,
  updateUserAction,
  resetUserPasswordAction,
  deleteUserAction,
} from '@/lib/admin-users-actions';

type ModalState =
  | null
  | { mode: 'create' }
  | { mode: 'edit'; user: AdminUser };

interface FormState {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  displayName: string;
}

const EMPTY_FORM: FormState = {
  email: '',
  password: '',
  role: 'USER',
  firstName: '',
  lastName: '',
  displayName: '',
};

function fullName(u: AdminUser): string {
  return (
    u.displayName ||
    [u.firstName, u.lastName].filter(Boolean).join(' ') ||
    u.name ||
    '—'
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return role === 'ADMIN' ? (
    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
      ADMIN
    </span>
  ) : (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
      USER
    </span>
  );
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return initialUsers;
    return initialUsers.filter((u) =>
      [u.email, u.firstName, u.lastName, u.displayName, u.name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s)),
    );
  }, [q, initialUsers]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModal({ mode: 'create' });
  }
  function openEdit(u: AdminUser) {
    setForm({
      email: u.email,
      password: '',
      role: u.role,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      displayName: u.displayName ?? '',
    });
    setError(null);
    setModal({ mode: 'edit', user: u });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      if (modal?.mode === 'create') {
        const r = await createUserAction({
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          displayName: form.displayName.trim() || undefined,
        });
        if (!r.ok) return setError(r.error);
      } else if (modal?.mode === 'edit') {
        const r = await updateUserAction(modal.user.id, {
          email: form.email.trim(),
          role: form.role,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          displayName: form.displayName.trim(),
        });
        if (!r.ok) return setError(r.error);
      }
      setModal(null);
      router.refresh();
    });
  }

  function resetPw(u: AdminUser) {
    const pw = window.prompt(
      `ตั้งรหัสผ่านใหม่ให้ ${u.email} (อย่างน้อย 8 ตัวอักษร)`,
    );
    if (!pw) return;
    if (pw.length < 8) {
      window.alert('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }
    setBusyId(u.id);
    startTransition(async () => {
      const r = await resetUserPasswordAction(u.id, pw);
      setBusyId(null);
      window.alert(r.ok ? 'ตั้งรหัสผ่านใหม่เรียบร้อย' : r.error);
    });
  }

  function del(u: AdminUser) {
    if (
      !window.confirm(
        `ลบผู้ใช้ "${u.email}"?\nบทความ/ประวัติของผู้ใช้นี้จะยังอยู่ (ผู้เขียนเปลี่ยนเป็นว่าง)`,
      )
    )
      return;
    setBusyId(u.id);
    startTransition(async () => {
      const r = await deleteUserAction(u.id);
      setBusyId(null);
      if (!r.ok) window.alert(r.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ผู้ใช้งาน</h1>
          <p className="mt-1 text-sm text-slate-400">
            เพิ่ม แก้ไข ลบ และกำหนดสิทธิ์ (role) ของผู้ใช้ในระบบ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + เพิ่มผู้ใช้
        </button>
      </div>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา อีเมล / ชื่อ…"
          className="w-full max-w-sm rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">อีเมล</th>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">สิทธิ์</th>
              <th className="px-4 py-3">สร้างเมื่อ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = currentUserId === u.id;
              return (
                <tr
                  key={u.id}
                  className={`border-t border-white/[0.06] ${busyId === u.id && pending ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{u.email}</div>
                    {isSelf && (
                      <div className="text-[10px] text-slate-500">
                        บัญชีของคุณ
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{fullName(u)}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => resetPw(u)}
                      className="ml-3 text-slate-300 hover:text-white"
                    >
                      รีเซ็ตรหัส
                    </button>
                    <button
                      onClick={() => del(u)}
                      disabled={isSelf}
                      title={isSelf ? 'ลบบัญชีตนเองไม่ได้' : undefined}
                      className="ml-3 text-rose-300/80 hover:text-rose-200 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:text-slate-600"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  {q ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !pending && setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#0B1120] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">
              {modal.mode === 'create' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}
            </h2>

            <div className="space-y-3">
              <Field label="อีเมล">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {modal.mode === 'create' && (
                <Field label="รหัสผ่าน (อย่างน้อย 8 ตัว)">
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
              )}

              <Field label="สิทธิ์ (Role)">
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                  className={inputCls}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ชื่อ">
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="นามสกุล">
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="ชื่อที่แสดง (Display name)">
                <input
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            {error && (
              <div className="mt-3 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                disabled={pending}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submit}
                disabled={pending}
                className="rounded-md bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {pending ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      {children}
    </label>
  );
}
