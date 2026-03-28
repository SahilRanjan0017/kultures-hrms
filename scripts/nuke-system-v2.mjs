import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function secondNuke() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- 🧨 STARTING CLEANUP PART 2 (DEPENDENCIES) ---');

    // 1. Clear Profiles first to break the link to auth.users and employees
    console.log('Clearing Profiles...');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Clear all tables in order of dependency
    const order = [
        'activity_logs', 'attendance_logs', 'leave_requests', 'leave_balances',
        'payslips', 'payroll_runs', 'salary_structures',
        'employee_academics', 'employee_banking_identity', 'employee_experience',
        'employee_languages', 'employee_personal_data', 'employee_references',
        'employee_work_info', 'employees', 'tenant_members', 'tenant_api_keys', 'tenants'
    ];

    for (const table of order) {
        process.stdout.write(`Clearing ${table}... `);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log(error ? `❌ ${error.message}` : '✅');
    }

    // 3. Delete lingering Auth Users
    console.log('\nFinal Auth Purge...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    for (const user of users) {
        process.stdout.write(`Deleting auth user ${user.email}... `);
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        console.log(error ? `❌ ${error.message}` : '✅');
    }

    console.log('\n--- 🧨 SYSTEM IS NOW 100% CLEAN ---');
}

secondNuke();
