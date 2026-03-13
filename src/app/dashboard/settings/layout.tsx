'use client';

import { Settings, Shield, Building2, CreditCard, Users, Code, HelpCircle } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarNavItems = [
    { title: "General", href: "/dashboard/settings", icon: <Building2 className="w-4 h-4" /> },
    { title: "Security", href: "/dashboard/settings/security", icon: <Shield className="w-4 h-4" /> },
    { title: "Billing & Plans", href: "/dashboard/settings/billing", icon: <CreditCard className="w-4 h-4" /> },
    { title: "Team Members", href: "/dashboard/settings/team", icon: <Users className="w-4 h-4" /> },
    { title: "API Keys", href: "/dashboard/settings/api-keys", icon: <Code className="w-4 h-4" /> },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="space-y-0.5">
                <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
                <p className="text-muted-foreground">Manage your workspace settings and preferences.</p>
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/4">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {sidebarNavItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-zinc-100/80 text-zinc-900 shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}
                                    `}
                                >
                                    {item.icon}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-zinc-100 px-2 lg:px-0">
                        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition flex-1 py-1">
                            <HelpCircle className="w-4 h-4" /> Support & Help
                        </Link>
                    </div>
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}
