import { NextResponse } from 'next/server';
import { getClassRole } from '@/lib/plan-access';

export async function GET(req: Request) {
  const classId = new URL(req.url).searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'Thiếu classId.' }, { status: 400 });
  const { supabase, user, isTeacher, membership, profile } = await getClassRole(classId);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  if (!isTeacher && !membership && profile?.role !== 'admin') return NextResponse.json({ error: 'Bạn không thuộc lớp.' }, { status: 403 });
  const [{ count: members }, { count: assignments }, { count: materials }] = await Promise.all([
    supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', classId),
    supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('class_id', classId),
    supabase.from('class_materials').select('*', { count: 'exact', head: true }).eq('class_id', classId),
  ]);
  return NextResponse.json({ members: members ?? 0, assignments: assignments ?? 0, materials: materials ?? 0 });
}
