import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("→ [API] Session in Heartbeat:", user?.email || "NULL");
    return NextResponse.json({ ok: true, user: user?.email, timestamp: new Date().toISOString() });
}
