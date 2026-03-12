import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Get profile
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('id, tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        const { data: requests, error } = await adminSupabase
            .from('leave_requests')
            .select(`
                *,
                leave_type:leave_types(*)
            `)
            .eq('employee_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ requests });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
