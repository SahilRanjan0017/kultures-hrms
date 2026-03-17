'use client';

import { Megaphone, ArrowRight } from "lucide-react";

export default function Announcements() {
    return (
        <div className="bg-indigo-600 rounded-[2rem] p-8 shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-8 -mb-8 blur-xl" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Company Announcement</span>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                        New Health Insurance Policy is now live for all employees.
                    </h2>
                    <p className="text-sm text-indigo-100/80 mt-3 line-clamp-2 font-medium">
                        Effective from next month, we are transitioning to a comprehensive health coverage provider. Please download the new policy document for details.
                    </p>
                </div>

                <button className="flex items-center gap-2 text-white font-bold text-xs group/btn">
                    Read Full Update
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-indigo-600 transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </button>
            </div>
        </div>
    );
}
