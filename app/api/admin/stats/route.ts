import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';

export async function GET() {
  try {
    const { admin } = await requireAdmin();
    const { data, error } = await admin.from('profiles').select('role,plan_slug,suspended');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = data ?? [];
    return NextResponse.json({
      total_users: rows.length,
      teachers: rows.filter((r) => r.role === 'teacher').length,
      students: rows.filter((r) => r.role === 'student').length,
      admins: rows.filter((r) => r.role === 'admin').length,
      suspended: rows.filter((r) => r.suspended).length,
      free: rows.filter((r) => r.plan_slug === 'free').length,
      pro: rows.filter((r) => r.plan_slug === 'pro').length,
      premium: rows.filter((r) => r.plan_slug === 'premium').length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không có quyền admin.' }, { status: 500 });
  }
}
