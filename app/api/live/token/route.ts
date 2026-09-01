import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || '').trim();
    if (!roomId) return NextResponse.json({ error: 'Thiếu roomId.' }, { status: 400 });

    const { data: access, error: accessError } = await supabase.rpc('study26_get_room_access', { p_room_id: roomId });
    if (accessError) {
      console.error('ROOM ACCESS RPC ERROR:', accessError);
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }
    if (!access?.ok) {
      return NextResponse.json({ error: access?.error || 'Bạn không có quyền vào phòng.' }, { status: Number(access?.status || 403) });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: 'Thiếu cấu hình LiveKit trên server.' }, { status: 500 });
    }

    const participantName = String(access.participantName || user.user_metadata?.full_name || 'Study26 user').slice(0, 80);
    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: participantName,
      ttl: '2h',
    });

    accessToken.addGrant({
      roomJoin: true,
      room: access.joinCode || roomId,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
      roomAdmin: Boolean(access.isOwner || access.isAdmin),
    });

    return NextResponse.json({
      ok: true,
      token: await accessToken.toJwt(),
      serverUrl,
      room: { id: roomId, title: access.title, joinCode: access.joinCode },
      participant: { id: user.id, name: participantName, role: access.role },
      teacher: access.teacher,
    });
  } catch (e) {
    console.error('LIVE TOKEN ERROR:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể cấp token phòng học.' }, { status: 500 });
  }
}
