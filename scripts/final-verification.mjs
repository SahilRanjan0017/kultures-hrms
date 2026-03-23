import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function finalVerification() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- 🛡️ FINAL STAGING READINESS CHECK ---');

    // 1. Column Verification (Direct Query)
    const { data: tenants } = await supabase.from('tenants').select('*').limit(1);
    const tenantCols = tenants ? Object.keys(tenants[0] || {}) : [];
    console.log('Step 1: tenants.deleted_at column:      ', tenantCols.includes('deleted_at') ? '✅ OK' : '❌ MISSING');

    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    const profileCols = profiles ? Object.keys(profiles[0] || {}) : [];
    console.log('Step 2: profiles.onboarding_completed: ', profileCols.includes('onboarding_completed') ? '✅ OK' : '❌ MISSING');

    // 2. Functional Verification
    const { error: fError } = await supabase.rpc('auth_current_tenant_id');
    console.log('Step 3: auth_current_tenant_id():       ', fError && fError.message.includes('not found') ? '❌ MISSING' : '✅ ACTIVE');

    // 3. RLS / Index / Monitoring (Handover Recommendation)
    console.log('\n--- 📝 RECOMMENDATION ---');
    console.log('Since RLS policies and Indexes are often "hidden" from standard API queries,');
    console.log('please run the manual verification SQL I provided in the next message to double-check.');
}

finalVerification();
