"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
    useSchools,
    useCreateSchool,
    useUpdateSchool,
    useDeleteSchool,
    useUpdateSchoolStatus
} from "@/lib/api";
import {
    Building2,
    Plus,
    Search,
    MapPin,
    School,
    ShieldCheck,
    Clock,
    AlertTriangle,
    Trash2,
    Edit3,
    Eye,
    X,
    Loader2,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Archive
} from "lucide-react";

interface SchoolItem {
    id: string;
    school_name: string;
    school_code: string;
    npsn?: string;
    education_level: string;
    address?: string;
    province?: string;
    regency?: string;
    district?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    principal_name?: string;
    accreditation?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function SchoolManagementPage() {
    const [search, setSearch] = React.useState("");
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingSchool, setEditingSchool] = React.useState<SchoolItem | null>(null);
    const [deletingSchool, setDeletingSchool] = React.useState<SchoolItem | null>(null);
    const [viewingSchool, setViewingSchool] = React.useState<SchoolItem | null>(null);
    const [statusMenuSchool, setStatusMenuSchool] = React.useState<string | null>(null);

    const [formData, setFormData] = React.useState({
        school_name: "",
        school_code: "",
        npsn: "",
        education_level: "SMA",
        address: "",
        province: "",
        regency: "",
        district: "",
        postal_code: "",
        phone: "",
        email: "",
        website: "",
        principal_name: "",
        accreditation: ""
    });

    const { data: schoolsResponse, isLoading, refetch } = useSchools() as any;
    const createMutation = useCreateSchool();
    const updateMutation = useUpdateSchool();
    const deleteMutation = useDeleteSchool();
    const statusMutation = useUpdateSchoolStatus();

    const schoolsList: SchoolItem[] = React.useMemo(() => {
        if (!schoolsResponse) return [];
        if (Array.isArray(schoolsResponse)) return schoolsResponse;
        if (Array.isArray(schoolsResponse.data)) return schoolsResponse.data;
        return [];
    }, [schoolsResponse]);

    const filteredSchools = schoolsList.filter((s) => {
        const name = s?.school_name || "";
        const region = s?.province || s?.regency || s?.district || s?.address || "";
        const code = s?.school_code || "";
        const npsn = s?.npsn || "";
        const searchTerm = search.toLowerCase();
        return name.toLowerCase().includes(searchTerm) ||
            region.toLowerCase().includes(searchTerm) ||
            code.toLowerCase().includes(searchTerm) ||
            npsn.includes(searchTerm);
    });

    const stats = React.useMemo(() => {
        const total = schoolsList.length;
        const active = schoolsList.filter(s => s.status === "ACTIVE" || s.status === "PUBLISHED").length;
        const pending = schoolsList.filter(s => s.status === "DRAFT" || s.status === "PENDING_VERIFICATION").length;
        const suspended = schoolsList.filter(s => s.status === "SUSPENDED").length;
        return { total, active, pending, suspended };
    }, [schoolsList]);

    const resetForm = () => {
        setFormData({
            school_name: "",
            school_code: "",
            npsn: "",
            education_level: "SMA",
            address: "",
            province: "",
            regency: "",
            district: "",
            postal_code: "",
            phone: "",
            email: "",
            website: "",
            principal_name: "",
            accreditation: ""
        });
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (school: SchoolItem) => {
        setFormData({
            school_name: school.school_name || "",
            school_code: school.school_code || "",
            npsn: school.npsn || "",
            education_level: school.education_level || "SMA",
            address: school.address || "",
            province: school.province || "",
            regency: school.regency || "",
            district: school.district || "",
            postal_code: school.postal_code || "",
            phone: school.phone || "",
            email: school.email || "",
            website: school.website || "",
            principal_name: school.principal_name || "",
            accreditation: school.accreditation || ""
        });
        setEditingSchool(school);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData };
            if (!payload.npsn) delete payload.npsn;
            if (!payload.address) delete payload.address;
            if (!payload.province) delete payload.province;
            if (!payload.regency) delete payload.regency;
            if (!payload.district) delete payload.district;
            if (!payload.postal_code) delete payload.postal_code;
            if (!payload.phone) delete payload.phone;
            if (!payload.email) delete payload.email;
            if (!payload.website) delete payload.website;
            if (!payload.principal_name) delete payload.principal_name;
            if (!payload.accreditation) delete payload.accreditation;

            if (editingSchool) {
                await updateMutation.mutateAsync({ id: editingSchool.id, data: payload });
                setEditingSchool(null);
            } else {
                await createMutation.mutateAsync(payload);
                setIsCreateOpen(false);
            }
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal menyimpan sekolah");
        }
    };

    const handleDelete = async () => {
        if (!deletingSchool) return;
        try {
            await deleteMutation.mutateAsync(deletingSchool.id);
            setDeletingSchool(null);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus sekolah");
        }
    };

    const handleStatusChange = async (schoolId: string, newStatus: string) => {
        try {
            await statusMutation.mutateAsync({ id: schoolId, status: newStatus });
            setStatusMenuSchool(null);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal mengubah status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
            case "PUBLISHED": return "success";
            case "DRAFT":
            case "PENDING_VERIFICATION": return "warning";
            case "SUSPENDED": return "destructive";
            case "ARCHIVED": return "secondary";
            default: return "outline";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "ACTIVE": return "Aktif";
            case "PUBLISHED": return "Published";
            case "DRAFT": return "Draft";
            case "PENDING_VERIFICATION": return "Verifikasi";
            case "SUSPENDED": return "Suspended";
            case "ARCHIVED": return "Archived";
            default: return status;
        }
    };

    const getNextStatuses = (currentStatus: string): string[] => {
        const transitions: Record<string, string[]> = {
            "DRAFT": ["PENDING_VERIFICATION", "ARCHIVED"],
            "PENDING_VERIFICATION": ["ACTIVE", "SUSPENDED", "ARCHIVED"],
            "ACTIVE": ["SUSPENDED", "ARCHIVED"],
            "PUBLISHED": ["SUSPENDED", "ARCHIVED"],
            "SUSPENDED": ["ACTIVE", "ARCHIVED"],
        };
        return transitions[currentStatus] || [];
    };

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">INSTITUTION</Badge>
                        <span className="text-xs text-muted-foreground">Partner Schools & Quota Allocation</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Manajemen Sekolah Mitra</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola lisensi sekolah mitra, alokasi kuota ujian CBT, dan status verifikasi institusi.
                    </p>
                </div>

                <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer" onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Registrasi Sekolah Mitra
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Sekolah</span>
                        <div className="text-xl font-extrabold">{stats.total} Institusi</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Aktif / Published</span>
                        <div className="text-xl font-extrabold text-success">{stats.active} Sekolah</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Verifikasi</span>
                        <div className="text-xl font-extrabold text-warning">{stats.pending} Sekolah</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Suspended</span>
                        <div className="text-xl font-extrabold text-destructive">{stats.suspended} Sekolah</div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari sekolah, kode, NPSN, atau wilayah..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-semibold">Memuat data sekolah...</p>
                </div>
            )}

            {/* School Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchools.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-xl bg-card p-6">
                            <School className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-semibold">Tidak ada data sekolah ditemukan.</p>
                            <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau tambah sekolah baru.</p>
                        </div>
                    ) : (
                        filteredSchools.map((s) => {
                            const schoolName = s.school_name || "Sekolah Mitra";
                            const schoolRegion = [s.regency, s.province].filter(Boolean).join(", ") || s.address || "Indonesia";
                            const status = s.status || "DRAFT";

                            return (
                                <Card key={s.id} className="p-6 space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                    <School className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm">{schoolName}</h3>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" /> {schoolRegion}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setStatusMenuSchool(statusMenuSchool === s.id ? null : s.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <Badge variant={getStatusColor(status) as any} className="text-[10px] font-bold cursor-pointer hover:opacity-80">
                                                        {getStatusLabel(status)}
                                                    </Badge>
                                                </button>
                                                {statusMenuSchool === s.id && (
                                                    <div className="absolute right-0 top-8 z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[140px]">
                                                        <div className="px-3 py-1 text-[10px] text-muted-foreground font-semibold border-b">Ubah Status</div>
                                                        {getNextStatuses(status).map((ns) => (
                                                            <button
                                                                key={ns}
                                                                onClick={() => handleStatusChange(s.id, ns)}
                                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted cursor-pointer flex items-center gap-2"
                                                            >
                                                                {ns === "ACTIVE" && <CheckCircle2 className="h-3 w-3 text-success" />}
                                                                {ns === "SUSPENDED" && <XCircle className="h-3 w-3 text-destructive" />}
                                                                {ns === "ARCHIVED" && <Archive className="h-3 w-3 text-muted-foreground" />}
                                                                {ns === "PENDING_VERIFICATION" && <Clock className="h-3 w-3 text-warning" />}
                                                                {getStatusLabel(ns)}
                                                            </button>
                                                        ))}
                                                        {getNextStatuses(status).length === 0 && (
                                                            <div className="px-3 py-1.5 text-xs text-muted-foreground">Tidak ada transisi tersedia</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                                <span className="text-[10px] text-muted-foreground block font-semibold">Kode Sekolah</span>
                                                <span className="font-extrabold text-sm font-mono">{s.school_code || "-"}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                                <span className="text-[10px] text-muted-foreground block font-semibold">NPSN</span>
                                                <span className="font-extrabold text-sm font-mono">{s.npsn || "-"}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                                <span className="text-[10px] text-muted-foreground block font-semibold">Jenjang</span>
                                                <span className="font-extrabold text-sm">{s.education_level || "-"}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                                <span className="text-[10px] text-muted-foreground block font-semibold">Akreditasi</span>
                                                <span className="font-extrabold text-sm">{s.accreditation || "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                onClick={() => setViewingSchool(s)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => handleOpenEdit(s)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                title="Edit Sekolah"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => setDeletingSchool(s)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                                title="Hapus Sekolah"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(s.created_at).toLocaleDateString("id-ID")}
                                        </span>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Create & Edit Modal */}
            <Dialog
                isOpen={isCreateOpen || editingSchool !== null}
                onClose={() => { setIsCreateOpen(false); setEditingSchool(null); }}
                title={editingSchool ? "Edit Sekolah" : "Registrasi Sekolah Mitra Baru"}
                description="Lengkapi data sekolah untuk didaftarkan sebagai mitra."
            >
                <form onSubmit={handleSave} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">Nama Sekolah *</label>
                            <input
                                type="text"
                                required
                                placeholder="SMA Negeri 1 Jakarta"
                                value={formData.school_name}
                                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Kode Sekolah *</label>
                            <input
                                type="text"
                                required
                                placeholder="SMAN1JKT"
                                value={formData.school_code}
                                onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">NPSN</label>
                            <input
                                type="text"
                                placeholder="20100001"
                                value={formData.npsn}
                                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Jenjang *</label>
                            <select
                                value={formData.education_level}
                                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                            >
                                <option value="SMA">SMA</option>
                                <option value="SMK">SMK</option>
                                <option value="SMP">SMP</option>
                                <option value="SD">SD</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold block mb-1">Alamat</label>
                        <input
                            type="text"
                            placeholder="Jl. Sudirman No. 1"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">Provinsi</label>
                            <input
                                type="text"
                                placeholder="DKI Jakarta"
                                value={formData.province}
                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Kota/Kab</label>
                            <input
                                type="text"
                                placeholder="Jakarta Pusat"
                                value={formData.regency}
                                onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Kecamatan</label>
                            <input
                                type="text"
                                placeholder="Menteng"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">Telepon</label>
                            <input
                                type="text"
                                placeholder="021-12345678"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="admin@sman1jakarta.sch.id"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">Kepala Sekolah</label>
                            <input
                                type="text"
                                placeholder="Dr. Budi Santoso, M.Pd"
                                value={formData.principal_name}
                                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Akreditasi</label>
                            <select
                                value={formData.accreditation}
                                onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                            >
                                <option value="">-- Pilih --</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="UNAKREDITASI">Unakreditasi</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsCreateOpen(false); setEditingSchool(null); }}
                            className="cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="font-bold cursor-pointer"
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            )}
                            {editingSchool ? "Simpan Perubahan" : "Registrasi Sekolah"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <Dialog
                isOpen={deletingSchool !== null}
                onClose={() => setDeletingSchool(null)}
                title="Konfirmasi Hapus Sekolah"
                description="Apakah Anda yakin ingin menghapus sekolah ini? Tindakan ini tidak dapat dibatalkan."
            >
                <div className="space-y-4 text-xs">
                    {deletingSchool && (
                        <div className="p-3 border rounded-lg bg-destructive/5 text-destructive font-semibold">
                            {deletingSchool.school_name} ({deletingSchool.school_code})
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => setDeletingSchool(null)} className="cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleDelete}
                            className="font-bold cursor-pointer"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Detail Preview Modal */}
            <Dialog
                isOpen={viewingSchool !== null}
                onClose={() => setViewingSchool(null)}
                title={viewingSchool?.school_name || "Detail Sekolah"}
                description={`${viewingSchool?.school_code || ""} • ${viewingSchool?.education_level || ""}`}
            >
                {viewingSchool && (
                    <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                            <Badge variant="outline" className="font-mono">{viewingSchool.school_code}</Badge>
                            <Badge variant={getStatusColor(viewingSchool.status) as any}>
                                {getStatusLabel(viewingSchool.status)}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">NPSN</span>
                                <span className="font-bold font-mono">{viewingSchool.npsn || "-"}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">Jenjang</span>
                                <span className="font-bold">{viewingSchool.education_level}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">Akreditasi</span>
                                <span className="font-bold">{viewingSchool.accreditation || "-"}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">Kepala Sekolah</span>
                                <span className="font-bold">{viewingSchool.principal_name || "-"}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] text-muted-foreground font-semibold">Alamat</div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border text-sm">
                                {viewingSchool.address || "-"}, {viewingSchool.district || ""}, {viewingSchool.regency || ""}, {viewingSchool.province || ""}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">Telepon</span>
                                <span className="font-bold">{viewingSchool.phone || "-"}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border">
                                <span className="text-[10px] text-muted-foreground block font-semibold">Email</span>
                                <span className="font-bold">{viewingSchool.email || "-"}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-2 border-t">
                            <span>Dibuat: {new Date(viewingSchool.created_at).toLocaleDateString("id-ID")}</span>
                            <span>Diupdate: {new Date(viewingSchool.updated_at).toLocaleDateString("id-ID")}</span>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
