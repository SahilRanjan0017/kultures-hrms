import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { leave_type_id, start_date, end_date, session, reason } = body;

        if (!leave_type_id || !start_date || !end_date || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate days
        const daysCount = calculateLeaveDays(start_date, end_date, session);

        const adminSupabase = createAdminClient();

        // Get profile for tenant_id
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, manager_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant missing' }, { status: 403 });
        }

        // Check balance
        const currentYear = new Date().getFullYear();
        const { data: balance } = await adminSupabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', profile.id) // wait, employee_id in leave_balances should probably be the profile.id (which is uuid in employees table)
            .eq('leave_type_id', leave_type_id)
            .eq('year', currentYear)
            .single();

        if (!balance) {
            return NextResponse.json({ error: 'Leave balance not initialized' }, { status: 400 });
        }

        const available = balance.total_days - balance.used_days - balance.pending_days;
        if (daysCount > available) {
            return NextResponse.json(
                { error: 'Insufficient leave balance' },
                { status: 400 }
            );
        }

        // Create request
        const { data: leaveRequest, error: insertError } = await adminSupabase
            .from('leave_requests')
            .insert({
                tenant_id: profile.tenant_id,
                employee_id: profile.id, // using employees.id
                leave_type_id,
                start_date,
                end_date,
                days_count: daysCount,
                session,
                reason,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Update pending balance
        await adminSupabase
            .from('leave_balances')
            .update({ pending_days: Number(balance.pending_days) + daysCount })
            .eq('id', balance.id);

        return NextResponse.json({ success: true, request: leaveRequest });

    } catch (err: any) {
        console.error('Apply Leave Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function calculateLeaveDays(start: string, end: string, session: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (session !== 'full_day') return diffDays - 0.5;
    return diffDays;
}
