'use client';

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, User, Building, Pencil } from "lucide-react";
import Link from "next/link";

interface EmployeeHeaderProps {
    employee: {
        full_name: string;
        emp_code: string;
        designation: string;
        department: string;
        location: string;
        email: string;
        manager_name?: string;
        manager_code?: string;
        profile_completion: number;
        profile_photo_url?: string;
    };
}

export default function EmployeeHeader({ employee }: EmployeeHeaderProps) {
    return (
        <div className="relative bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-0 opacity-50" />

            <div className="relative flex flex-col md:flex-row gap-8 items-start">
                {/* Photo & Identity */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-100 shadow-inner bg-zinc-50">
                        {employee.profile_photo_url ? (
                            <img src={employee.profile_photo_url} alt={employee.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <User className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-primary cursor-pointer transition-colors">
                        <Pencil className="w-4 h-4" />
                    </div>
                </div>

                {/* Main Details */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Delighted to have you back</h1>
                        <p className="text-xl font-medium text-zinc-500 mt-1">{employee.full_name}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                            <Badge variant="outline" className="font-bold border-zinc-200 text-zinc-500">{employee.emp_code}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <User className="w-4 h-4 text-amber-500" />
                            {employee.designation}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <MapPin className="w-4 h-4 text-primary" />
                            {employee.location || 'Not Specified'}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm py-2">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Mail className="w-4 h-4 text-primary" />
                            {employee.email}
                        </div>
                        {employee.manager_name && (
                            <div className="flex items-center gap-2 text-zinc-500">
                                <Building className="w-4 h-4 text-emerald-500" />
                                {employee.manager_name} - {employee.manager_code}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions & Progress */}
                <div className="w-full md:w-64 space-y-4">
                    <div className="flex gap-2">
                        <Link href="/dashboard/profile" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full border-primary/20 text-primary hover:bg-primary/5">VIEW</Button>
                        </Link>
                        <Link href="/dashboard/profile" className="flex-1">
                            <Button variant="default" size="sm" className="w-full shadow-md shadow-primary/20">EDIT</Button>
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            <span>Profile Completion</span>
                            <span className="text-emerald-500">{employee.profile_completion}%</span>
                        </div>
                        <Progress value={employee.profile_completion} className="h-1.5 bg-zinc-100" />
                    </div>
                </div>
            </div>
        </div>
    );
}
