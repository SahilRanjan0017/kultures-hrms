
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeColumns() {
    console.log("Probing columns in employees...");

    const columnsToProbe = ['phone', 'date_of_joining', 'profile_photo_url', 'department'];

    for (const col of columnsToProbe) {
        const { error } = await supabase.from('employees').select(col).limit(0);
        if (error) {
            console.log(`❌ Column '${col}' is MISSING: ${error.message}`);
        } else {
            console.log(`✅ Column '${col}' EXISTS.`);
        }
    }
}

probeColumns();
