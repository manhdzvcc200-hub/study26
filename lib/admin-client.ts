import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !secret) {
    throw new Error('Admin cần SUPABASE_SERVICE_ROLE_KEY trong Environment Variables trên server/Vercel.');
  }

  if (secret.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY đang chứa Publishable key. Hãy dùng Secret/Service Role key của Supabase.');
  }

  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
