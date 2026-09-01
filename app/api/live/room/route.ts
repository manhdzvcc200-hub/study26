import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function makeCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const classId = String(body.classId || "").trim();
    const title = String(body.title || "").trim() || "Phòng học Study26";
    if (!classId) return NextResponse.json({ error: "Thiếu classId." }, { status: 400 });

    const { data: klass, error: classError } = await supabase
      .from("classes")
      .select("id,name,teacher_id")
      .eq("id", classId)
      .maybeSingle();
    if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
    if (!klass) return NextResponse.json({ error: "Không tìm thấy lớp học." }, { status: 404 });
    if (klass.teacher_id !== user.id) return NextResponse.json({ error: "Chỉ giáo viên của lớp mới được tạo phòng." }, { status: 403 });

    let joinCode = "";
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = makeCode();
      const { data: exists } = await supabase.from("live_rooms").select("id").eq("join_code", candidate).maybeSingle();
      if (!exists) { joinCode = candidate; break; }
    }
    if (!joinCode) return NextResponse.json({ error: "Không thể tạo mã phòng. Vui lòng thử lại." }, { status: 500 });

    const { data: room, error: insertError } = await supabase
      .from("live_rooms")
      .insert({ class_id: classId, created_by: user.id, title, status: "live", join_code: joinCode, access_mode: "public" })
      .select("id,class_id,created_by,title,status,join_code,access_mode,created_at")
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ ok: true, room, joinCode });
  } catch (error) {
    console.error("CREATE LIVE ROOM ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tạo phòng." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || "").trim();
    const action = String(body.action || "").trim();
    if (!roomId || !action) return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });

    const { data: room } = await supabase.from("live_rooms").select("id,created_by,status").eq("id", roomId).maybeSingle();
    if (!room) return NextResponse.json({ error: "Không tìm thấy phòng." }, { status: 404 });
    if (room.created_by !== user.id) return NextResponse.json({ error: "Bạn không có quyền quản lý phòng này." }, { status: 403 });

    if (action === "end") {
      const { data, error } = await supabase.from("live_rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", roomId).select("id,status,ended_at").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, room: data });
    }
    return NextResponse.json({ error: "Action không hợp lệ." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật phòng." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    const url = new URL(req.url);
    const roomId = String(url.searchParams.get("roomId") || "").trim();
    if (!roomId) return NextResponse.json({ error: "Thiếu roomId." }, { status: 400 });
    const { data: room } = await supabase.from("live_rooms").select("id,created_by").eq("id", roomId).maybeSingle();
    if (!room) return NextResponse.json({ error: "Không tìm thấy phòng." }, { status: 404 });
    if (room.created_by !== user.id) return NextResponse.json({ error: "Bạn không có quyền xóa phòng này." }, { status: 403 });
    const { error } = await supabase.from("live_rooms").delete().eq("id", roomId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xóa phòng." }, { status: 500 });
  }
}
