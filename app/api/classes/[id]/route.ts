import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role,suspended').eq('id', user.id).maybeSingle();
    if (profile?.suspended) return NextResponse.json({ error: 'Tài khoản đang bị khóa.' }, { status: 403 });

    const { data: klass } = await supabase.from('classes').select('id,teacher_id').eq('id', id).maybeSingle();
    if (!klass) return NextResponse.json({ error: 'Không tìm thấy lớp.' }, { status: 404 });

    if (klass.teacher_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ giáo viên của lớp hoặc admin mới được xóa lớp.' }, { status: 403 });
    }

    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể xóa lớp.' }, { status: 500 });
  }
}
