import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const assignmentId = new URL(req.url).searchParams.get('assignmentId');
  if (!assignmentId) return NextResponse.json({ error: 'Thiếu assignmentId.' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  const { data, error } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    const { data: assignment } = await supabase.from('assignments').select('id,class_id').eq('id', body.assignmentId).maybeSingle();
    if (!assignment) return NextResponse.json({ error: 'Không tìm thấy bài tập.' }, { status: 404 });
    const { data: member } = await supabase.from('class_members').select('class_id').eq('class_id', assignment.class_id).eq('student_id', user.id).maybeSingle();
    if (!member) return NextResponse.json({ error: 'Bạn không thuộc lớp.' }, { status: 403 });
    const { data, error } = await supabase.from('assignment_submissions').upsert({
      assignment_id: body.assignmentId, student_id: user.id, content: String(body.content || ''), attachment_url: body.attachmentUrl ? String(body.attachmentUrl) : null, submitted_at: new Date().toISOString()
    }, { onConflict: 'assignment_id,student_id' }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể nộp bài.' }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
    const { data: submission } = await supabase.from('assignment_submissions').select('id,assignment_id').eq('id', body.submissionId).maybeSingle();
    if (!submission) return NextResponse.json({ error: 'Không tìm thấy bài nộp.' }, { status: 404 });
    const { data: assignment } = await supabase.from('assignments').select('teacher_id,max_score').eq('id', submission.assignment_id).maybeSingle();
    if (assignment?.teacher_id !== user.id) return NextResponse.json({ error: 'Chỉ giáo viên chấm điểm.' }, { status: 403 });
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0 || score > Number(assignment.max_score)) return NextResponse.json({ error: 'Điểm không hợp lệ.' }, { status: 400 });
    const { data, error } = await supabase.from('assignment_submissions').update({ score, feedback: body.feedback ? String(body.feedback) : null, graded_at: new Date().toISOString(), graded_by: user.id }).eq('id', body.submissionId).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể chấm điểm.' }, { status: 500 }); }
}
