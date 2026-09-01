import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,.28),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,.2),transparent_30%)]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-2xl font-black tracking-tight">Study<span className="text-indigo-400">26</span></Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">Đăng nhập</Link>
          <Link href="/register" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-400">Bắt đầu học</Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-indigo-300">Nền tảng học trực tuyến</div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Dạy học trực tiếp. <span className="text-indigo-400">Gọn hơn.</span> Chuyên nghiệp hơn.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Study26 kết hợp lớp học, phòng học trực tiếp và công cụ quản lý học tập trong một không gian hiện đại cho giáo viên và học sinh.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-2xl bg-indigo-500 px-6 py-4 text-center font-black shadow-2xl shadow-indigo-500/20 hover:bg-indigo-400">Tạo tài khoản miễn phí →</Link>
            <Link href="/live/join" className="rounded-2xl border border-white/10 bg-white/[.04] px-6 py-4 text-center font-black text-slate-100 hover:bg-white/[.08]">🎥 Vào lớp bằng mã</Link>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-slate-400">
            <FeatureStat icon="🎥" text="Phòng live" />
            <FeatureStat icon="📚" text="Quản lý lớp" />
            <FeatureStat icon="👨‍🏫" text="Hồ sơ giáo viên" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-[3rem] bg-indigo-500/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/10 bg-white/[.06] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1020] p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><div className="text-xs font-bold uppercase tracking-widest text-slate-500">Study26 Live</div><div className="mt-1 text-xl font-black">Lớp Toán 12A1</div></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">● Đang trực tiếp</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {['🎤 Mic','📷 Camera','🖥️ Chia sẻ','💬 Chat','✋ Giơ tay','📝 Bảng trắng'].map((x)=><div key={x} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm font-bold text-slate-200">{x}</div>)}
              </div>
              <div className="mt-5 rounded-2xl border border-indigo-400/10 bg-indigo-500/[.06] p-4"><div className="text-xs font-bold uppercase tracking-wider text-indigo-300">Mã phòng</div><div className="mt-2 text-3xl font-black tracking-[.22em]">A7K9P2QX</div><div className="mt-2 text-xs text-slate-500">Học sinh chỉ cần mã phòng để tham gia.</div></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureStat({ icon, text }: { icon: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><div>{icon}</div><div className="mt-2 font-bold text-slate-300">{text}</div></div>;
}
