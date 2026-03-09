import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const department = searchParams.get('department');
        const status = searchParams.get('status') || 'all';
        const search = searchParams.get('search');

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant missing' }, { status: 403 });
        }

        const userRole = profile.role;

        // If employee, they shouldn't see the directory at all (as per requirements)
        if (userRole === 'employee') {
            return NextResponse.json({ employees: [] });
        }

        let query = adminSupabase
            .from('employees')
            .select('id, full_name, email, emp_code, role, department, designation, status, avatar_url')
            .eq('tenant_id', profile.tenant_id);

        // Role-based directory visibility filters
        if (userRole === 'hr') {
            query = query.in('role', ['hr', 'manager', 'employee']);
        } else if (userRole === 'manager') {
            query = query.in('role', ['manager', 'employee']);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (role && role !== 'all') {
            query = query.eq('role', role);
        }
        if (department && department !== 'all') {
            query = query.eq('department', department);
        }

        const { data: employees, error } = await query;

        if (error) throw error;

        // Note: PostgREST doesn't currently support multiple ILIKE clauses natively in Javascript OR conditions easily without rpc
        // Due to the low volume of rows per tenant, doing client-side filter here or relying on the frontend 
        // We will return everything that matches the base filters and let frontend do the name/email/emp_code searching.

        return NextResponse.json({ employees });

    } catch (err: any) {
        console.error('List Employees Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        if (!payload.email || !payload.full_name || !payload.emp_code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile?.tenant_id || !['admin', 'hr', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Insert new employee record directly
        const { data: newEmployee, error } = await adminSupabase
            .from('employees')
            .insert({
                tenant_id: profile.tenant_id,
                full_name: payload.full_name,
                email: payload.email,
                emp_code: payload.emp_code,
                department: payload.department,
                designation: payload.designation,
                phone: payload.phone,
                date_of_joining: payload.date_of_joining || null,
                role: payload.role,
                status: 'active',
                address: payload.address || {},
                emergency_contact: payload.emergency_contact || {}
            })
            .select('id')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, employeeId: newEmployee.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
