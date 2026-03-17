'use client';

import { MoreVertical, Folder } from "lucide-react";

interface DocumentCategoryCardProps {
    title: string;
    size: string;
    date: string;
    color: string;
    bg: string;
}

export default function DocumentCategoryCard({ title, size, date, color, bg }: DocumentCategoryCardProps) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col gap-6 group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
                <button className="text-zinc-300 hover:text-zinc-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} shadow-inner group-hover:scale-110 transition-transform`}>
                        <Folder className="w-5 h-5 fill-current opacity-20" />
                        <Folder className="w-5 h-5 absolute" />
                    </div>
                    <p className="text-xl font-black text-zinc-900 tracking-tight">{size}</p>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{date}</span>
            </div>
        </div>
    );
}
