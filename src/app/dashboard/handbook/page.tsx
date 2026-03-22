'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    FileText,
    Plus,
    Loader2,
    ChevronRight,
    ExternalLink,
    Download,
    Eye,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Policy {
    id: string;
    title: string;
    file_url: string;
    category: string;
    icon: string;
    created_at: string;
}

export default function HandbookPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Upload Form State
    const [newPolicy, setNewPolicy] = useState({
        title: "",
        category: "General",
        file: null as File | null
    });

    useEffect(() => {
        fetchPolicies();
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        // user comes from global AuthProvider — no extra getUser() call needed
        if (!user) return;

        const { data: membership } = await supabase
            .from("tenant_members")
            .select("role")
            .eq("user_id", user.id)
            .single();

        setIsAdmin(membership?.role === "admin" || membership?.role === "hr");
    };

    const fetchPolicies = async () => {
        try {
            const res = await fetch("/api/handbook");
            const data = await res.json();
            setPolicies(data);
            if (data.length > 0 && !selectedPolicy) {
                setSelectedPolicy(data[0]);
            }
        } catch (error) {
            toast.error("Failed to load policies");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!newPolicy.title || !newPolicy.file) {
            toast.error("Please provide title and file");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload to Storage
            const fileExt = newPolicy.file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `handbook/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, newPolicy.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            // 2. Save to Database
            const res = await fetch("/api/handbook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newPolicy.title,
                    category: newPolicy.category,
                    file_url: publicUrl
                })
            });

            if (!res.ok) throw new Error("Database save failed");

            toast.success("Policy uploaded successfully");
            fetchPolicies();
            setNewPolicy({ title: "", category: "General", file: null });
        } catch (error: any) {
            toast.error(error.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Employee Handbook</h1>
                    <p className="text-zinc-500 mt-1">Company policies, guidelines, and cultural documents</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search policies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 border-zinc-200 bg-white shadow-sm"
                        />
                    </div>

                    {isAdmin && (
                        <Dialog>
                            <DialogTrigger
                                render={
                                    <Button className="shadow-lg shadow-primary/20">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Policy
                                    </Button>
                                }
                            />
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Upload Company Policy</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="space-y-2">
                                        <Label>Document Title</Label>
                                        <Input
                                            placeholder="e.g. Leave Policy 2024"
                                            value={newPolicy.title}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input
                                            placeholder="e.g. HR, Tech, Legal"
                                            value={newPolicy.category}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>PDF Document</Label>
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setNewPolicy({ ...newPolicy, file: e.target.files?.[0] || null })}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Upload Document
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Split View Container */}
            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Left Sidebar: Document List */}
                <Card className="w-80 flex-shrink-0 border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-zinc-50 border-b border-zinc-200">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Documents ({filteredPolicies.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredPolicies.map((policy) => (
                            <button
                                key={policy.id}
                                onClick={() => setSelectedPolicy(policy)}
                                className={`
                                    w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                                    ${selectedPolicy?.id === policy.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-zinc-50 text-zinc-600"}
                                `}
                            >
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${selectedPolicy?.id === policy.id ? "bg-white shadow-sm" : "bg-zinc-100"}
                                `}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{policy.title}</p>
                                    <p className="text-[10px] font-medium opacity-60 tracking-tight uppercase">{policy.category}</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedPolicy?.id === policy.id ? "rotate-90" : "opacity-20"}`} />
                            </button>
                        ))}

                        {filteredPolicies.length === 0 && (
                            <div className="p-8 text-center">
                                <FileText className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No policies found</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right Area: PDF Preview */}
                <Card className="flex-1 border-zinc-200 shadow-sm overflow-hidden bg-zinc-50 flex flex-col relative group">
                    {selectedPolicy ? (
                        <>
                            {/* Toolbar */}
                            <div className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900">{selectedPolicy.title}</h2>
                                        <p className="text-[10px] text-zinc-400 font-medium">Uploaded on {new Date(selectedPolicy.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={selectedPolicy.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-zinc-50 rounded-lg border border-zinc-100 text-zinc-500 transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <a
                                        href={selectedPolicy.file_url}
                                        download
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download PDF
                                    </a>
                                </div>
                            </div>

                            {/* Viewer */}
                            <div className="flex-1 bg-zinc-200/50 p-4 overflow-hidden flex justify-center">
                                <div className="w-full max-w-5xl h-full bg-white shadow-2xl rounded-sm overflow-hidden border border-zinc-300">
                                    <iframe
                                        src={`${selectedPolicy.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full border-none"
                                        title={selectedPolicy.title}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-zinc-100 mb-6">
                                <FileText className="w-10 h-10 text-zinc-200" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Select a document</h2>
                            <p className="text-zinc-500 mt-2 max-w-xs leading-relaxed">
                                Choose a document from the left sidebar to preview company policies and guidelines.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
