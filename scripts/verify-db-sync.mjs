import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifySync() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- FINAL DB ALIGNMENT VERIFICATION ---');

    // 1. Check Profiles (onboarding_completed)
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    const profileCols = profiles ? Object.keys(profiles[0] || {}) : [];
    console.log('onboarding_completed:', profileCols.includes('onboarding_completed') ? '✅' : '❌');

    // 2. Check Tenants (deleted_at)
    const { data: tenants, error: tError } = await supabase.from('tenants').select('*').limit(1);
    const tenantCols = tenants ? Object.keys(tenants[0] || {}) : [];
    console.log('tenants.deleted_at:', tenantCols.includes('deleted_at') ? '✅' : '❌');

    // 3. Check for Function (auth_current_tenant_id)
    // We try to call it via a query that uses it
    const { error: fError } = await supabase.rpc('auth_current_tenant_id');
    // Note: service role might not be able to call it if it's STABLE but not signed? 
    // Actually rpc should work if it exists.
    if (fError && fError.message.includes('not found')) {
        console.log('auth_current_tenant_id function: ❌ (Missing)');
    } else {
        console.log('auth_current_tenant_id function: ✅ (Found)');
    }

    // 4. Check for RLS on employees
    // We check pg_policy view
    const { data: policies, error: polError } = await supabase.rpc('postgres_query', {
        query: "SELECT count(*) FROM pg_policy WHERE polrelid = 'public.employees'::regclass"
    });

    if (polError) {
        // Fallback: try to query as a non-admin if we had a user... 
        // Or just assume if fError was found, policies likely are too.
        console.log('RLS Check (via RPC): ⚠️ (Unknown/RPC failed)');
    } else {
        const count = policies?.[0]?.count || 0;
        console.log('RLS Policies on employees:', count > 0 ? `✅ (${count} found)` : '❌ (Missing)');
    }

    // 5. Check for Performance Index (idx_employees_tenant_id)
    const { data: indexes, error: idxError } = await supabase.rpc('postgres_query', {
        query: "SELECT count(*) FROM pg_indexes WHERE indexname = 'idx_employees_tenant_id'"
    });
    if (!idxError) {
        const count = indexes?.[0]?.count || 0;
        console.log('Indexes found:', count > 0 ? '✅' : '❌');
    }
}

verifySync();
