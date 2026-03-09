import { createClient } from "@/lib/supabase/server";

export type TenantMember = {
    tenant_id: string;
    tenants: {
        subdomain: string;
        company_name: string;
    } | null;
};

export async function getUserTenant(): Promise<TenantMember | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id, tenants ( subdomain, company_name )")
        .eq("id", user.id)
        .maybeSingle();

    if (error || !data) return null;

    // PostgREST returns a joined one-to-one relationship as either an object or array of objects depending on schema inference
    // Here we normalize it to match our TenantMember type
    const tenantsNode = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;

    return {
        tenant_id: data.tenant_id,
        tenants: tenantsNode ? {
            subdomain: tenantsNode.subdomain,
            company_name: tenantsNode.company_name
        } : null
    };
}
