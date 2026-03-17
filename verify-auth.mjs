import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]*)/)?.[1];
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]*)"/) || env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]*)/);
const serviceKey = serviceKeyMatch?.[1];

const supabase = createClient(url, serviceKey);
const email = 'sahil.ranjan@bricknbolt.com';

async function verifyAuth() {
    console.log(`--- Verifying Auth for: ${email} ---`);

    // 1. Get user from auth.users (requires service role)
    // Actually, we can just use the admin client's listUsers if it has it, or just query profiles
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log('User NOT found in auth.users');
        return;
    }

    console.log('Auth User ID:', user.id);

    // 2. Check if this matches profiles and tenant_members
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
    console.log('Profile ID:', profile?.id);

    const { data: member } = await supabase.from('tenant_members').select('user_id').eq('employee_id', (await supabase.from('employees').select('id').eq('email', email).single()).data?.id).single();
    console.log('Tenant Member user_id:', member?.user_id);

    if (user.id === profile?.id && user.id === member?.user_id) {
        console.log('✅ All IDs match the Auth UID.');
    } else {
        console.log('❌ ID mismatch found!');
    }
}

verifyAuth();
