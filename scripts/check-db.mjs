
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Tenants...");
    const { data: tenants } = await supabase.from('tenants').select('id, name').order('created_at', { ascending: false }).limit(20);
    console.log("Tenants:", tenants);

    console.log("\nChecking Employees...");
    const { data: employees } = await supabase.from('employees').select('id, full_name, email, tenant_id').order('created_at', { ascending: false }).limit(20);
    console.log("Employees:", employees);

    console.log("\nChecking Profiles...");
    const { data: profiles } = await supabase.from('profiles').select('id, email, tenant_id, role').limit(20);
    console.log("Profiles:", profiles);
}

check();
