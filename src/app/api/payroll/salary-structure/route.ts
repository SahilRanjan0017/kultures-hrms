import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';

// GET /api/payroll/salary-structure?employee_id=...
// Admin/HR can pass employee_id; employees get their own
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
        const requestedEmployeeId = searchParams.get('employee_id');

        // Determine which employee to fetch for
        let targetEmployeeId = profile.id;
        if (requestedEmployeeId && ['admin', 'hr'].includes(profile.role)) {
            targetEmployeeId = requestedEmployeeId;
        }

        const { data, error } = await adminSupabase
            .from('salary_structures')
            .select('*')
            .eq('employee_id', targetEmployeeId)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ structure: data ?? null });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// GET /api/payroll/salary-structure/all — all employees in tenant
// POST /api/payroll/salary-structure — upsert salary structure
export async function POST(request: NextRequest) {
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

        if (!profile || !['admin', 'hr'].includes(profile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await request.json();
        const {
            employee_id,
            basic_salary = 0,
            hra = 0,
            transport_allowance = 0,
            other_allowances = 0,
            pf_deduction = 0,
            tds_deduction = 0,
            other_deductions = 0,
        } = body;

        if (!employee_id) {
            return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
        }

        const { data, error } = await adminSupabase
            .from('salary_structures')
            .upsert({
                tenant_id: profile.tenant_id,
                employee_id,
                basic_salary,
                hra,
                transport_allowance,
                other_allowances,
                pf_deduction,
                tds_deduction,
                other_deductions,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'employee_id' })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Log activity
        await logActivity({
            tenantId: profile.tenant_id,
            actorId: user.id,
            action: 'PAYROLL_UPDATE',
            targetType: 'salary_structure',
            targetId: data.id,
            metadata: { employee_id, total_salary: basic_salary + hra + transport_allowance + other_allowances }
        });

        return NextResponse.json({ ok: true, structure: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
