// src/types/profile.ts

export interface EmployeeWorkInfo {
    id: string;
    tenant_id: string;
    employee_id: string;
    legal_entity?: string;
    business_unit?: string;
    nature_of_employment?: string;
    grade?: string;
    function?: string;
    sub_function?: string;
    band?: string;
    zone?: string;
    region?: string;
    cost_center?: string;
    admin_manager?: string;
    employment_status?: string;
    effective_date?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeExperience {
    id: string;
    tenant_id: string;
    employee_id: string;
    experience_type?: string;
    company_name: string;
    from_date?: string;
    to_date?: string;
    last_designation?: string;
    last_salary?: string;
    reason_for_leaving?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeReference {
    id: string;
    tenant_id: string;
    employee_id: string;
    reference_name: string;
    company_or_college?: string;
    reporting_name?: string;
    reporting_contact?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeAcademic {
    id: string;
    tenant_id: string;
    employee_id: string;
    qualification_level: string;
    specialization?: string;
    institute: string;
    passing_year?: string;
    score?: string;
    out_of_score?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeePersonalData {
    id: string;
    tenant_id: string;
    employee_id: string;
    dob?: string;
    father_name?: string;
    mother_name?: string;
    place_of_birth?: string;
    mother_tongue?: string;
    nationality?: string;
    highest_qualification?: string;
    marital_status?: string;
    blood_group?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeLanguage {
    id: string;
    tenant_id: string;
    employee_id: string;
    language: string;
    can_read: boolean;
    can_write: boolean;
    can_speak: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmployeeBankingIdentity {
    id: string;
    tenant_id: string;
    employee_id: string;
    aadhar_number?: string;
    pan_number?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    account_type?: string;
    ifsc_code?: string;
    payment_mode?: string;
    payment_transaction?: string;
    effective_date?: string;
    created_at: string;
    updated_at: string;
}

// Unified profile payload returned from API
export interface FullEmployeeProfile {
    // Basic employee data from `employees` table
    id: string;
    tenant_id: string;
    user_id: string;
    full_name: string;
    email: string;
    emp_code: string;
    department?: string;
    designation?: string;
    location?: string;
    phone?: string;
    status: string;
    profile_photo_url?: string;
    date_of_joining?: string;

    // Nested normalized data
    work_info: EmployeeWorkInfo | null;
    experience: EmployeeExperience[];
    references: EmployeeReference[];
    academics: EmployeeAcademic[];
    personal_data: EmployeePersonalData | null;
    languages: EmployeeLanguage[];
    banking_identity: EmployeeBankingIdentity | null;
}
