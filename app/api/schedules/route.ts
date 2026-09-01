import { NextResponse } from 'next/server';
import { getClassRole } from '@/lib/plan-access';

export async function GET(req: Request) {
  const classId = new URL(req.url).searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'Thiếu classId.' }, { status: 400 });
  const { supabase, user, isTeacher, membership } = await getClassRole(classId);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  if (!isTeacher && !membership) return NextResponse.json({ error: 'Bạn không thuộc lớp.' }, { status: 403 });
  const { data, error } = await supabase.from('class_schedules').select('*').eq('class_id', classId).order('starts_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const classId = String(body.classId || '');
    const { supabase, user, isTeacher } = await getClassRole(classId);
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    if (!isTeacher) return NextResponse.json({ error: 'Chỉ giáo viên thêm lịch.' }, { status: 403 });
    const { data, error } = await supabase.from('class_schedules').insert({ class_id: classId, teacher_id: user.id, title: String(body.title || '').trim(), starts_at: new Date(body.startsAt).toISOString(), ends_at: body.endsAt ? new Date(body.endsAt).toISOString() : null, note: body.note ? String(body.note) : null }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể thêm lịch.' }, { status: 500 }); }
}
