import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FullEmployeeProfile } from '@/types/profile';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We use admin client for structured queries, 
        // relying on our own tenant checks for safe data retrieval
        const adminSupabase = createAdminClient();

        // 1. Get base employee profile & tenant 
        const { data: baseProfile, error: profileError } = await adminSupabase
            .from('employees')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError || !baseProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const employeeId = baseProfile.id;
        const tenantId = baseProfile.tenant_id;

        // 2. Fetch all related profile data concurrently
        const [
            workInfoResult,
            experienceResult,
            referencesResult,
            academicsResult,
            personalDataResult,
            languagesResult,
            bankingResult
        ] = await Promise.all([
            adminSupabase.from('employee_work_info').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId).maybeSingle(),
            adminSupabase.from('employee_experience').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId).order('from_date', { ascending: false }),
            adminSupabase.from('employee_references').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId),
            adminSupabase.from('employee_academics').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId).order('passing_year', { ascending: false }),
            adminSupabase.from('employee_personal_data').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId).maybeSingle(),
            adminSupabase.from('employee_languages').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId),
            adminSupabase.from('employee_banking_identity').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId).maybeSingle()
        ]);

        // Construct unified profile object matching the type definition
        const fullProfile: FullEmployeeProfile = {
            id: baseProfile.id,
            tenant_id: baseProfile.tenant_id,
            user_id: baseProfile.user_id,
            full_name: baseProfile.full_name,
            email: baseProfile.email,
            emp_code: baseProfile.emp_code,
            department: baseProfile.department,
            designation: baseProfile.designation,
            location: baseProfile.location,
            phone: baseProfile.phone,
            status: baseProfile.status,
            profile_photo_url: baseProfile.profile_photo_url,
            date_of_joining: baseProfile.date_of_joining,

            work_info: workInfoResult.data || null,
            experience: experienceResult.data || [],
            references: referencesResult.data || [],
            academics: academicsResult.data || [],
            personal_data: personalDataResult.data || null,
            languages: languagesResult.data || [],
            banking_identity: bankingResult.data || null
        };

        return NextResponse.json({ profile: fullProfile });

    } catch (err: any) {
        console.error('Fetch Full Profile Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
