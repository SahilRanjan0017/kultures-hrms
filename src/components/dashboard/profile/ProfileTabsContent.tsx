'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Download, ExternalLink, Mail, Phone, MapPin, Calendar, User, Briefcase, GraduationCap, Building2, Banknote, ShieldCheck, Languages } from "lucide-react";
import {
    EmployeeWorkInfo,
    EmployeeExperience,
    EmployeeReference,
    EmployeeAcademic,
    EmployeePersonalData,
    EmployeeLanguage,
    EmployeeBankingIdentity
} from "@/types/profile";

export function WorkInfoContent({ data, empName, dateOfJoining }: { data: EmployeeWorkInfo | null, empName: string, dateOfJoining: string }) {
    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-8 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 w-fit">
                    <Building2 className="w-5 h-5 text-[#2EC4B6]" />
                    <span className="text-sm font-bold text-zinc-900">{data?.nature_of_employment === "Intern" ? "Intern" : "Permanent Hire"}</span>
                    <span className="text-xs text-zinc-400 font-medium">Effective from : {data?.effective_date ? new Date(data.effective_date).toLocaleDateString() : dateOfJoining}</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                    <InfoItem label="Legal Entity" value={data?.legal_entity || "-"} />
                    <InfoItem label="Business Unit" value={data?.business_unit || "-"} />
                    <InfoItem label="Nature of Employment" value={data?.nature_of_employment || "-"} />
                    <InfoItem label="Grade" value={data?.grade || "-"} />

                    <InfoItem label="Function" value={data?.function || "-"} />
                    <InfoItem label="Sub Function" value={data?.sub_function || "-"} />
                    <InfoItem label="Designation" value={empName} /> {/* TODO: Pass actual designation from profile, using empName as placeholder if missing proper prop wiring higher up */}
                    <InfoItem label="Band" value={data?.band || "-"} />

                    <InfoItem label="Zone" value={data?.zone || "-"} />
                    <InfoItem label="Region" value={data?.region || "-"} />
                    <InfoItem label="Location" value={data?.cost_center ? "Mapped via Cost Center" : "-"} />
                    <InfoItem label="Cost Center" value={data?.cost_center || "-"} />

                    <InfoItem label="Manager" value={data?.admin_manager || "-"} />
                    <InfoItem label="Administrative Manager" value={data?.admin_manager || "-"} />
                    <InfoItem label="Employment Status" value={data?.employment_status || "-"} valueColor="text-blue-500" />
                </div>
            </CardContent>
        </Card>
    );
}

export function CareerSnapshotContent({ data = [], refs = [] }: { data: EmployeeExperience[], refs: EmployeeReference[] }) {
    return (
        <div className="space-y-6">
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Career Snapshot</h3>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-tighter">
                                <tr>
                                    <th className="px-8 py-4">Work Experience</th>
                                    <th className="px-4 py-4">Employment Period From</th>
                                    <th className="px-4 py-4">Employment Period To</th>
                                    <th className="px-4 py-4">Name of Organization</th>
                                    <th className="px-4 py-4">Reason for Leaving</th>
                                    <th className="px-4 py-4">Last Designation</th>
                                    <th className="px-4 py-4">Last Gross Salary</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {data.length === 0 ? (
                                    <tr className="h-16">
                                        <td colSpan={7} className="px-8 py-4 text-center text-zinc-400 italic font-medium">No experience added yet</td>
                                    </tr>
                                ) : (
                                    data.map((exp, idx) => (
                                        <tr key={idx}>
                                            <td className="px-8 py-6 font-medium">{exp.experience_type || "Experienced"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{exp.from_date ? new Date(exp.from_date).toLocaleDateString() : "-"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{exp.to_date ? new Date(exp.to_date).toLocaleDateString() : "-"}</td>
                                            <td className="px-4 py-6 text-zinc-900 font-bold">{exp.company_name}</td>
                                            <td className="px-4 py-6 text-zinc-500">{exp.reason_for_leaving || "-"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{exp.last_designation || "-"}</td>
                                            <td className="px-4 py-6 text-zinc-900 font-bold">{exp.last_salary || "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Reference Info</h3>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-tighter">
                                <tr>
                                    <th className="px-8 py-4">HR / Manager / Executive Name</th>
                                    <th className="px-4 py-4">Company / College Name</th>
                                    <th className="px-4 py-4">Reporting Name & Designation</th>
                                    <th className="px-4 py-4">Reporting Manager Contact</th>
                                    <th className="px-4 py-4">Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {refs.length === 0 ? (
                                    <tr className="h-16">
                                        <td colSpan={5} className="px-8 py-4 text-center text-zinc-300 italic">No reference info added</td>
                                    </tr>
                                ) : (
                                    refs.map((ref, idx) => (
                                        <tr key={idx}>
                                            <td className="px-8 py-6 font-medium">{ref.reference_name}</td>
                                            <td className="px-4 py-6 text-zinc-500">{ref.company_or_college || "-"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{ref.reporting_name || "-"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{ref.reporting_contact || "-"}</td>
                                            <td className="px-4 py-6 text-zinc-500">{ref.address || "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function AcademicsContent({ data = [] }: { data: EmployeeAcademic[] }) {

    // Helper to assign a specific color to different degree types
    const getColorForDegree = (level: string) => {
        const lower = level.toLowerCase();
        if (lower.includes('b.tech') || lower.includes('bachelor')) return "bg-orange-400";
        if (lower.includes('hsc') || lower.includes('12')) return "bg-[#2EC4B6]";
        if (lower.includes('ssc') || lower.includes('10')) return "bg-blue-400";
        return "bg-purple-400";
    };

    return (
        <div className="space-y-6">
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                    <GraduationCap className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Qualification</h3>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-tighter">
                                <tr>
                                    <th className="px-8 py-4">Qualification</th>
                                    <th className="px-4 py-4">Specialization</th>
                                    <th className="px-4 py-4">University / Institute</th>
                                    <th className="px-4 py-4">Year of Passing</th>
                                    <th className="px-4 py-4">Score</th>
                                    <th className="px-4 py-4">Out of Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {data.length === 0 ? (
                                    <tr className="h-16">
                                        <td colSpan={6} className="px-8 py-4 text-center text-zinc-400 italic font-medium">No academics added yet</td>
                                    </tr>
                                ) : (
                                    data.map((academic, idx) => (
                                        <AcademicRow
                                            key={idx}
                                            qual={academic.qualification_level}
                                            spec={academic.specialization || "-"}
                                            inst={academic.institute}
                                            year={academic.passing_year || "-"}
                                            score={academic.score || "-"}
                                            out={academic.out_of_score || "-"}
                                            color={getColorForDegree(academic.qualification_level)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ProfileHubContent({ data, langs = [], email, photo }: { data: EmployeePersonalData | null, langs: EmployeeLanguage[], email: string, photo: string }) {
    return (
        <div className="space-y-6">
            <Card className="border-zinc-200 shadow-sm">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                    <User className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Personal Data</h3>
                </div>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="flex flex-wrap gap-4 mb-8">
                                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> {data?.dob ? new Date(data.dob).toLocaleDateString() : "DOB Not Set"}
                                </Badge>
                                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" /> {email}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <InfoItem label="Father" value={data?.father_name || "-"} />
                                <InfoItem label="Mother" value={data?.mother_name || "-"} />
                                <InfoItem label="Place of Birth" value={data?.place_of_birth || "-"} />
                                <InfoItem label="Mother Tongue" value={data?.mother_tongue || "-"} />
                                <InfoItem label="Nationality" value={data?.nationality || "-"} />
                                <InfoItem label="Highest Qualification" value={data?.highest_qualification || "-"} />
                                <InfoItem label="Marital Status" value={data?.marital_status || "-"} />
                                <InfoItem label="Blood Group" value={data?.blood_group || "-"} />
                            </div>
                        </div>
                        <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-zinc-100 shadow-inner shrink-0 self-center md:self-start">
                            <img src={photo || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&h=200&auto=format&fit=crop"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                    <Languages className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Language</h3>
                </div>
                <CardContent className="p-0">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-tighter">
                            <tr>
                                <th className="px-8 py-4">Language</th>
                                <th className="px-4 py-4 text-center">Reading</th>
                                <th className="px-4 py-4 text-center">Writing</th>
                                <th className="px-4 py-4 text-center">Speaking</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {langs.length === 0 ? (
                                <tr className="h-16">
                                    <td colSpan={4} className="px-8 py-4 text-center text-zinc-400 italic font-medium">No languages added yet</td>
                                </tr>
                            ) : (
                                langs.map((lang, idx) => (
                                    <tr key={idx}>
                                        <td className="px-8 py-4 font-bold text-zinc-900 flex items-center gap-3">
                                            <div className="w-1 h-6 bg-[#2EC4B6] rounded-full" />
                                            {lang.language}
                                        </td>
                                        <td className="px-4 py-4 text-center">{lang.can_read ? <CheckIcon /> : <span className="text-zinc-300">-</span>}</td>
                                        <td className="px-4 py-4 text-center">{lang.can_write ? <CheckIcon /> : <span className="text-zinc-300">-</span>}</td>
                                        <td className="px-4 py-4 text-center">{lang.can_speak ? <CheckIcon /> : <span className="text-zinc-300">-</span>}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

export function BankingIdentityContent({ data, empName }: { data: EmployeeBankingIdentity | null, empName: string }) {

    // Fallbacks if data is missing
    const hasBankData = !!data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IdentityCard label="Driving License" />
                <Card className="border-zinc-200 shadow-sm">
                    <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                        <ShieldCheck className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Identity Proof</h3>
                    </div>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-[#2EC4B6] rounded-full" />
                                <span className="text-xs font-bold text-zinc-400 uppercase">Aadhar Card</span>
                                <span className={data?.aadhar_number ? "text-sm font-bold text-zinc-900 ml-4" : "text-sm text-zinc-400 italic ml-4"}>
                                    {data?.aadhar_number || "Not added"}
                                </span>
                            </div>
                            <Button disabled={!data?.aadhar_number} variant="ghost" size="sm" className="text-[#2EC4B6] font-bold text-[10px] uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 h-7 px-3 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400">
                                Download
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-orange-400 rounded-full" />
                                <span className="text-xs font-bold text-zinc-400 uppercase">PAN Number</span>
                                <span className={data?.pan_number ? "text-sm font-bold text-zinc-900 ml-4 uppercase" : "text-sm text-zinc-400 italic ml-4"}>
                                    {data?.pan_number || "Not added"}
                                </span>
                            </div>
                            <Button disabled={!data?.pan_number} variant="ghost" size="sm" className="text-[#2EC4B6] font-bold text-[10px] uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 h-7 px-3 disabled:opacity-50 disabled:bg-zinc-50 disabled:text-zinc-400">
                                Download
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                    <Banknote className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Bank Details</h3>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50/50 text-zinc-400 font-bold uppercase tracking-tighter">
                                <tr>
                                    <th className="px-8 py-4">Effective Date</th>
                                    <th className="px-4 py-4">Payment Transaction</th>
                                    <th className="px-4 py-4">Payment Mode</th>
                                    <th className="px-4 py-4">Bank Name</th>
                                    <th className="px-4 py-4">Account No</th>
                                    <th className="px-4 py-4">Account Name</th>
                                    <th className="px-4 py-4">Account Type</th>
                                    <th className="px-4 py-4">IFSC Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {!hasBankData ? (
                                    <tr className="h-16">
                                        <td colSpan={8} className="px-8 py-4 text-center text-zinc-400 italic font-medium">No banking details added yet</td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td className="px-8 py-6 font-medium flex items-center gap-3">
                                            <div className="w-1 h-8 bg-red-400 rounded-full" />
                                            {data.effective_date ? new Date(data.effective_date).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-4 py-6 text-zinc-500">{data.payment_transaction || "-"}</td>
                                        <td className="px-4 py-6 text-zinc-500">{data.payment_mode || "-"}</td>
                                        <td className="px-4 py-6 text-zinc-900 font-bold uppercase">{data.bank_name || "-"}</td>
                                        <td className="px-4 py-6 text-zinc-500">{data.account_number || "-"}</td>
                                        <td className="px-4 py-6 text-zinc-900 font-bold uppercase">{data.account_name || empName}</td>
                                        <td className="px-4 py-6 text-zinc-500">{data.account_type || "-"}</td>
                                        <td className="px-4 py-6 text-zinc-500 uppercase">{data.ifsc_code || "-"}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper Components
function InfoItem({ label, value, valueColor = "text-zinc-900" }: { label: string, value: string, valueColor?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{label}</span>
            <span className={`text-sm font-bold ${valueColor} truncate`}>{value}</span>
        </div>
    );
}

interface AcademicRowProps {
    qual: string;
    spec: string;
    inst: string;
    year: string;
    score: string;
    out: string;
    color: string;
}

function AcademicRow({ qual, spec, inst, year, score, out, color }: AcademicRowProps) {
    return (
        <tr className="hover:bg-zinc-50/50 transition-colors">
            <td className="px-8 py-6 font-bold text-zinc-900 flex items-center gap-3">
                <div className={`w-1 h-6 ${color} rounded-full`} />
                {qual}
            </td>
            <td className="px-4 py-6 text-zinc-500 font-medium">{spec}</td>
            <td className="px-4 py-6 text-zinc-900 font-bold">{inst}</td>
            <td className="px-4 py-6 text-zinc-500 font-medium">{year}</td>
            <td className="px-4 py-6 text-zinc-900 font-bold">{score}</td>
            <td className="px-4 py-6 text-zinc-500 font-medium">{out}</td>
        </tr>
    );
}

function CheckIcon() {
    return (
        <div className="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-md">
            <Check className="w-3.5 h-3.5" />
        </div>
    );
}

function IdentityCard({ label }: { label: string }) {
    return (
        <Card className="border-zinc-200 shadow-sm h-fit">
            <div className="px-8 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/30">
                <div className="w-4 h-4 text-zinc-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="18" r="3" /><path d="M4.6 11a1 1 0 0 0-.9 1.4L5.4 16h13.2l1.7-3.6a1 1 0 0 0-.9-1.4H4.6z" /><path d="M12 12V6" /><path d="m8 6 4-4 4 4" /></svg>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">{label}</h3>
            </div>
            <CardContent className="h-40 flex items-center justify-center text-zinc-300 italic text-xs">
                No data available
            </CardContent>
        </Card>
    );
}
