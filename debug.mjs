import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]*)/)?.[1];
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]*)"/) || env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]*)/);
const key = keyMatch?.[1];

const supabase = createClient(url, key);

async function run() {
    console.log('--- Activity Logs Count ---');
    const { count, error } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true });
    if (error) console.error('Error counting logs:', error);
    else console.log('Total logs in DB:', count);

    console.log('--- Join Test ---');
    const { data: joinData, error: joinError } = await supabase
        .from('activity_logs')
        .select('*, actor:employees(full_name)')
        .limit(1);
    
    if (joinError) console.error('Join Error:', joinError);
    else console.log('Join Success Sample:', joinData);

    console.log('--- Employee Check ---');
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });
    console.log('Total employees in DB:', empCount);
}

run();
