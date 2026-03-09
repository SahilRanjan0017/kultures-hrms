import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await adminSupabase.rpc('get_table_columns', { table_name: 'employees' });
  if (error) {
     // fallback to a generic query to see columns if RPC doesn't exist
     const { data: cols, error: err2 } = await adminSupabase.from('employees').select('*').limit(1);
     console.log("Columns found in first row:", Object.keys(cols?.[0] || {}));
  } else {
     console.log("Schema from RPC:", data);
  }
}
check();
