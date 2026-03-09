import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('email, role')
    .eq('email', 'sahil.ranjan@bricknbolt.com')
    .single();
  
  console.log("Admin config in profiles table:", profile);
}
test();
