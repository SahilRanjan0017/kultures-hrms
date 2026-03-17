'use client';

import { ChevronRight } from "lucide-react";
import { type Employee } from "@/lib/employees";

interface EmployeeOnLeavesProps {
    employees?: Employee[];
}

export default function EmployeeOnLeaves({ employees = [] }: EmployeeOnLeavesProps) {
    // If no employees on leave, show a nice empty state or the header
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight text-center uppercase">Employee on leaves</h3>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">
                    See all
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {employees.length === 0 ? (
                    <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Full Strength Today</p>
                    </div>
                ) : employees.map((emp, i) => (
                    <div key={emp.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all duration-300 shadow-sm overflow-hidden">
                                {emp.profile_photo_url ? (
                                    <img src={emp.profile_photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    emp.full_name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{emp.full_name}</h4>
                                <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{emp.department || 'Staff'}</p>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-sm bg-rose-50 text-rose-600 border-rose-100`}>
                            Active Leave
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-8 py-3 bg-zinc-50 hover:bg-zinc-100 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest transition-all border border-zinc-100 border-dashed">
                Manage All Requests
            </button>
        </div>
    );
}
