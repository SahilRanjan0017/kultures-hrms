import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity, createNotification } from '@/lib/activity';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { action, rejection_reason } = body; // 'approve' or 'reject'

        const adminSupabase = createAdminClient();

        // Get leave request with its balance
        const { data: leaveRequest, error: fetchError } = await adminSupabase
            .from('leave_requests')
            .select(`
                *,
                employee:employee_id(full_name, user_id),
                leave_type:leave_type_id(*)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Verify that the user is the manager or an admin
        const { data: approverProfile } = await adminSupabase
            .from('employees')
            .select('id, role')
            .eq('user_id', user.id)
            .single();

        if (!approverProfile || !['admin', 'hr', 'manager'].includes(approverProfile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Get the balance record
        const { data: balance } = await adminSupabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', leaveRequest.employee_id)
            .eq('leave_type_id', leaveRequest.leave_type_id)
            .eq('year', new Date(leaveRequest.start_date).getFullYear())
            .single();

        if (!balance) {
            return NextResponse.json({ error: 'Balance record not found' }, { status: 404 });
        }

        // Update status
        const updateData = {
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: approverProfile.id,
            approved_at: new Date().toISOString(),
            ...(action === 'reject' && { rejection_reason }),
        };

        const { error: updateError } = await adminSupabase
            .from('leave_requests')
            .update(updateData)
            .eq('id', id);

        if (updateError) throw updateError;

        // Update balance
        if (action === 'approve') {
            await adminSupabase
                .from('leave_balances')
                .update({
                    used_days: Number(balance.used_days) + Number(leaveRequest.days_count),
                    pending_days: Number(balance.pending_days) - Number(leaveRequest.days_count),
                })
                .eq('id', balance.id);
        } else {
            // Rejected - restore pending to available
            await adminSupabase
                .from('leave_balances')
                .update({
                    pending_days: Number(balance.pending_days) - Number(leaveRequest.days_count),
                })
                .eq('id', balance.id);
        }

        // Log activity
        await logActivity({
            tenantId: leaveRequest.tenant_id,
            actorId: user.id,
            action: action === 'approve' ? 'LEAVE_APPROVE' : 'LEAVE_REJECT',
            targetType: 'leave',
            targetId: id,
            metadata: { employee_id: leaveRequest.employee_id, action }
        });

        // Notify Employee
        if (leaveRequest.employee?.user_id) {
            await createNotification({
                tenantId: leaveRequest.tenant_id,
                userId: leaveRequest.employee.user_id,
                title: action === 'approve' ? 'Leave Approved ✅' : 'Leave Rejected ❌',
                message: `Your leave request for ${leaveRequest.days_count} days has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
                type: action === 'approve' ? 'success' : 'error',
                link: '/dashboard/leaves'
            });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Action Leave Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
