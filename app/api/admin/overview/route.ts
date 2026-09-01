import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/admin-client';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    const admin = createAdminClient();
    const { data: me } = await admin.from('profiles').select('role,suspended').eq('id', user.id).maybeSingle();
    if (me?.suspended) return NextResponse.json({ error: 'Tài khoản đang bị khóa.' }, { status: 403 });
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Bạn không có quyền admin.' }, { status: 403 });

    const results = await Promise.all([
      admin.from('profiles').select('id,full_name,avatar_url,role,plan_slug,suspended,created_at,updated_at').order('created_at',{ascending:false}).limit(5000),
      admin.from('classes').select('id,name,code,description,teacher_id,created_at').order('created_at',{ascending:false}).limit(5000),
      admin.from('live_rooms').select('id,class_id,created_by,title,status,join_code,access_mode,created_at,ended_at').order('created_at',{ascending:false}).limit(5000),
      admin.from('teacher_profiles').select('*').order('updated_at',{ascending:false}).limit(5000),
      admin.from('assignments').select('id,class_id,teacher_id,title,due_at,created_at').order('created_at',{ascending:false}).limit(5000),
      admin.from('class_materials').select('id,class_id,teacher_id,title,created_at').order('created_at',{ascending:false}).limit(5000),
      admin.from('class_schedules').select('id,class_id,teacher_id,title,starts_at,created_at').order('starts_at',{ascending:false}).limit(5000),
      admin.from('attendance_sessions').select('id,class_id,teacher_id,title,starts_at,ended_at').order('starts_at',{ascending:false}).limit(5000),
    ]);
    const names = ['profiles','classes','rooms','teacherProfiles','assignments','materials','schedules','attendance'];
    const data: Record<string, unknown> = {};
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.error) return NextResponse.json({ error: `${names[i]}: ${result.error.message}` }, { status: 500 });
      data[names[i]] = result.data || [];
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.' }, { status: 500 });
  }
}
