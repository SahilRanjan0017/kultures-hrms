import { createClient } from '@supabase/supabase-js';
import process from 'process';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*)"/)?.[1] || env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];

const supabase = createClient(url, key);

async function debug() {
  console.log('Querying activity_logs...');
  const { data: logs, error: logsError } = await supabase.from('activity_logs').select('*').limit(5);
  if (logsError) console.error('logsError:', logsError);
  else console.log('Logs found:', logs.length, logs);

  if (logs && logs.length > 0) {
    const actorId = logs[0].actor_id;
    console.log('Checking employee for actor_id:', actorId);
    const { data: emp, error: empError } = await supabase.from('employees').select('id, user_id, full_name').eq('user_id', actorId).single();
    if (empError) console.error('empError:', empError);
    else console.log('Employee found:', emp);
  }
}

debug();
