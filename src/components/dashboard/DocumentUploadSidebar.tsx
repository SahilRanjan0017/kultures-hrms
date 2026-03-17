'use client';

import { Calendar, ChevronRight, FileText, X } from "lucide-react";

export default function DocumentUploadSidebar() {
    return (
        <div className="flex flex-col gap-8">
            {/* Upload Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Upload Documents</h3>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-all">
                        Today
                        <Calendar className="w-3.5 h-3.5" />
                    </button>
                </div>

                <button className="w-full flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl group hover:bg-zinc-50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-300">
                            <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors">Select Folder</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>

                <div className="border-2 border-dashed border-zinc-100 rounded-[2rem] p-10 flex flex-col items-center gap-6 group hover:border-indigo-200 transition-all cursor-pointer bg-zinc-50/20">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-zinc-900">Drag an image here</p>
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-1">or</p>
                    </div>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        Choose File
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-50 space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-indigo-600">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-900">General Documents.txt</p>
                                <p className="text-[10px] font-medium text-emerald-500 mt-0.5">Upload complete</p>
                            </div>
                        </div>
                        <button className="text-zinc-300 hover:text-rose-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-white border border-zinc-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-indigo-600 rounded-full w-[100%] transition-all duration-1000" />
                        </div>
                        <span className="text-[11px] font-black text-zinc-900">100%</span>
                    </div>
                </div>
            </div>

            {/* Google Drive Integration */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Google Drive</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                        Connected
                    </span>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-zinc-900">My Drive</h4>
                    <p className="text-[11px] font-medium text-zinc-400 mt-2 leading-relaxed">
                        Use Google Drive to storage your account data and document
                    </p>
                </div>

                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline text-left">
                    Click here to learn more
                </button>
            </div>
        </div>
    );
}
