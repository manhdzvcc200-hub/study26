'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteClassButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm('Xóa lớp học này? Toàn bộ nội dung liên quan có thể bị xóa và không thể hoàn tác.')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/classes/${encodeURIComponent(classId)}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Không thể xóa lớp.');
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xóa lớp.');
      setBusy(false);
    }
  }
  return <button disabled={busy} onClick={remove} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50">{busy ? 'Đang xóa…' : '🗑 Xóa lớp'}</button>;
}
