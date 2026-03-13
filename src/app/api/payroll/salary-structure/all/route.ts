import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/payroll/salary-structure/all
// Returns all employees with their salary structure (admin/hr only)
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

        // Fetch all active employees for this tenant
        const { data: employees, error: empError } = await adminSupabase
            .from('employees')
            .select('id, full_name, emp_code, department, designation, status')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'active')
            .order('full_name');

        if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });

        // Fetch all salary structures for this tenant
        const { data: structures, error: structError } = await adminSupabase
            .from('salary_structures')
            .select('*')
            .eq('tenant_id', profile.tenant_id);

        if (structError) return NextResponse.json({ error: structError.message }, { status: 500 });

        // Merge employees with their structures
        const structureMap = new Map(structures?.map(s => [s.employee_id, s]) ?? []);
        const merged = (employees ?? []).map(emp => ({
            ...emp,
            salary_structure: structureMap.get(emp.id) ?? null,
        }));

        return NextResponse.json({ employees: merged });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
