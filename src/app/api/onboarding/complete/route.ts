import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { role, phone, address, emergency_contact } = body;

        // 1. Update Profile to mark onboarding as completed
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id);

        if (profileError) throw profileError;

        // 2. If it's an employee, update their employee record
        if (role === "employee") {
            const { data: profile } = await supabase
                .from("profiles")
                .select("employee_id")
                .eq("id", user.id)
                .single();

            if (profile?.employee_id) {
                const { error: employeeError } = await supabase
                    .from("employees")
                    .update({
                        phone,
                        address,
                        emergency_contact
                    })
                    .eq("id", profile.employee_id);

                if (employeeError) throw employeeError;
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Onboarding Completion Error:", error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
