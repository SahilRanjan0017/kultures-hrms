import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function nukeEverything() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    console.log('--- 🧨 STARTING TOTAL PURGE ---');

    // 1. Delete All Users from Auth
    console.log('Step 1: Deleting all users from Auth...');
    try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        console.log(`Found ${users.length} users.`);
        for (const user of users) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Failed to delete user ${user.id}:`, deleteError.message);
            } else {
                console.log(`Deleted user: ${user.email || user.id}`);
            }
        }
    } catch (err) {
        console.error('Error during auth purge:', err.message);
    }

    // 2. Truncate All Public Tables (Cascade)
    console.log('\nStep 2: Truncating all public tables...');
    const tables = [
        'activity_logs', 'attendance_logs', 'company_policies', 'employee_academics',
        'employee_banking_identity', 'employee_experience', 'employee_languages',
        'employee_personal_data', 'employee_references', 'employee_work_info',
        'employees', 'holidays', 'leave_balances', 'leave_requests', 'leave_types',
        'notifications', 'otp_codes', 'otp_rate_limits', 'payroll_runs', 'payslips',
        'profiles', 'salary_structures', 'slow_query_alerts', 'system_health_alerts',
        'tenant_api_keys', 'tenant_members', 'tenants'
    ];

    // We'll use the postgres_query RPC if it exists, otherwise we'll delete via JS client
    // Since we verified earlier that postgres_query RPC is missing, we'll use a series of deletes.
    // NOTE: Profiles is linked to auth.users, so deleting users handles mostly everything via cascade if FKs are set.
    // But we want a clean state for standalone tables too.

    for (const table of tables) {
        process.stdout.write(`Clearing table: ${table}... `);
        // We use delete everything with no filter
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
        if (error) {
            console.log(`❌ Fail: ${error.message}`);
        } else {
            console.log('✅ OK');
        }
    }

    console.log('\n--- 🧨 PURGE COMPLETE. SYSTEM IS FRESH ---');
}

nukeEverything();
