'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  user_id: string; headline: string; education: string; specialization: string; experience_years: number;
  schools: string; achievements: string; students_taught: number; bio: string; verified: boolean; avatar_url?: string | null;
};

export default function TeacherProfileEditor() {
  const [data, setData] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { (async () => {
    const r = await fetch('/api/teacher/profile'); const d = await r.json();
    if (r.ok) { setData(d); setAvatarUrl(d.avatar_url || ''); } else setError(d.error || 'Không tải được hồ sơ.');
  })(); }, []);

  async function uploadAvatar(file: File) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Phiên đăng nhập đã hết.');
    if (!file.type.startsWith('image/')) throw new Error('Chỉ nhận file ảnh.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh tối đa 5MB.');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) throw upload.error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  }

  async function save() {
    if (!data) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/teacher/profile', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, avatarUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể lưu hồ sơ.');
      setData(result); setMessage('Đã lưu hồ sơ giáo viên.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu hồ sơ.'); }
    finally { setBusy(false); }
  }

  if (!data) return <section className="rounded-3xl border bg-white p-6">{error ? <div className="text-red-600">{error}</div> : 'Đang tải hồ sơ giáo viên…'}</section>;

  const field = (key: keyof Profile, label: string, placeholder: string) => <label className="block text-sm font-bold text-slate-700"><span>{label}</span><input value={String(data[key] ?? '')} onChange={(e) => setData({ ...data, [key]: e.target.value } as Profile)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-indigo-500" /></label>;

  return <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">Hồ sơ giáo viên</div><h2 className="mt-2 text-2xl font-black">Hồ sơ chuyên môn của bạn</h2><p className="mt-1 text-sm text-slate-500">Thông tin này có thể hiện trước khi học sinh vào phòng.</p></div>
      {data.verified && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">✓ Đã xác minh</span>}
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[180px_1fr]">
      <div>
        <div className="h-40 w-40 overflow-hidden rounded-[2rem] bg-slate-100">{avatarUrl ? <img src={avatarUrl} alt="Ảnh giáo viên" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-5xl">👩‍🏫</div>}</div>
        <label className="mt-3 block cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-bold hover:bg-slate-50">📷 Tải ảnh<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { await uploadAvatar(file); setMessage('Ảnh đã tải lên, hãy bấm Lưu hồ sơ.'); } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tải ảnh.'); } }} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {field('headline','Chức danh / mô tả ngắn','Ví dụ: Giáo viên Toán THPT')}
        {field('education','Trình độ học vấn','Ví dụ: Thạc sĩ Toán học')}
        {field('specialization','Chuyên môn','Ví dụ: Toán 10–12, luyện thi THPT')}
        {field('experience_years','Số năm kinh nghiệm','8')}
        {field('schools','Trường/đơn vị từng giảng dạy','Ví dụ: THPT ...; Trung tâm ...')}
        {field('achievements','Thành tích / giải thưởng','Ví dụ: Giáo viên giỏi cấp ...')}
        {field('students_taught','Số học sinh từng giảng dạy','1250')}
        <label className="block text-sm font-bold text-slate-700 md:col-span-2">Giới thiệu<textarea value={data.bio || ''} onChange={(e) => setData({ ...data, bio: e.target.value })} rows={4} placeholder="Giới thiệu bản thân, phương pháp giảng dạy…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-indigo-500" /></label>
      </div>
    </div>
    {message && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">✅ {message}</div>}
    {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">⚠️ {error}</div>}
    <button onClick={save} disabled={busy} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-50">{busy ? 'Đang lưu…' : '💾 Lưu hồ sơ giáo viên'}</button>
  </section>;
}
