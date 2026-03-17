'use client';

import { LucideIcon, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PagedonePageHeaderProps {
    title: string;
    description: string;
    actions?: {
        label: string;
        icon?: LucideIcon;
        onClick: () => void;
        variant?: "default" | "outline" | "ghost";
    }[];
}

export default function PagedonePageHeader({
    title,
    description,
    actions
}: PagedonePageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none uppercase">
                    {title}
                </h1>
                <p className="text-zinc-400 mt-3 font-medium text-sm max-w-lg">
                    {description}
                </p>
            </div>
            {actions && actions.length > 0 && (
                <div className="flex items-center gap-3">
                    {actions.map((action, i) => (
                        <Button
                            key={i}
                            variant={action.variant || (i === actions.length - 1 ? "default" : "outline")}
                            onClick={action.onClick}
                            className={`h-12 px-6 rounded-2xl text-xs font-bold transition-all ${action.variant === "outline" || !action.variant && i !== actions.length - 1
                                    ? "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-50 shadow-sm"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                }`}
                        >
                            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
