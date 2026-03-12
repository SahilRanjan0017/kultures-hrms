import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        // Get user's employee profile
        const { data: profile } = await adminSupabase
            .from('employees')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        const year = new Date().getFullYear();

        const { data: balances, error } = await adminSupabase
            .from('leave_balances')
            .select(`
                *,
                leave_type:leave_types(*)
            `)
            .eq('employee_id', profile.id)
            .eq('year', year);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Compute available days
        const formattedBalances = balances.map((b: any) => ({
            ...b,
            available_days: Number(b.total_days) - Number(b.used_days) - Number(b.pending_days),
        }));

        return NextResponse.json({ balances: formattedBalances });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
