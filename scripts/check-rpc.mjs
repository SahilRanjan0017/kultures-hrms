import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listRpcs() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // This is a trick to list functions by querying pg_proc via an existing RPC or raw query if possible
    // But since we are looking for alignment, we will just try to call 'postgres_query' and see if it fails with 404
    const { error } = await supabase.rpc('postgres_query', { query: 'SELECT 1' });
    if (error && error.message.includes('not found')) {
        console.log('postgres_query RPC NOT found.');
    } else if (error) {
        console.log('postgres_query RPC found but failed:', error.message);
    } else {
        console.log('postgres_query RPC FOUND and working!');
    }
}

listRpcs();
