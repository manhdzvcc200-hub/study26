import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req:Request){
  try{
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:'Bạn chưa đăng nhập.'},{status:401});
    const body=await req.json().catch(()=>({}));
    const roomId=String(body.roomId||'').trim(),identity=String(body.identity||'').trim();
    if(!roomId||!identity)return NextResponse.json({error:'Thiếu roomId/identity.'},{status:400});
    const {data:room}=await supabase.from('live_rooms').select('id,created_by,join_code,status').eq('id',roomId).maybeSingle();
    if(!room)return NextResponse.json({error:'Không tìm thấy phòng.'},{status:404});
    if(room.created_by!==user.id)return NextResponse.json({error:'Chỉ giáo viên tạo phòng mới được kick.'},{status:403});
    const host=process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
    if(!host||!process.env.LIVEKIT_API_KEY||!process.env.LIVEKIT_API_SECRET)return NextResponse.json({error:'Thiếu cấu hình LiveKit.'},{status:500});
    const lk=new RoomServiceClient(host,process.env.LIVEKIT_API_KEY,process.env.LIVEKIT_API_SECRET);
    await lk.removeParticipant(room.join_code||room.id,identity);
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Không thể kick người dùng.'},{status:500});}
}
