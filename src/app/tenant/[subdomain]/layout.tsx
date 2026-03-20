import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

interface TenantLayoutProps {
    children: ReactNode;
    params: Promise<{
        subdomain: string;
    }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
    const { subdomain } = await params;
    const supabase = await createClient();

    const { data: tenant, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", subdomain)
        .single();

    if (error || !tenant) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800">404 - Company not found</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow border-b">
                <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        {tenant.name}
                    </h1>
                    {tenant.status === 'trial' && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 border border-blue-200">
                            Trial Active
                        </span>
                    )}
                </div>
            </header>
            <main className="flex-1">
                <div className="mx-auto w-full max-w-7xl py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
