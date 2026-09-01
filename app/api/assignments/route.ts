import { NextResponse } from 'next/server';
import { getClassRole } from '@/lib/plan-access';

export async function GET(req: Request) {
  const classId = new URL(req.url).searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'Thiếu classId.' }, { status: 400 });
  const { supabase, user, isTeacher, membership } = await getClassRole(classId);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  if (!isTeacher && !membership) return NextResponse.json({ error: 'Bạn không thuộc lớp.' }, { status: 403 });
  const { data, error } = await supabase.from('assignments').select('*').eq('class_id', classId).order('due_at', { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const classId = String(body.classId || '');
    const { supabase, user, isTeacher } = await getClassRole(classId);
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    if (!isTeacher) return NextResponse.json({ error: 'Chỉ giáo viên tạo bài tập.' }, { status: 403 });
    const { data, error } = await supabase.from('assignments').insert({
      class_id: classId, teacher_id: user.id, title: String(body.title || '').trim(),
      description: body.description ? String(body.description) : null,
      due_at: body.dueAt ? new Date(body.dueAt).toISOString() : null,
      max_score: Number(body.maxScore || 10),
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể tạo bài tập.' }, { status: 500 }); }
}
