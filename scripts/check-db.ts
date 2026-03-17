
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Tenants...");
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(10);
    console.log("Tenants:", tenants);

    console.log("\nChecking Employees...");
    const { data: employees } = await supabase.from('employees').select('id, full_name, email, tenant_id').limit(10);
    console.log("Employees:", employees);

    console.log("\nChecking Tenant Members...");
    const { data: members } = await supabase.from('tenant_members').select('user_id, tenant_id, role').limit(10);
    console.log("Members:", members);
}

check();
