import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]*)/)?.[1];
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]*)"/) || env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]*)/);
const key = keyMatch?.[1];

const supabase = createClient(url, key);
const email = 'sahil.ranjan@bricknbolt.com';

async function diagnose() {
    console.log(`--- Diagnosing user: ${email} ---`);

    // 1. Employees
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email);

    console.log('Employees found:', employees?.length || 0);
    if (employees && employees.length > 0) {
        console.log('Employee IDs:', employees.map(e => ({ id: e.id, user_id: e.user_id, tenant_id: e.tenant_id })));
    }

    // 2. Profiles
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    console.log('Profiles found:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
        console.log('Profile Details:', profiles.map(p => ({ id: p.id, email: p.email, tenant_id: p.tenant_id, employee_id: p.employee_id })));
    }

    // 3. Tenant Members
    if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        const { data: members, error: memError } = await supabase
            .from('tenant_members')
            .select('*, tenants(name)')
            .in('user_id', userIds);

        console.log('Tenant Members found (by profile user_id):', members?.length || 0);
        if (members && members.length > 0) {
            console.log('Member Details:', members.map(m => ({
                user_id: m.user_id,
                tenant_id: m.tenant_id,
                employee_id: m.employee_id,
                tenant_name: m.tenants?.name
            })));
        }
    }

    // 4. Check for tenant members without user_id but with employee_id
    if (employees && employees.length > 0) {
        const empIds = employees.map(e => e.id);
        const { data: orphanedMembers } = await supabase
            .from('tenant_members')
            .select('*')
            .in('employee_id', empIds)
            .is('user_id', null);

        console.log('Tenant Members with employee_id but NULL user_id:', orphanedMembers?.length || 0);
        if (orphanedMembers && orphanedMembers.length > 0) {
            console.log('Orphaned Member Details:', orphanedMembers);
        }
    }
}

diagnose();
