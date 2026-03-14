import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
    console.log("Looking up user...");
    const { data: users, error } = await adminSupabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error);
        return;
    }
    const user = users.users.find(u => u.email === 'sahil.ranjan@bricknbolt.com');
    if (!user) {
        console.log("User not found!");
        return;
    }

    console.log("Updating password for user:", user.id);
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user.id,
        { password: "Sahil@123", email_confirm: true }
    );

    if (updateError) {
        console.error("Error updating pwd:", updateError);
    } else {
        console.log("Password reset successfully. Now login should work.");
    }
}
resetPassword();
