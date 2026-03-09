import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: profile } = await adminSupabase.from('profiles').select('*').limit(10);
  console.log("PROFILES:", profile);
  
  const { data: employees } = await adminSupabase.from('employees').select('id,role,status').limit(10);
  console.log("EMPLOYEES:", employees);
}
run();
