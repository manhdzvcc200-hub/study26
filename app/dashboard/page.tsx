import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClassManager from '@/components/class-manager';
import TeacherProfileEditor from '@/components/teacher-profile-editor';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (profile?.suspended) redirect('/login');

  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id,classes(id,name,code,description,teacher_id)')
    .eq('student_id', user.id);

  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id,name,code,description,teacher_id')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const isTeacher = profile?.role === 'teacher';
  const isAdmin = profile?.role === 'admin';

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="text-2xl font-black tracking-tight text-slate-900">Study<span className="text-indigo-600">26</span></Link>
          <div className="flex items-center gap-2">
            {isAdmin && <Link href="/admin" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white">👑 Admin</Link>}
            <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold sm:block">{profile?.full_name || user.email}</div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_right,#6366f133,transparent_40%),linear-gradient(135deg,#0b1020,#151d39)] p-6 text-white shadow-2xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.24em] text-indigo-300">Study26 Academy</div><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Xin chào, {profile?.full_name || 'bạn'} 👋</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">Mọi thứ bạn cần để dạy và học trực tuyến — lớp học, phòng live, bài tập và tài liệu — ngay trong một không gian.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Link href="/live/join" className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-4 text-center font-black hover:bg-white/[.1]">🎥<br/><span className="mt-1 block text-sm">Vào phòng</span></Link>{(isTeacher||isAdmin)&&<Link href="#classes" className="rounded-2xl bg-indigo-500 px-4 py-4 text-center font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-400">🏫<br/><span className="mt-1 block text-sm">Quản lý lớp</span></Link>}<Link href="#classes" className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-4 text-center font-black hover:bg-white/[.1]">📚<br/><span className="mt-1 block text-sm">Lớp của tôi</span></Link></div>
          </div>
        </div>

        {(isTeacher || isAdmin) && <div id="classes" className="mt-7"><ClassManager classes={teacherClasses || []} isTeacher /></div>}

        <section id="classes" className="mt-7">
          <div className="flex items-end justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">Learning space</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Các lớp bạn tham gia</h2></div><Link href="/live/join" className="text-sm font-black text-indigo-600 hover:text-indigo-500">Vào lớp bằng mã →</Link></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(memberships || []).map((m: any) => <Link key={m.class_id} href={`/class/${m.class_id}`} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"><div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-xl">📘</div><span className="text-xs font-bold text-slate-400">{m.classes?.code}</span></div><div className="mt-5 text-xl font-black group-hover:text-indigo-600">{m.classes?.name}</div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{m.classes?.description || 'Lớp học Study26'}</p></Link>)}
            {(!memberships || memberships.length === 0) && <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="text-4xl">📚</div><h3 className="mt-3 text-lg font-black">Chưa có lớp học</h3><p className="mt-1 text-sm text-slate-500">Hãy dùng mã phòng giáo viên cung cấp để tham gia lớp học trực tiếp.</p><Link href="/live/join" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-black text-white">🎥 Vào phòng bằng mã</Link></div>}
          </div>
        </section>

        {isTeacher && <div className="mt-8"><TeacherProfileEditor /></div>}
      </section>
    </main>
  );
}
