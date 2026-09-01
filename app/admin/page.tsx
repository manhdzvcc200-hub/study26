import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminCenter from '@/components/admin-center';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');
  return <AdminCenter />;
}
