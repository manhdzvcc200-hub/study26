import { createClient } from '@/lib/supabase/server';

export type AccessResult = {
  allowed: boolean;
  feature: string;
  plan: any | null;
  profile: any | null;
  user: any | null;
};

export async function getAccess(feature: string): Promise<AccessResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, feature, plan: null, profile: null, user: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role,plan_slug,suspended,full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.suspended) return { allowed: false, feature, plan: null, profile, user };
  const { data: plan } = await supabase
    .from('plans')
    .select('slug,name,features,ai_daily_limit')
    .eq('slug', profile?.plan_slug ?? 'free')
    .maybeSingle();
  return { allowed: Boolean(plan?.features?.[feature]), feature, plan, profile, user };
}

export async function requireFeature(feature: string) {
  const access = await getAccess(feature);
  if (!access.user) throw new Response('Unauthorized', { status: 401 });
  if (access.profile?.suspended) throw new Response('Tài khoản đang bị khóa.', { status: 403 });
  if (!access.allowed) throw new Response(`Gói ${access.profile?.plan_slug ?? 'free'} chưa có tính năng ${feature}.`, { status: 403 });
  return access;
}

export async function getClassRole(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isTeacher: false, isAdmin: false, membership: null };
  const { data: klass } = await supabase.from('classes').select('id,teacher_id').eq('id', classId).maybeSingle();
  const isTeacher = klass?.teacher_id === user.id;
  const { data: profile } = await supabase.from('profiles').select('role,plan_slug,suspended').eq('id', user.id).maybeSingle();
  const { data: membership } = isTeacher ? { data: null } : await supabase.from('class_members').select('class_id').eq('class_id', classId).eq('student_id', user.id).maybeSingle();
  return { supabase, user, isTeacher, isAdmin: profile?.role === 'admin', membership, profile, klass };
}
