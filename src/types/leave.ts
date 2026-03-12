export type LeaveSession = 'full_day' | 'first_half' | 'second_half';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
    id: string;
    name: string;
    color: string;
    max_days: number;
    carry_forward: boolean;
    requires_approval: boolean;
    half_day_allowed: boolean;
}

export interface LeaveBalance {
    id: string;
    leave_type: LeaveType;
    year: number;
    total_days: number;
    used_days: number;
    pending_days: number;
    available_days: number; // computed
}

export interface LeaveRequest {
    id: string;
    employee_id: string;
    employee_name?: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    days_count: number;
    session: LeaveSession;
    reason: string;
    status: LeaveStatus;
    approved_by_name?: string;
    approved_at?: string;
    rejection_reason?: string;
    created_at: string;
}
