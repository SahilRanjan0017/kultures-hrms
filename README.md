# Kultures HRMS System Architecture

This document outlines the technical architecture, security model, and API structure of the Kultures HRMS application.

## 🏗️ Core Architecture Components

### 1. Multi-Tenancy (Data Isolation)
The system uses a **Shared Database, Shared Schema** tenancy model. Isolation is strictly enforced via the `tenant_id` (UUID) column present in key tables:
- `employees` (Master Source of Truth - columns: id, tenant_id, full_name, email, emp_code, role, department, designation, phone, date_of_joining, status, avatar_url, user_id, address, emergency_contact)
- `profiles`
- `tenant_members`

**Enforcement:** All API routes fetch the requester's `tenant_id` from the `employees` table using their `auth.user.id` and append a `.eq('tenant_id', profile.tenant_id)` filter to all database operations.

### 2. Role-Based Access Control (RBAC)
Roles are defined in `src/lib/Permissions.ts`.

| Role | Description |
| :--- | :--- |
| **admin** | Full access to all modules, settings, and company-wide management. |
| **hr** | Can manage employees, attendance, and view payroll (excluding some settings). |
| **manager** | Can view their team and manage attendance/payroll for subordinates. |
| **employee** | Access to own profile, attendance, and payroll records only. |

**RBAC Enforcement:**
- **Frontend:** Use the `RoleGuard` component or `useRole()` hook to conditionally render UI.
- **Backend:** API routes check permissions via the `role` fetched from the `employees` table.

## 🔌 API Reference

### 👥 Employees API (`/api/employees`)
| Method | Endpoint | Description | Perm Req |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | List employees (filters: role, dept, status, search) | `employees:view` |
| `POST` | `/api/employees` | Create a new employee record directly | `employees:manage` |
| `GET` | `/api/employees/[id]` | Fetch detailed employee profile | `employees:view` |
| `PUT` | `/api/employees/[id]` | Update employee details | `employees:manage` |
| `PATCH` | `/api/employees/[id]/status` | Update employee status (active/inactive) | `employees:manage` |

### ✉️ Team & Auth API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/team/invite` | Invites a user: Creates Auth account & Employee record, sends email. |
| `POST` | `/api/auth/resolve-emp-code` | Resolves an email from an Employee Code for login. |

## 🔑 Authentication Flow
1. **Invite:** Admin/HR invites via email.
2. **Setup:** User receives email with Temp Password + Employee Code.
3. **Login:** User logged in via `Email + Password` OR `EMP Code + Password`.
4. **Mandatory Change:** User must set a new password on first login (tracked via `is_first_login` in `profiles`).
5. **Password Reset (Self-Service):** 
   - User enters **Employee Code**.
   - A 4-digit numeric OTP is sent to their registered email.
   - User enters **OTP + New Password** to securely reset.

## 🛠️ Developer Notes

### Master Data Source
> [!IMPORTANT]
> The `employees` table is the **Master Source of Truth** for a user's role and tenant affiliation.
> **DO NOT** rely on the `profiles` table for server-side authorization checks, as it may not be in sync for newly invited or non-onboarded users.

### Security Checklist for New APIs
Always wrap Supabase queries with:
```typescript
const { data: profile } = await adminSupabase
    .from('employees')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

// Enforce boundary
query.eq('tenant_id', profile.tenant_id);
```
