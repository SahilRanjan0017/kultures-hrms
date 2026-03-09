import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: profiles } = await adminSupabase.from('profiles').select('*').limit(5);
    console.log("Profiles:", JSON.stringify(profiles, null, 2));

    const { data: employees } = await adminSupabase.from('employees').select('id, user_id, email, tenant_id, role, status').limit(5);
    console.log("Employees:", JSON.stringify(employees, null, 2));
}
check();
