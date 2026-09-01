# Study26 V6.3 Stable Premium

Core app: classes, assignments, submissions/grading, materials, schedules, attendance, analytics, passwordless live rooms, teacher profiles, admin center.

Removed from UX: Study26 AI, public upgrade/buy flow, room passwords and join-request workflow.

User flows (student/teacher) use the signed-in Supabase session and do not require SUPABASE_SERVICE_ROLE_KEY. Admin auth/user management remains server-only and requires the server-only `SUPABASE_SERVICE_ROLE_KEY`.

Run `supabase/study26_v6_3.sql` once.
