import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ClassLivePanel from '@/components/class-live-panel-enhanced';
import ClassFeaturesPanel from '@/components/class-features-panel';
import DeleteClassButton from '@/components/delete-class-button';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: c } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: profile } = await supabase.from('profiles').select('role,plan_slug,suspended').eq('id', user.id).maybeSingle();
  if (profile?.suspended) redirect('/dashboard');
  const isTeacher = c.teacher_id === user.id;
  const isAdmin = profile?.role === 'admin';
  if (!isTeacher && !isAdmin) {
    const { data: member } = await supabase.from('class_members').select('class_id').eq('class_id', id).eq('student_id', user.id).maybeSingle();
    if (!member) return notFound();
  }
  const { data: rooms } = await supabase.from('live_rooms').select('*').eq('class_id', id).order('created_at', { ascending: false });

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white p-5"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="font-bold text-indigo-600">← Study26</Link>{(isTeacher||isAdmin)&&<DeleteClassButton classId={id}/>}</div><h1 className="mt-5 text-3xl font-black">{c.name}</h1><p className="mt-2 text-slate-500">Mã lớp: <b>{c.code}</b>{c.description?` · ${c.description}`:''}</p></div></header>
    <section className="mx-auto max-w-6xl p-5 sm:p-6"><ClassLivePanel classId={id} rooms={rooms||[]} canCreate={isTeacher||isAdmin}/><ClassFeaturesPanel classId={id} userId={user.id} isTeacher={isTeacher||isAdmin} plan={null}/></section>
  </main>;
}
