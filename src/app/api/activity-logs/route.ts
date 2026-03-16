import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Check if admin/hr
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || !['admin', 'hr'].includes(profile.role)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: logs, error, count } = await adminSupabase
            .from('activity_logs')
            .select(`
                *,
                actor:employees!activity_logs_actor_id_fkey(full_name, email)
            `, { count: 'exact' })
            .eq('tenant_id', profile.tenant_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("→ Activity logs fetch error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ logs, total: count });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
