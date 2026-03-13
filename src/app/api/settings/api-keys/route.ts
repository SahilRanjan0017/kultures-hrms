import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';

function generateApiKey() {
    const prefix = 'kt_';
    const secret = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return { prefix, secret, full: `${prefix}${secret}` };
}

async function hashKey(secret: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Admins only' }, { status: 403 });
        }

        const { data: keys, error } = await adminSupabase
            .from('tenant_api_keys')
            .select('id, name, key_prefix, created_at, last_used_at, expires_at, revoked_at')
            .eq('tenant_id', profile.tenant_id)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ keys });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Admins only' }, { status: 403 });
        }

        const { name } = await request.json();
        if (!name) return NextResponse.json({ error: 'Key name is required' }, { status: 400 });

        const { prefix, secret, full } = generateApiKey();
        const hashedKey = await hashKey(secret);

        const { data: key, error } = await adminSupabase
            .from('tenant_api_keys')
            .insert({
                tenant_id: profile.tenant_id,
                name,
                key_prefix: prefix,
                hashed_key: hashedKey,
            })
            .select('id, name, key_prefix, created_at')
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ key, secret: full });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
            .from('employees')
            .select('tenant_id, role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Admins only' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing key ID' }, { status: 400 });

        const { error } = await adminSupabase
            .from('tenant_api_keys')
            .delete()
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Log activity
        await logActivity({
            tenantId: profile.tenant_id,
            actorId: user.id,
            action: 'API_KEY_REVOKE',
            targetType: 'api_key',
            targetId: id
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
