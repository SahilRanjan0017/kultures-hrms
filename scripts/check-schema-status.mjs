
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking Schema Status...");

    // Check employees columns
    const { data: cols, error: colError } = await supabase.rpc('get_column_info', { table_name: 'employees' });

    // If RPC doesn't exist, we'll try a simple query and check the keys
    const { data: emp, error: empError } = await supabase.from('employees').select('*').limit(1);

    if (empError) {
        console.error("Error accessing employees table:", empError.message);
    } else {
        const columns = emp && emp.length > 0 ? Object.keys(emp[0]) : [];
        console.log("Existing columns in employees:", columns);

        const requiredCols = ['phone', 'date_of_joining', 'profile_photo_url', 'manager_id', 'department', 'designation'];
        const missing = requiredCols.filter(c => !columns.includes(c));

        if (missing.length > 0) {
            console.log("❌ Missing columns in employees:", missing);
        } else {
            console.log("✅ All required columns exist in employees.");
        }
    }

    // Check missing tables
    const tablesToCheck = ['company_policies', 'holidays', 'leave_types', 'leave_requests', 'payroll_runs', 'payslips'];
    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error && error.code === '42P01') {
            console.log(`❌ Table ${table} does NOT exist.`);
        } else if (error) {
            console.log(`⚠️ Table ${table} check returned error: ${error.message}`);
        } else {
            console.log(`✅ Table ${table} exists.`);
        }
    }
}

checkSchema();
