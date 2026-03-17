
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetSystem() {
    console.log("🚀 STARTING COMPLETE SYSTEM RESET...");

    // Order is important to respect foreign key constraints if CASCADE isn't used
    const tables = [
        'attendance_logs',
        'leave_requests',
        'leave_balances',
        'activity_logs',
        'notifications',
        'payslips',
        'payroll_runs',
        'salary_structures',
        'company_policies',
        'holidays',
        'otp_codes',
        'employee_academics',
        'employee_banking_identity',
        'employee_experience',
        'employee_languages',
        'employee_personal_data',
        'employee_references',
        'employee_work_info',
        'tenant_members',
        'profiles',
        'employees',
        'tenants'
    ];

    console.log("\n--- Cleaning Public Database Tables ---");
    for (const table of tables) {
        process.stdout.write(`Cleaning ${table}... `);
        // Using a filter that matches all rows
        const { error, count } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
            console.log(`❌ Error: ${error.message}`);
        } else {
            console.log(`✅ Done`);
        }
    }

    console.log("\n--- Cleaning Authentication Users ---");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Error listing users:", listError.message);
    } else if (users.length === 0) {
        console.log("No users found in Auth.");
    } else {
        console.log(`Found ${users.length} users. Deleting...`);
        for (const user of users) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`❌ Failed to delete ${user.email}:`, deleteError.message);
            } else {
                console.log(`✅ Deleted ${user.email}`);
            }
        }
    }

    console.log("\n✨ SYSTEM RESET COMPLETE. You can now start the new flow from the landing page.");
}

resetSystem();
