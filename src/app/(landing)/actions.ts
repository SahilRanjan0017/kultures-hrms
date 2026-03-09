"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendPasswordSetupEmail(formData: FormData) {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email) return { ok: false, message: "Email required" };

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password`,
    });

    if (error) {
        return { ok: false, message: error.message };
    }

    return { ok: true };
}
