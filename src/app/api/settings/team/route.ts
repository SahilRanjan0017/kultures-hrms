import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Check if admin/hr
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || !['admin', 'hr'].includes(profile.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Fetch all employees in tenant
        const { data: employees, error } = await adminSupabase
            .from('employees')
            .select('id, full_name, email, role, status, department, designation, emp_code')
            .eq('tenant_id', profile.tenant_id)
            .order('full_name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ employees });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Check if admin
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update roles' }, { status: 403 });
        }

        const { employeeId, newRole } = await request.json();

        if (!employeeId || !newRole) {
            return NextResponse.json({ error: 'Missing employeeId or newRole' }, { status: 400 });
        }

        // Update employee role
        const { error: empError } = await adminSupabase
            .from('employees')
            .update({ role: newRole })
            .eq('id', employeeId)
            .eq('tenant_id', profile.tenant_id);

        if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });

        // Update auth user metadata if user_id exists
        const { data: empData } = await adminSupabase
            .from('employees')
            .select('user_id')
            .eq('id', employeeId)
            .single();

        if (empData?.user_id) {
            await adminSupabase.auth.admin.updateUserById(empData.user_id, {
                user_metadata: { role: newRole }
            });

            // Also sync profiles table
            await adminSupabase.from('profiles').update({ role: newRole }).eq('id', empData.user_id);
        }

        // Log activity
        await logActivity({
            tenantId: profile.tenant_id,
            actorId: user.id,
            action: 'ROLE_UPDATE',
            targetType: 'employee',
            targetId: employeeId,
            metadata: { newRole }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
