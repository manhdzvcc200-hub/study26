import { NextResponse } from 'next/server';
import { getClassRole } from '@/lib/plan-access';

export async function GET(req: Request) {
  const classId = new URL(req.url).searchParams.get('classId');
  if (!classId) return NextResponse.json({ error: 'Thiếu classId.' }, { status: 400 });
  const { supabase, user, isTeacher, membership } = await getClassRole(classId);
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  if (!isTeacher && !membership) return NextResponse.json({ error: 'Bạn không thuộc lớp.' }, { status: 403 });
  const { data: sessions, error } = await supabase.from('attendance_sessions').select('*').eq('class_id', classId).order('starts_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(sessions ?? []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const classId = String(body.classId || '');
    const { supabase, user, isTeacher } = await getClassRole(classId);
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    if (!isTeacher) return NextResponse.json({ error: 'Chỉ giáo viên tạo phiên điểm danh.' }, { status: 403 });
    const { data, error } = await supabase.from('attendance_sessions').insert({ class_id: classId, teacher_id: user.id, title: String(body.title || 'Điểm danh') }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể tạo điểm danh.' }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const supabase = await (await import('@/lib/supabase/server')).createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    const { data: session } = await supabase.from('attendance_sessions').select('id,teacher_id').eq('id', body.sessionId).maybeSingle();
    if (!session) return NextResponse.json({ error: 'Không tìm thấy phiên.' }, { status: 404 });
    if (session.teacher_id !== user.id) return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 });
    const status = ['present','late','absent','excused'].includes(body.status) ? body.status : 'present';
    const { data, error } = await supabase.from('attendance_records').upsert({ session_id: body.sessionId, student_id: body.studentId, status, marked_at: new Date().toISOString() }, { onConflict: 'session_id,student_id' }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể cập nhật điểm danh.' }, { status: 500 }); }
}
