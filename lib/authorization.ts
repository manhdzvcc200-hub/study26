import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/admin-client';

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,role,plan_slug,suspended,avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) throw new Error('Bạn chưa đăng nhập.');
  if (profile?.suspended) throw new Error('Tài khoản đang bị khóa.');
  if (profile?.role !== 'admin') throw new Error('Bạn không có quyền admin.');
  return { user, profile, admin: createAdminClient() };
}
