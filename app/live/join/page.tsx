'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      const response = await fetch('/api/live/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ joinCode: normalized }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tìm phòng.');
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tìm phòng.');
    } finally {
      setBusy(false);
    }
  }

  function enterRoom() {
    if (!preview?.roomId) return;
    router.push(`/live/${preview.roomId}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#312e81_0,_#0f172a_42%,_#020617_100%)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur sm:p-9">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">Study26 Live</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Vào lớp bằng mã phòng</h1>
            <p className="mt-3 leading-7 text-slate-300">Chỉ cần nhập mã phòng do giáo viên cung cấp. Không dùng mật khẩu, không cần thêm bước rườm rà.</p>
            <form onSubmit={lookup} className="mt-8 space-y-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={8}
                autoFocus
                placeholder="Ví dụ: 7AF29C10"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-lg font-black tracking-[0.22em] outline-none focus:border-indigo-400"
              />
              {error && <div className="rounded-2xl bg-red-500/10 p-4 text-sm font-semibold text-red-200">⚠️ {error}</div>}
              <button disabled={busy || code.trim().length < 4} className="w-full rounded-2xl bg-indigo-500 px-5 py-4 font-black shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? 'Đang tìm phòng…' : 'Tìm phòng'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="w-full rounded-2xl border border-white/10 px-5 py-4 font-bold text-slate-300 hover:bg-white/5">Về Dashboard</button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl sm:p-9">
            {!preview ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-4xl">👩‍🏫</div>
                <h2 className="mt-6 text-2xl font-black">Thông tin giáo viên sẽ hiện ở đây</h2>
                <p className="mt-2 max-w-md leading-6 text-slate-500">Sau khi nhập đúng mã phòng, Study26 sẽ cho bạn xem giáo viên, lớp học và thông tin giới thiệu trước khi vào lớp.</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-slate-100 ring-4 ring-indigo-50">
                    {preview.teacher.avatarUrl ? <img src={preview.teacher.avatarUrl} alt="Ảnh giáo viên" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-5xl">👩‍🏫</div>}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black">{preview.teacher.fullName}</h2>
                      {preview.teacher.verified && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">✓ Đã xác minh</span>}
                    </div>
                    <p className="mt-1 font-semibold text-indigo-600">{preview.teacher.headline}</p>
                    <p className="mt-1 text-sm text-slate-500">Lớp: {preview.room.className}</p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <Info label="Trình độ" value={preview.teacher.education} icon="🎓" />
                  <Info label="Chuyên môn" value={preview.teacher.specialization} icon="📚" />
                  <Info label="Kinh nghiệm" value={preview.teacher.experienceYears ? `${preview.teacher.experienceYears} năm` : null} icon="⏳" />
                  <Info label="Học sinh đã dạy" value={preview.teacher.studentsTaught ? `${preview.teacher.studentsTaught}+` : null} icon="👨‍🎓" />
                </div>

                {(preview.teacher.schools || preview.teacher.achievements || preview.teacher.bio) && (
                  <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm leading-6">
                    {preview.teacher.schools && <p><b>🏫 Đã giảng dạy:</b> {preview.teacher.schools}</p>}
                    {preview.teacher.achievements && <p><b>🏆 Thành tích:</b> {preview.teacher.achievements}</p>}
                    {preview.teacher.bio && <p><b>💬 Giới thiệu:</b> {preview.teacher.bio}</p>}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">
                  🎥 <b>{preview.room.title}</b> · Mã phòng <b>{preview.room.joinCode}</b>
                </div>

                <button onClick={enterRoom} className="mt-5 w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white shadow-lg hover:bg-indigo-700">Vào phòng học</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value, icon }: { label: string; value?: string | null; icon: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="text-lg">{icon}</div><div className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 font-bold text-slate-800">{value || 'Chưa cập nhật'}</div></div>;
}
