import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/payroll/me — returns current user's employee role for payroll access decisions
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('id, role, tenant_id, full_name')
            .eq('user_id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        return NextResponse.json({ role: profile.role, id: profile.id, full_name: profile.full_name });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
