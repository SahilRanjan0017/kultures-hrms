import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Get approver's profile
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('id, role, tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile || !['admin', 'hr', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        let query = adminSupabase
            .from('leave_requests')
            .select(`
                *,
                employee:employee_id(full_name),
                leave_type:leave_type_id(*)
            `)
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'pending');

        // If manager, only show their direct reports' requests
        // Note: This requires the manager_id field in employees table.
        if (profile.role === 'manager') {
            const { data: reportIds } = await adminSupabase
                .from('employees')
                .select('id')
                .eq('manager_id', profile.id);

            const ids = reportIds?.map(r => r.id) || [];
            query = query.in('employee_id', ids);
        }

        const { data: requests, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format for frontend
        const formattedRequests = requests.map((r: any) => ({
            ...r,
            employee_name: r.employee?.full_name,
        }));

        return NextResponse.json({ requests: formattedRequests });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
