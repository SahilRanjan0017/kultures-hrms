import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    context: any // bypassing Next 15 type enforcement for params
) {
    const { id } = await Promise.resolve(context.params);
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // 1. Get user's tenant
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant missing' }, { status: 403 });
        }

        // 2. Query employee and enforce tenant boundary
        const { data: employee, error } = await adminSupabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (error || !employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ employee });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: any
) {
    const { id } = await Promise.resolve(context.params);
    try {
        const payload = await request.json();
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

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant missing' }, { status: 403 });
        }

        // Fetch the target employee to check ownership
        const { data: targetEmployee } = await adminSupabase
            .from('employees')
            .select('user_id, role, department, designation, date_of_joining, emp_code, email, full_name')
            .eq('id', id)
            .single();

        if (!targetEmployee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const isOwner = targetEmployee.user_id === user.id;
        const isAdminOrHR = ['admin', 'hr'].includes(profile.role);

        if (!isOwner && !isAdminOrHR && profile.role !== 'manager') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Field restrictions for self-editing non-admins
        let updates: any = {
            phone: payload.phone,
            address: payload.address,
            emergency_contact: payload.emergency_contact,
            updated_at: new Date().toISOString()
        };

        if (isAdminOrHR) {
            // Admins and HR can update everything
            updates = {
                ...updates,
                full_name: payload.full_name,
                email: payload.email,
                emp_code: payload.emp_code,
                department: payload.department,
                designation: payload.designation,
                date_of_joining: payload.date_of_joining || null,
                role: payload.role,
            };
        } else if (isOwner || profile.role === 'manager') {
            // Owners and Managers (if they have view perms) can only update basic info 
            // unless they are Admin/HR. Managers shouldn't edit other managers/admins 
            // but we'll stick to the requirement: "employees and manager also have the Edit their own Information".

            // If they are owner, they can update their basic info.
            // We already set basic info in the default 'updates' object above.
        } else {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { error } = await adminSupabase
            .from('employees')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
