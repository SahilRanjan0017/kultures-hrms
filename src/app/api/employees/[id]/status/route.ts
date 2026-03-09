import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
    request: NextRequest,
    context: any // bypassing Next 15 type enforcement for params
) {
    const { id } = await Promise.resolve(context.params);

    try {
        const { status } = await request.json();

        if (!status || !['active', 'inactive'].includes(status)) {
            return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
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

        const { error } = await adminSupabase
            .from('employees')
            .update({ status })
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, status });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
