# Study26

## Chạy local
npm install
cp .env.example .env.local
npm run dev

## Supabase
Supabase Dashboard → SQL Editor → chạy `supabase/schema.sql`.
Đăng ký một tài khoản, sau đó đổi role thành teacher:
`update public.profiles set role='teacher' where id='UUID';`

## LiveKit
Tạo LiveKit project, lấy API Key, API Secret và WebSocket URL. Điền vào `.env.local`.
Không đưa API Secret lên GitHub.

## Vercel
Import GitHub repository và thêm toàn bộ biến môi trường từ `.env.local`.
