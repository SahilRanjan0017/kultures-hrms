import { createClient } from "@/lib/supabase/server";

interface DashboardPageProps {
    params: Promise<{
        subdomain: string;
    }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
    const { subdomain } = await params;
    const supabase = await createClient();

    const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

    if (!tenant) return null;

    let daysLeft = 0;
    if (tenant.status === 'trial' && tenant.trial_end_date) {
        const end = new Date(tenant.trial_end_date).getTime();
        const now = new Date().getTime();
        daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    return (
        <div className="bg-white shadow sm:rounded-lg p-6 border">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">
                Welcome to {tenant.company_name} HRMS
            </h2>
            <div className="rounded-md bg-blue-50 p-4 mb-6 border border-blue-100">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Trial Status
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                You have {daysLeft} days left in your trial.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for future widgets */}
            <div className="grid border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-lg h-64 place-items-center text-zinc-400 font-medium">
                Future Dashboard Widgets
            </div>
        </div>
    );
}
