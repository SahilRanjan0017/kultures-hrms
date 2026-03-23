import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- DB SCHEMA CHECK ---');

    // Check Profiles table
    const { data: profileColumns, error: profileError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });

    // If RPC doesn't exist, try a direct query
    if (profileError) {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.error('Error querying profiles:', error.message);
        } else {
            console.log('Profiles table found. Columns:', Object.keys(data[0] || {}));
        }
    } else {
        console.log('Profiles columns:', profileColumns);
    }

    // Check for otp_rate_limits table
    const { error: rateLimitError } = await supabase.from('otp_rate_limits').select('id').limit(1);
    console.log('otp_rate_limits exists:', !rateLimitError);
}

checkSchema();
