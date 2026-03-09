import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: profile } = await adminSupabase.from('profiles').select('*').eq('id', 'b3c8ffb2-922c-4999-b2d3-554ad2b1a483');
    console.log("Admin Profile by ID:", JSON.stringify(profile, null, 2));
}
check();
