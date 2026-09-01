# Study26 – Fixed build

Bản này hợp nhất project gốc với các feature pack trước đó và sửa các lỗi tích hợp quan trọng.

## Đã sửa
- Phòng học: mã phòng + mật khẩu tự động; đổi mật khẩu; kết thúc/xóa phòng; học sinh vào bằng mã + mật khẩu.
- LiveKit: room name dùng thống nhất `join_code`; kick đúng room; token kiểm tra thành viên/lớp và tài khoản bị khóa.
- Live UI: VideoConference cho mic/camera/share màn hình; thanh công cụ responsive cho chat, giơ tay, kick, ghi hình, rời phòng; bảng trắng.
- Lớp: tạo/sửa/xóa lớp; bài tập; nộp bài; chấm điểm; lịch; tài liệu; điểm danh; thống kê; Study26 AI.
- Admin: tài khoản, role student/teacher/admin, khóa/mở khóa, xóa, gói Free/Pro/Premium, giá/quyền, duyệt nâng cấp.
- Sửa lỗi cũ `demote_user` ghi role `user` không tồn tại trong enum; chuẩn hóa về `student`.
- API admin/room/class dùng service-role ở server cho các thao tác cần quyền cao, không đưa key ra frontend.
- AI chỉ gọi OpenAI từ server.

## Database
1. Chạy `supabase/schema.sql` nếu database mới.
2. Chạy `supabase/study26_migration.sql` cho database hiện tại.
3. Không commit `.env`.

## Environment
Xem `.env.example`. Tối thiểu cần Supabase + LiveKit + `ROOM_PASSWORD_SALT`; AI cần `OPENAI_API_KEY`. Ghi hình cần thêm toàn bộ `RECORDING_S3_*`.

## Local
```bash
npm install
npm run build
```

## Deploy
```bash
git add .
git commit -m "Fix Study26 room, class, admin and AI features"
git push origin main
```
Vercel sẽ build lại từ commit mới.
