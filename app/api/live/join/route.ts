import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const joinCode = String(body.joinCode || '').trim().toUpperCase();
    if (!joinCode) return NextResponse.json({ error: 'Vui lòng nhập mã phòng.' }, { status: 400 });

    const { data, error } = await supabase.rpc('study26_join_room', { p_join_code: joinCode });
    if (error) {
      console.error('JOIN ROOM RPC ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.ok) {
      return NextResponse.json({ error: data?.error || 'Không thể vào phòng.' }, { status: Number(data?.status || 400) });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('JOIN LIVE ROOM ERROR:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể vào phòng.' }, { status: 500 });
  }
}
