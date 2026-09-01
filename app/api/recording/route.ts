import { NextResponse } from 'next/server';
import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role,suspended').eq('id', user.id).maybeSingle();
    if (profile?.suspended) return NextResponse.json({ error: 'Tài khoản đang bị khóa.' }, { status: 403 });
    if (profile?.role !== 'teacher' && profile?.role !== 'admin') return NextResponse.json({ error: 'Chỉ giáo viên mới được ghi hình.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const roomName = String(body.roomName || '').trim();
    if (!roomName) return NextResponse.json({ error: 'Thiếu roomName.' }, { status: 400 });

    const { data: room } = await supabase.from('live_rooms').select('id,created_by,join_code,status').eq('join_code', roomName).maybeSingle();
    if (!room) return NextResponse.json({ error: 'Không tìm thấy phòng học.' }, { status: 404 });
    if (profile.role !== 'admin' && room.created_by !== user.id) return NextResponse.json({ error: 'Chỉ chủ phòng mới được ghi hình.' }, { status: 403 });

    const host = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const bucket = process.env.RECORDING_S3_BUCKET;
    const accessKey = process.env.RECORDING_S3_ACCESS_KEY;
    const secret = process.env.RECORDING_S3_SECRET;
    const region = process.env.RECORDING_S3_REGION;
    if (!host || !apiKey || !apiSecret || !bucket || !accessKey || !secret || !region) {
      return NextResponse.json({ error: 'Ghi hình chưa được cấu hình lưu trữ S3 trên server.' }, { status: 503 });
    }

    const egress = new EgressClient(host, apiKey, apiSecret);
    const action = String(body.action || 'start');
    if (action === 'stop') {
      if (!body.egressId) return NextResponse.json({ error: 'Thiếu egressId.' }, { status: 400 });
      const info = await egress.stopEgress(String(body.egressId));
      return NextResponse.json({ ok: true, info });
    }

    const filename = `study26/${roomName}-${Date.now()}.mp4`;
    const output = new EncodedFileOutput({
      filepath: filename,
      output: { case: 's3', value: new S3Upload({ accessKey, secret, region, bucket }) },
    });
    const info = await egress.startRoomCompositeEgress(roomName, { file: output }, { layout: 'grid' });
    return NextResponse.json({ ok: true, egressId: info.egressId ?? null, info });
  } catch (e) {
    console.error('RECORDING ERROR', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể ghi hình.' }, { status: 500 });
  }
}
