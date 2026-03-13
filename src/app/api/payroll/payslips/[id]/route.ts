import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/payroll/payslips/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('id, role, tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        const { data: payslip, error } = await adminSupabase
            .from('payslips')
            .select(`
                *,
                employee:employee_id (id, full_name, emp_code, department, designation, email),
                payroll_run:payroll_run_id (id, month, status)
            `)
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (error || !payslip) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }

        // Employees can only access their own payslip
        const isAdmin = ['admin', 'hr'].includes(profile.role);
        if (!isAdmin && payslip.employee_id !== profile.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        return NextResponse.json({ payslip });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
