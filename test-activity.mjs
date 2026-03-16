import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error, count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact' });
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total activities:', count);
    console.log('Sample activities:', data.slice(0, 2));
  }
}

test();
