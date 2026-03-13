import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/payroll/payslips?month=2025-03
// Employee sees own payslips; Admin/HR sees all for the tenant
export async function GET(request: NextRequest) {
    try {
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

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        const isAdmin = ['admin', 'hr'].includes(profile.role);

        let query = adminSupabase
            .from('payslips')
            .select(`
                *,
                employee:employee_id (full_name, emp_code, department, designation)
            `)
            .eq('tenant_id', profile.tenant_id)
            .order('month', { ascending: false });

        if (!isAdmin) {
            // Employees only see their own
            query = query.eq('employee_id', profile.id);
        }

        if (month) {
            query = query.eq('month', month);
        }

        const { data, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ payslips: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
