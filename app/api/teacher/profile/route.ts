import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function authTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('id,role,suspended').eq('id', user.id).maybeSingle();
  if (profile?.suspended) return { error: NextResponse.json({ error: 'Tài khoản đang bị khóa.' }, { status: 403 }) };
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Chỉ giáo viên mới có hồ sơ này.' }, { status: 403 }) };
  return { user, profile, supabase };
}

const emptyProfile = (userId: string) => ({
  user_id: userId,
  headline: '', education: '', specialization: '', experience_years: 0,
  schools: '', achievements: '', students_taught: 0, bio: '', verified: false, avatar_url: null,
});

export async function GET() {
  try {
    const auth = await authTeacher();
    if ('error' in auth) return auth.error;
    const { data, error } = await auth.supabase.from('teacher_profiles').select('*').eq('user_id', auth.user.id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || emptyProfile(auth.user.id));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể tải hồ sơ.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await authTeacher();
    if ('error' in auth) return auth.error;
    const body = await req.json().catch(() => ({}));

    const payload = {
      user_id: auth.user.id,
      headline: String(body.headline || '').trim().slice(0, 120),
      education: String(body.education || '').trim().slice(0, 300),
      specialization: String(body.specialization || '').trim().slice(0, 300),
      experience_years: Math.max(0, Math.min(80, Number(body.experience_years || 0))),
      schools: String(body.schools || '').trim().slice(0, 1000),
      achievements: String(body.achievements || '').trim().slice(0, 1500),
      students_taught: Math.max(0, Math.min(1000000, Number(body.students_taught || 0))),
      bio: String(body.bio || '').trim().slice(0, 2000),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auth.supabase
      .from('teacher_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (body.avatarUrl !== undefined) {
      const avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim().slice(0, 2000) : null;
      const { error: avatarError } = await auth.supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', auth.user.id);
      if (avatarError) return NextResponse.json({ error: avatarError.message }, { status: 500 });
      data.avatar_url = avatarUrl;
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể lưu hồ sơ.' }, { status: 500 });
  }
}
