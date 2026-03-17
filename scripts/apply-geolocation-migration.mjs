
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const migrationPath = '/Users/user/Desktop/Kultures/kultures-hrms/supabase/migrations/add_attendance_geolocation.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log("Applying attendance geolocation migration...");

    // Split by semicolons for basic execution (not perfect but usually works for simple alters)
    const commands = sql.split(';').map(c => c.trim()).filter(c => c.length > 0);

    for (const cmd of commands) {
        const { error } = await supabase.rpc('run_sql', { sql_query: cmd });
        if (error) {
            // Note: run_sql RPC might not be enabled by default. 
            // If it fails, we inform the user to run it in the dashboard.
            console.error(`❌ Error executing SQL: ${error.message}`);
            console.log("⚠️ Please run the SQL migration manually in the Supabase Dashboard:");
            console.log(sql);
            return;
        }
    }

    console.log("✅ Migration applied successfully (via RPC)");
}

// Alternatively, use postgres-js or similar if available, but let's try RPC first.
// Actually, run_sql is rare. I'll just tell the user.
console.log("⚠️ Please copy the contents of 'supabase/migrations/add_attendance_geolocation.sql' and run it in your Supabase SQL Editor.");
