import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import LiveRoom from "@/components/live-room";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * Không query live_rooms trực tiếp ở đây nữa.
   * Dùng RPC để kiểm tra quyền truy cập và lấy thông tin phòng.
   *
   * RPC đã xử lý:
   * - giáo viên chủ phòng
   * - admin
   * - học sinh đã tham gia lớp
   * - phòng đã kết thúc
   * - tài khoản bị khóa
   */
  const { data: access, error } = await supabase.rpc(
    "study26_get_room_access",
    {
      p_room_id: id,
    }
  );

  if (error) {
    console.error("ROOM PAGE ACCESS ERROR:", error);
    notFound();
  }

  if (!access?.ok) {
    if (access?.status === 401) {
      redirect("/login");
    }

    notFound();
  }

  const room = {
    id,
    title: access.title || "Phòng học Study26",
    join_code: access.joinCode || "",
    status: "live",
    class_id: null,
  };

  return <LiveRoom room={room} user={user} />;
}