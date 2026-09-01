import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';


export async function GET() {
  try {
    const { user: currentAdmin, admin } = await requireAdmin();
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    const ids = authData.users.map((u) => u.id);
    const { data: profiles, error: profileError } = ids.length
      ? await admin.from('profiles').select('id,full_name,role,plan_slug,suspended,updated_at').in('id', ids)
      : { data: [], error: null };
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    const users = authData.users.map((u) => {
      const p = map.get(u.id);
      return {
        id: u.id,
        email: u.email ?? '',
        full_name: p?.full_name ?? (u.user_metadata?.full_name ?? ''),
        role: p?.role ?? 'student',
        plan_slug: p?.plan_slug ?? 'free',
        suspended: p?.suspended ?? false,
        created_at: u.created_at,
        protected: u.id === currentAdmin.id,
      };
    });

    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể tải người dùng.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user: currentAdmin, admin } = await requireAdmin();
    const body = await req.json();
    const userId = String(body.userId || '');
    const action = String(body.action || '');
    if (!userId || !action) return NextResponse.json({ error: 'Thiếu userId/action.' }, { status: 400 });

    const { data: targetAuth, error: getError } = await admin.auth.admin.getUserById(userId);
    if (getError || !targetAuth.user) return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    if (targetAuth.user.id === currentAdmin.id) return NextResponse.json({ error: 'Không thể tự thay đổi tài khoản admin đang đăng nhập.' }, { status: 400 });

    if (action === 'promote_teacher' || action === 'demote_user') {
      const role = action === 'promote_teacher' ? 'teacher' : 'student';
      const { data, error } = await admin
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id,full_name,role,plan_slug,suspended')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await admin.auth.admin.updateUserById(userId, { user_metadata: { role } });
      return NextResponse.json(data);
    }

    if (action === 'toggle_suspended') {
      const { data: current } = await admin.from('profiles').select('suspended').eq('id', userId).single();
      const next = !Boolean(current?.suspended);
      const { data, error } = await admin.from('profiles').update({ suspended: next, updated_at: new Date().toISOString() }).eq('id', userId).select('id,suspended').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (action === 'set_plan') {
      const planSlug = String(body.planSlug || 'free');
      const { data: plan } = await admin.from('plans').select('slug').eq('slug', planSlug).single();
      if (!plan) return NextResponse.json({ error: 'Gói không tồn tại.' }, { status: 400 });
      const { data, error } = await admin.from('profiles').update({ plan_slug: planSlug, updated_at: new Date().toISOString() }).eq('id', userId).select('id,plan_slug').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Action không hợp lệ.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể cập nhật tài khoản.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user: currentAdmin, admin } = await requireAdmin();
    const body = await req.json();
    const userId = String(body.userId || '');
    if (!userId) return NextResponse.json({ error: 'Thiếu userId.' }, { status: 400 });

    const { data: targetAuth, error: getError } = await admin.auth.admin.getUserById(userId);
    if (getError || !targetAuth.user) return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    if (targetAuth.user.id === currentAdmin.id) return NextResponse.json({ error: 'Không thể tự xóa tài khoản admin đang đăng nhập.' }, { status: 400 });

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể xóa tài khoản.' }, { status: 500 });
  }
}
