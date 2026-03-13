import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/payroll/run — list all payroll runs for tenant
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

        if (!profile || !['admin', 'hr'].includes(profile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { data: runs, error } = await adminSupabase
            .from('payroll_runs')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('month', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ runs: runs ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/payroll/run — generate payroll for a given month
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

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can generate payroll' }, { status: 403 });
        }

        const body = await request.json();
        const { month } = body; // e.g. "2025-03"
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
        }

        const tenantId = profile.tenant_id;

        // Check if run already exists
        const { data: existing } = await adminSupabase
            .from('payroll_runs')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('month', month)
            .single();

        if (existing) {
            return NextResponse.json({ error: `Payroll for ${month} already generated` }, { status: 409 });
        }

        // Fetch all active employees with their salary structures
        const { data: employees, error: empError } = await adminSupabase
            .from('employees')
            .select(`
                id, full_name, emp_code, department, designation,
                salary_structures (
                    basic_salary, hra, transport_allowance, other_allowances,
                    pf_deduction, tds_deduction, other_deductions
                )
            `)
            .eq('tenant_id', tenantId)
            .eq('status', 'active');

        if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });
        if (!employees || employees.length === 0) {
            return NextResponse.json({ error: 'No active employees found' }, { status: 400 });
        }

        // Attendance data for the month
        const startDate = `${month}-01`;
        const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
            .toISOString().split('T')[0];

        const { data: attendanceLogs } = await adminSupabase
            .from('attendance_logs')
            .select('employee_id, date')
            .eq('tenant_id', tenantId)
            .gte('date', startDate)
            .lt('date', endDate);

        // Count present days per employee
        const presentDaysMap: Record<string, number> = {};
        (attendanceLogs ?? []).forEach(log => {
            presentDaysMap[log.employee_id] = (presentDaysMap[log.employee_id] ?? 0) + 1;
        });

        // Calculate working days in month (Mon–Sat for now)
        const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
        const workingDays = daysInMonth; // simplified; could be refined

        // Create the payroll run record
        const { data: run, error: runError } = await adminSupabase
            .from('payroll_runs')
            .insert({
                tenant_id: tenantId,
                month,
                status: 'draft',
                generated_by: profile.id,
                generated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

        // Generate payslips for each employee
        const payslips = employees.map((emp: any) => {
            const ss = Array.isArray(emp.salary_structures)
                ? emp.salary_structures[0]
                : emp.salary_structures;

            const basic = ss?.basic_salary ?? 0;
            const hra = ss?.hra ?? 0;
            const transport = ss?.transport_allowance ?? 0;
            const otherAllowances = ss?.other_allowances ?? 0;
            const pf = ss?.pf_deduction ?? 0;
            const tds = ss?.tds_deduction ?? 0;
            const otherDeductions = ss?.other_deductions ?? 0;

            const grossSalary = basic + hra + transport + otherAllowances;
            const totalDeductions = pf + tds + otherDeductions;
            const netSalary = grossSalary - totalDeductions;
            const presentDays = presentDaysMap[emp.id] ?? 0;

            return {
                payroll_run_id: run.id,
                tenant_id: tenantId,
                employee_id: emp.id,
                month,
                basic_salary: basic,
                hra,
                transport_allowance: transport,
                other_allowances: otherAllowances,
                gross_salary: grossSalary,
                pf_deduction: pf,
                tds_deduction: tds,
                other_deductions: otherDeductions,
                total_deductions: totalDeductions,
                net_salary: netSalary,
                working_days: workingDays,
                present_days: presentDays,
            };
        });

        const { error: slipError } = await adminSupabase
            .from('payslips')
            .insert(payslips);

        if (slipError) {
            // Rollback the run
            await adminSupabase.from('payroll_runs').delete().eq('id', run.id);
            return NextResponse.json({ error: slipError.message }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            run,
            payslipsGenerated: payslips.length,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH /api/payroll/run — update status (processed / paid)
export async function PATCH(request: NextRequest) {
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

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update payroll status' }, { status: 403 });
        }

        const body = await request.json();
        const { run_id, status } = body;

        if (!run_id || !['draft', 'processed', 'paid'].includes(status)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { data, error } = await adminSupabase
            .from('payroll_runs')
            .update({ status })
            .eq('id', run_id)
            .eq('tenant_id', profile.tenant_id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ ok: true, run: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
