import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// DELETE /api/settings/tenant/delete
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // 1. Check if caller is admin
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Permission denied. Admins only.' }, { status: 403 });
        }

        const body = await request.json();
        const { confirmName } = body;

        // 2. Fetch tenant to verify name match
        const { data: tenant } = await adminSupabase
            .from('tenants')
            .select('id, name')
            .eq('id', profile.tenant_id)
            .single();

        if (!tenant || tenant.name !== confirmName) {
            return NextResponse.json({ error: 'Company name does not match' }, { status: 400 });
        }

        // 3. Delete tenant — assuming standard ON DELETE CASCADE setup handles employees, profiles, etc.
        const { error: deleteError } = await adminSupabase
            .from('tenants')
            .delete()
            .eq('id', tenant.id);

        if (deleteError) {
            console.error('Failed to delete workspace:', deleteError.message);
            return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
        }

        // We can sign the user out via client-side after this succeeds.
        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Delete Workspace Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
