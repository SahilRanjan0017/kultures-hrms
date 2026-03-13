'use client';

import { Card, CardContent } from "@/components/ui/card";
import { User, MapPin, Users2 } from "lucide-react";

interface EmployeeCardProps {
    employee: {
        id: string;
        full_name: string;
        emp_code: string;
        designation: string;
        location: string;
        profile_photo_url?: string;
        reportees_count: number;
    };
    isFocused?: boolean;
    onClick?: () => void;
}

export default function EmployeeJobCard({ employee, isFocused, onClick }: EmployeeCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                relative w-72 bg-white border rounded-xl overflow-visible transition-all cursor-pointer group
                ${isFocused ? 'ring-2 ring-primary ring-offset-4 border-primary shadow-xl scale-105 z-20' : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'}
            `}
        >
            {/* Top Color Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-primary/80 rounded-t-xl" />

            {/* Photo - Floating Style */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-zinc-100 group-hover:scale-110 transition-transform">
                    {employee.profile_photo_url ? (
                        <img src={employee.profile_photo_url} alt={employee.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <User className="w-10 h-10" />
                        </div>
                    )}
                </div>
            </div>

            <CardContent className="pt-12 pb-6 px-6 text-center">
                {/* Emp Code Badge */}
                <div className="absolute top-4 right-4 text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">
                    {employee.emp_code}
                </div>

                <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors mt-2">{employee.full_name}</h3>
                <p className="text-xs font-semibold text-zinc-500 mt-0.5">{employee.designation}</p>

                <div className="flex justify-center items-center gap-1 mt-3">
                    <span className="p-1 rounded bg-primary/10 text-primary">
                        <Users2 className="w-3 h-3" />
                    </span>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-50 pt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        Reportees: <span className="text-zinc-900">{employee.reportees_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {employee.location || 'Bangalore'}
                    </div>
                </div>
            </CardContent>
        </div>
    );
}
