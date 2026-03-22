import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, error, path, metadata } = body;

        // Valid actions: 'auth:429', 'auth:lock_timeout', 'auth:refresh_fail'
        if (!action || !action.startsWith('auth:')) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // Log the error for monitoring
        // Note: This is an anonymous-friendly endpoint so we can log auth failures
        // even when the user is signed out or their session is broken.
        await adminSupabase.from('activity_logs').insert({
            tenant_id: '00000000-0000-0000-0000-000000000000', // System tenant placeholder if unknown
            actor_id: '00000000-0000-0000-0000-000000000000', // System actor placeholder
            action,
            target_type: 'auth_system',
            metadata: {
                error,
                path,
                timestamp: new Date().toISOString(),
                ...metadata
            },
            ip_address: request.headers.get('x-forwarded-for') || '0.0.0.0'
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("→ Auth health log failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
