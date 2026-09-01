'use client';

import { useState } from 'react';

type Room = { id: string; class_id: string; created_by: string; title: string; status: string; access_mode?: 'public'; join_code?: string; created_at: string };

export default function ClassLivePanelEnhanced({ classId, rooms, canCreate }: { classId: string; rooms: Room[]; canCreate: boolean }) {
  const [items, setItems] = useState<Room[]>(rooms);
  const [title, setTitle] = useState('Lớp học trực tiếp');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  async function create() {
    if (!title.trim()) return;
    setBusy('create'); setMsg('');
    try {
      const r = await fetch('/api/live/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ classId, title: title.trim() }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || 'Không thể tạo phòng.'); return; }
      setItems(v => [d.room, ...v]);
      setTitle('Lớp học trực tiếp');
      setMsg(`✅ Đã tạo phòng. Mã phòng: ${d.room.join_code}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Không thể kết nối máy chủ.'); }
    finally { setBusy(''); }
  }

  async function endRoom(id: string) {
    if (!confirm('Kết thúc phòng này? Học sinh đang trong phòng có thể bị ngắt kết nối.')) return;
    setBusy(id); setMsg('');
    const r = await fetch('/api/live/room', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId: id, action: 'end' }) });
    const d = await r.json();
    if (!r.ok) setMsg(d.error || 'Không thể kết thúc phòng.');
    else { setItems(v => v.map(x => x.id === id ? { ...x, status: 'ended' } : x)); setMsg('Đã kết thúc phòng.'); }
    setBusy('');
  }

  async function remove(id: string) {
    if (!confirm('Xóa phòng này vĩnh viễn?')) return;
    setBusy(id); setMsg('');
    const r = await fetch(`/api/live/room?roomId=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const d = await r.json();
    if (!r.ok) setMsg(d.error || 'Không thể xóa phòng.');
    else { setItems(v => v.filter(x => x.id !== id)); setMsg('Đã xóa phòng.'); }
    setBusy('');
  }

  const active = items.filter(r => r.status !== 'ended');
  return <section className="mt-6 space-y-4">
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black">🎥 Phòng học trực tiếp</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">Phòng dùng <b>mã phòng</b> duy nhất. Học sinh chỉ cần mã phòng, không cần mật khẩu.</p>
      {canCreate && <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={title} onChange={e => setTitle(e.target.value)} className="min-w-0 flex-1 rounded-xl border p-3 outline-none focus:border-indigo-500" placeholder="Tên phòng học"/><button disabled={busy==='create'} onClick={create} className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-50">{busy==='create'?'Đang tạo…':'+ Tạo phòng'}</button></div>}
      {msg && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{msg}</p>}
    </div>

    {active.map(r => <article key={r.id} className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="font-black text-slate-900">{r.title}</div><div className="mt-1 text-sm text-slate-500">Mã phòng: <b className="tracking-wider text-indigo-600">{r.join_code || r.id.slice(0,8).toUpperCase()}</b> · 🌐 Chỉ cần mã phòng</div></div><div className="flex flex-wrap gap-2"><a href={`/live/${r.id}`} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">🎥 Vào phòng</a>{canCreate && <><button onClick={() => endRoom(r.id)} disabled={!!busy} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 font-bold text-amber-700">⏹ Kết thúc</button><button onClick={() => remove(r.id)} disabled={!!busy} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-600">🗑 Xóa</button></>}</div></div></article>)}
    {active.length===0 && <div className="rounded-3xl border border-dashed bg-white p-8 text-center text-slate-400">Chưa có phòng đang hoạt động.</div>}
  </section>;
}
