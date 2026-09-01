import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function authTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,suspended')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.suspended) return { error: NextResponse.json({ error: 'Tài khoản đang bị khóa.' }, { status: 403 }) };
  if (!['teacher', 'admin'].includes(profile?.role || '')) {
    return { error: NextResponse.json({ error: 'Chỉ giáo viên hoặc admin mới được quản lý lớp.' }, { status: 403 }) };
  }

  return { user, profile, supabase };
}

export async function POST(req: Request) {
  try {
    const auth = await authTeacher();
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    if (!name) return NextResponse.json({ error: 'Tên lớp không được để trống.' }, { status: 400 });

    const { supabase } = auth;
    let code = '';
    for (let i = 0; i < 20; i++) {
      const candidate = makeCode();
      const { data: exists } = await supabase.from('classes').select('id').eq('code', candidate).maybeSingle();
      if (!exists) { code = candidate; break; }
    }
    if (!code) return NextResponse.json({ error: 'Không thể tạo mã lớp. Vui lòng thử lại.' }, { status: 500 });

    const { data, error } = await supabase
      .from('classes')
      .insert({ teacher_id: auth.user.id, name, description, code })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể tạo lớp.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await authTeacher();
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    if (!id || !name) return NextResponse.json({ error: 'Thiếu thông tin lớp.' }, { status: 400 });

    const { data: klass } = await auth.supabase
      .from('classes')
      .select('id,teacher_id')
      .eq('id', id)
      .maybeSingle();
    if (!klass) return NextResponse.json({ error: 'Không tìm thấy lớp.' }, { status: 404 });

    const isOwner = klass.teacher_id === auth.user.id;
    const isAdmin = auth.profile?.role === 'admin';
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Không có quyền sửa lớp.' }, { status: 403 });

    const { data, error } = await auth.supabase
      .from('classes')
      .update({ name, description })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể sửa lớp.' }, { status: 500 });
  }
}
