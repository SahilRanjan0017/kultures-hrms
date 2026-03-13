import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/settings/tenant
export async function GET() {
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
            return NextResponse.json({ error: 'Permission denied. Admins only.' }, { status: 403 });
        }

        // Fetch tenant details
        const { data: tenant, error } = await adminSupabase
            .from('tenants')
            .select('id, name, slug, industry, size, created_at')
            .eq('id', profile.tenant_id)
            .single();

        if (error || !tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({ tenant });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/settings/tenant
export async function PUT(request: NextRequest) {
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
            return NextResponse.json({ error: 'Permission denied. Admins only.' }, { status: 403 });
        }

        const body = await request.json();
        const { name, industry, size } = body;

        if (!name || !industry || !size) {
            return NextResponse.json({ error: 'Name, industry, and size are required' }, { status: 400 });
        }

        // Update tenant
        const { data: tenant, error } = await adminSupabase
            .from('tenants')
            .update({ name, industry, size, updated_at: new Date().toISOString() })
            .eq('id', profile.tenant_id)
            .select('id, name, slug, industry, size')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, tenant });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
