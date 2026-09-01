# Study26 V5

V5 tập trung vào lớp học, phòng học trực tiếp, hồ sơ giáo viên và Admin Center. Study26 AI và cơ chế mật khẩu phòng đã được loại khỏi luồng ứng dụng.

## 1. Environment

Cần cấu hình trên máy local và Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (hoặc publishable key, nhưng app hiện dùng tên ANON_KEY)
- `SUPABASE_SERVICE_ROLE_KEY` — chỉ server, không đưa vào `NEXT_PUBLIC_*`
- `NEXT_PUBLIC_LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

`SUPABASE_SERVICE_ROLE_KEY` là bắt buộc cho các API tạo phòng và Admin Center vì các API này cần đọc/ghi dữ liệu quản trị mà không phụ thuộc RLS của trình duyệt.

## 2. Supabase

Chạy `supabase/study26_v2.sql` sau schema/migrations hiện có. Script này:

- tạo `teacher_profiles`;
- tạo bucket `avatars` và policy upload ảnh;
- chuyển phòng sang mã phòng בלבד và bỏ sử dụng mật khẩu;
- sinh mã cho các phòng cũ còn thiếu;
- dọn policy lớp/thành viên để tránh recursion;
- tạo profile rỗng cho giáo viên cũ;
- bỏ các flag AI/private-room khỏi cấu hình gói.

## 3. Chạy local

```bash
npm install
npm run build
npm run dev
```

## 4. Vercel

Thêm 6 biến môi trường ở trên vào Production/Preview/Development rồi Redeploy. Không commit `.env.local`.

## 5. Luồng phòng mới

Giáo viên tạo phòng → Study26 sinh mã phòng → học sinh nhập mã → Study26 hiển thị giáo viên/lớp → tự thêm học sinh vào lớp nếu chưa có → vào LiveKit. Không có mật khẩu.
