"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/providers/AuthProvider";
import {
    useMyTargets,
    useSaveTargets,
    useMyCertificates,
    useNotifications,
    useNotificationPreferences,
    useUpdateNotificationPreference,
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useChangePassword,
    useUpdateProfile,
    useTargetSchools,
    useGrades,
    type TargetSchool,
    type EnrichedTarget,
    type SaveTargetInput,
    type Certificate,
    type NotificationItem,
    type NotificationPreference,
} from "@/lib/api";
import {
    Target,
    Award,
    Download,
    Settings,
    CheckCircle2,
    Shield,
    ChevronRight,
    Bell,
    KeyRound,
    LogOut,
    User as UserIcon,
    Medal,
    FileSpreadsheet,
    TrendingUp,
    Mail,
    X,
    Loader2,
} from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
    in_app: "Notifikasi Dalam Aplikasi",
    email: "Email",
    whatsapp: "WhatsApp",
    push: "Push Notification",
};

export default function StudentProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const targetsQuery = useMyTargets();
    const certsQuery = useMyCertificates();
    const gradesQuery = useGrades() as any;
    const grades: any[] = Array.isArray(gradesQuery.data) ? gradesQuery.data : [];

    const [activeDialog, setActiveDialog] = React.useState<
        null | "edit" | "password" | "targets" | "notifications" | "certificates"
    >(null);

    const fullName = user?.full_name || "Murid Belajar";
    const email = user?.email || "murid@yakinlulus.id";
    const role = user?.role || "STUDENT";
    const initial = fullName.charAt(0).toUpperCase();

    // Stats with real data + fallback
    const targets = targetsQuery.data ?? [];
    const certs = certsQuery.data ?? [];

    const bestPct = certs.length > 0 ? Math.max(...certs.map((c) => c.percent)) : 0;
    const stats = [
        { icon: FileSpreadsheet, value: `${certs.length}`, label: "Tryout Selesai" },
        { icon: TrendingUp, value: `${bestPct > 0 ? Math.round(bestPct) : "—"}%`, label: "Nilai Terbaik" },
        { icon: Medal, value: targets.length ? targets[0]?.threshold_state : "BELUM", label: "Target Sekolah" },
    ];

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">PROFIL</Badge>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Profil Saya</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola data akun, target PTN, dan sertifikat Tryout-mu.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs font-semibold shrink-0" onClick={() => setActiveDialog("edit")}>
                    <Settings className="mr-2 h-3.5 w-3.5" /> Pengaturan
                </Button>
            </div>

            {/* Identitas + stat */}
            <Card className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                    {user?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt={fullName} className="h-20 w-20 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary font-black text-3xl flex items-center justify-center shrink-0">
                            {initial}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-xl font-extrabold truncate">{fullName}</h2>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] uppercase">{role}</Badge>
                            <Badge variant="success" className="text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Terverifikasi
                            </Badge>
                            {user?.gender && <Badge variant="outline" className="text-[10px]">{user.gender === "L" ? "Laki-laki" : "Perempuan"}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {user?.phone && <span className="text-[11px] text-muted-foreground">{user.phone}</span>}
                            {user?.grade_id && <span className="text-[11px] text-muted-foreground">{grades?.find((g: any) => g.id === user.grade_id)?.name}</span>}
                            {user?.major && <span className="text-[11px] text-muted-foreground">Jurusan {user.major}</span>}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 bg-muted/60 rounded-xl p-3 text-center">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center">
                            <stat.icon className="h-4 w-4 text-primary mb-1" />
                            <span className="text-base font-extrabold">{stat.value}</span>
                            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Target belajar + status akses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-1.5">
                            <Target className="h-4 w-4 text-primary" /> Target Sekolah & Jurusan Impian
                        </h3>
                        <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => setActiveDialog("targets")}>
                            <Settings className="mr-1.5 h-3.5 w-3.5" /> Ubah
                        </Button>
                    </div>
                    {targets.length === 0 ? (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
                            Belum ada target. Klik <span className="font-semibold text-primary">Ubah</span> untuk menambahkan target sekolah & jurusan impianmu.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {targets.map((t) => {
                                const pct = t.has_score_data ? Math.min(100, Math.round(t.progress_pct)) : 0;
                                return (
                                    <div key={t.id} className={`p-4 rounded-xl border space-y-2 ${t.choice === 1 ? "bg-primary/5 border-primary/20" : ""}`}>
                                        <div className="flex items-center justify-between">
                                            <Badge variant={t.choice === 1 ? "default" : "outline"} className="text-[10px]">
                                                {t.choice === 1 ? "PILIHAN 1 (UTAMA)" : "PILIHAN 2"} • {t.target_type}
                                            </Badge>
                                            <Badge variant={t.threshold_state === "PASSED" ? "success" : t.threshold_state === "BELOW" ? "warning" : "secondary"} className="text-[10px]">
                                                {t.threshold_state === "PASSED" ? "LULUS" : t.threshold_state === "BELOW" ? "KURANG" : "BELUM"}
                                            </Badge>
                                        </div>
                                        <h4 className="font-extrabold text-sm text-foreground">{t.school_name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {t.major || (t.subjects.length ? t.subjects.join(" • ") : "")}
                                            {t.max_score ? ` • Ambang: ${t.min_score}-${t.max_score}` : ""}
                                        </p>
                                        {t.has_score_data ? (
                                            <>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${t.threshold_state === "PASSED" ? "bg-success" : "bg-primary"}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold">
                                                    <span className="text-muted-foreground">Nilai kamu: {t.student_score}</span>
                                                    <span className={t.threshold_state === "PASSED" ? "text-success" : "text-primary"}>{pct}%</span>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">{t.motivational}</p>
                                        )}
                                        <p className={`text-xs font-semibold ${t.threshold_state === "PASSED" ? "text-success" : t.threshold_state === "BELOW" ? "text-warning-foreground" : "text-muted-foreground"}`}>
                                            {t.motivational}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card className="p-5 space-y-4 border-warning/30 bg-warning/5">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-warning-foreground">
                            <Shield className="h-4 w-4 text-warning" /> Status Akses Pembelajaran
                        </h3>
                        <div>
                            <h4 className="font-extrabold text-base">Super App Ultra Pass</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Akses penuh Modul & CBT Engine</p>
                        </div>
                        <ul className="text-xs space-y-1.5 text-muted-foreground font-mono">
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Akses 100+ Modul Video HD</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> AI Tutor 24/7 Unlimited</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tryout CBT SNBT Nasional</li>
                        </ul>
                    </Card>

                    <Card className="p-5 space-y-3">
                        <h3 className="font-bold text-xs flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-primary" /> Sertifikat Kelulusan Tryout
                        </h3>
                        {certs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Belum ada sertifikat. Selesaikan tryout untuk mendapatkannya.</p>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold" onClick={() => setActiveDialog("certificates")}>
                                    <span>{certs.length} Sertifikat Tersedia</span>
                                    <Download className="h-3.5 w-3.5 text-primary" />
                                </Button>
                            </>
                        )}
                    </Card>
                </div>
            </div>

            {/* Pengaturan */}
            <Card className="p-2">
                <div className="divide-y divide-border px-2">
                    <SettingRow icon={Bell} label="Notifikasi & Pengingat" onClick={() => setActiveDialog("notifications")} />
                    <SettingRow icon={KeyRound} label="Ubah Kata Sandi" onClick={() => setActiveDialog("password")} />
                    <SettingRow icon={Target} label="Target & Prioritas" onClick={() => setActiveDialog("targets")} />
                    <SettingRow icon={LogOut} label="Keluar" danger onClick={handleLogout} />
                </div>
            </Card>

            <EditProfileDialog isOpen={activeDialog === "edit"} onClose={() => setActiveDialog(null)} />
            <ChangePasswordDialog isOpen={activeDialog === "password"} onClose={() => setActiveDialog(null)} />
            <TargetsDialog isOpen={activeDialog === "targets"} onClose={() => setActiveDialog(null)} targets={targets} />
            <NotificationsDialog isOpen={activeDialog === "notifications"} onClose={() => setActiveDialog(null)} />
            <CertificatesDialog isOpen={activeDialog === "certificates"} onClose={() => setActiveDialog(null)} certificates={certs} />
        </div>
    );
}

function SettingRow({ icon: Icon, label, danger, onClick }: { icon: any; label: string; danger?: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex justify-between items-center py-3 text-left cursor-pointer"
        >
            <span className={`flex items-center gap-3 text-sm font-semibold ${danger ? "text-danger" : ""}`}>
                <Icon className={`h-4 w-4 ${danger ? "text-danger" : "text-primary"}`} />
                {label}
            </span>
            <ChevronRight className={`h-4 w-4 ${danger ? "text-danger/50" : "text-muted-foreground"}`} />
        </button>
    );
}

function EditProfileDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user, refetch } = useAuth();
    const updateProfile = useUpdateProfile();
    const gradesQuery = useGrades() as any;
    const grades: any[] = Array.isArray(gradesQuery.data) ? gradesQuery.data : [];

    const [fullName, setFullName] = React.useState(user?.full_name || "");
    const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || "");
    const [school, setSchool] = React.useState(user?.school_name || "");
    const [gender, setGender] = React.useState(user?.gender || "");
    const [phone, setPhone] = React.useState(user?.phone || "");
    const [gradeId, setGradeId] = React.useState(user?.grade_id || "");
    const [major, setMajor] = React.useState(user?.major || "");
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setFullName(user?.full_name || "");
        setAvatarUrl(user?.avatar_url || "");
        setSchool(user?.school_name || "");
        setGender(user?.gender || "");
        setPhone(user?.phone || "");
        setGradeId(user?.grade_id || "");
        setMajor(user?.major || "");
    }, [user, isOpen]);

    const selectedGrade = grades.find((g) => g.id === gradeId);
    const isSmaSmk = selectedGrade?.level_code === "SMA" || selectedGrade?.level_code === "SMK";

    const submit = async () => {
        setError(null);
        if (!fullName.trim()) return setError("Nama lengkap wajib diisi");
        if (phone.length > 20) return setError("Nomor HP maksimal 20 karakter");
        const payload: {
            full_name?: string;
            avatar_url?: string;
            school_name?: string;
            gender?: string;
            phone?: string;
            major?: string;
            grade_id?: string;
        } = { full_name: fullName, avatar_url: avatarUrl, school_name: school };
        if (gender) payload.gender = gender;
        if (phone) payload.phone = phone;
        if (gradeId) payload.grade_id = gradeId;
        if (isSmaSmk && major) payload.major = major;
        try {
            await updateProfile.mutateAsync(payload);
            await refetch();
            onClose();
        } catch (e: any) {
            setError(e.message || "Gagal menyimpan profil");
        }
    };

    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit Profil" description="Lengkapi data dirimu.">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Lengkap *</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">No HP (opsional)</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jenis Kelamin (opsional)</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                        <option value="">Pilih jenis kelamin</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kelas (opsional)</label>
                    <select value={gradeId} onChange={(e) => { setGradeId(e.target.value); if (!isSmaSmk) setMajor(""); }} className={selectClass}>
                        <option value="">Pilih kelas</option>
                        {grades.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                {isSmaSmk && (
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jurusan</label>
                        <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectClass}>
                            <option value="">Pilih jurusan</option>
                            <option value="IPA">IPA</option>
                            <option value="IPS">IPS</option>
                            <option value="BAHASA">Bahasa</option>
                            <option value="OLAHRAGA">Olahraga</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sekolah (opsional)</label>
                    <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nama sekolah" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">URL Foto Profil (opsional)</label>
                    <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                    <Input value={user?.email || ""} disabled />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button size="sm" className="w-full" onClick={submit} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Simpan Perubahan
                </Button>
            </div>
        </Dialog>
    );
}

function ChangePasswordDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const changePassword = useChangePassword();
    const [current, setCurrent] = React.useState("");
    const [next, setNext] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setCurrent(""); setNext(""); setConfirm(""); setError(null); setSuccess(false);
        }
    }, [isOpen]);

    const submit = async () => {
        setError(null);
        if (next.length < 10) return setError("Kata sandi baru minimal 10 karakter");
        if (next !== confirm) return setError("Konfirmasi kata sandi tidak cocok");
        try {
            await changePassword.mutateAsync({ current_password: current, new_password: next });
            setSuccess(true);
            setTimeout(onClose, 1200);
        } catch (e: any) {
            setError(e.message || "Gagal mengubah kata sandi");
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Ubah Kata Sandi" description="Masukkan kata sandi saat ini dan kata sandi baru.">
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kata Sandi Saat Ini</label>
                    <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••••" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kata Sandi Baru</label>
                    <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 10 karakter, ada huruf besar, angka & simbol" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Konfirmasi Kata Sandi Baru</label>
                    <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi kata sandi baru" />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                {success && <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Kata sandi berhasil diubah</p>}
                <Button size="sm" className="w-full" onClick={submit} disabled={changePassword.isPending}>
                    {changePassword.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                    Ubah Kata Sandi
                </Button>
            </div>
        </Dialog>
    );
}

function TargetsDialog({ isOpen, onClose, targets }: { isOpen: boolean; onClose: () => void; targets: EnrichedTarget[] }) {
    const targetType: "SMP" | "SMA" | "UNIVERSITY" = targets[0]?.target_type || "UNIVERSITY";
    const schoolsQuery = useTargetSchools(targetType);
    const schools: TargetSchool[] = schoolsQuery.data ?? [];
    const saveTargets = useSaveTargets();

    const [choices, setChoices] = React.useState<Array<{ choice: number; schoolId: string; schoolName: string; major: string; passing: string }>>([
        { choice: 1, schoolId: "", schoolName: "", major: "", passing: "" },
        { choice: 2, schoolId: "", schoolName: "", major: "", passing: "" },
    ]);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setChoices([1, 2].map((c) => {
                const found = targets.find((t) => t.choice === c);
                return {
                    choice: c,
                    schoolId: found?.target_school_id || "",
                    schoolName: found?.school_name || "",
                    major: found?.major || "",
                    passing: found?.passing_score_irt ? String(found.passing_score_irt) : "",
                };
            }));
        }
    }, [isOpen, targets]);

    const setField = (index: number, field: keyof typeof choices[number], value: string) =>
        setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

    const selectSchool = (index: number, schoolId: string) => {
        const school = schools.find((s) => s.id === schoolId);
        setChoices((prev) => prev.map((c, i) =>
            i === index ? { ...c, schoolId, schoolName: school?.name || "" } : c));
    };

    const submit = async () => {
        setError(null);
        const valid = choices.filter((c) => c.schoolId || c.schoolName.trim());
        if (valid.length === 0) return setError("Pilih minimal satu sekolah");
        try {
            await saveTargets.mutateAsync(
                valid.map((c) => {
                    const item: SaveTargetInput = {
                        choice: c.choice,
                        school_name: c.schoolName.trim(),
                    };
                    if (c.schoolId) item.target_school_id = c.schoolId;
                    if (targetType === "UNIVERSITY") {
                        if (c.major.trim()) item.major = c.major.trim();
                        if (c.passing) item.passing_score_irt = Number(c.passing);
                    }
                    return item;
                })
            );
            onClose();
        } catch (e: any) {
            setError(e.message || "Gagal menyimpan target");
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Target Sekolah & Jurusan" description={`Jenjang target: ${targetType === "UNIVERSITY" ? "Universitas" : targetType}`}>
            <div className="space-y-4">
                <div className="rounded-xl border bg-primary/5 border-primary/20 p-3">
                    <p className="text-xs font-semibold text-primary">Jenjang target kamu: {targetType === "UNIVERSITY" ? "Universitas (PTN)" : `Sekolah ${targetType}`}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Diturunkan otomatis dari kelasmu. Pilih sekolah & jurusan impian dari daftar.</p>
                </div>
                {choices.map((c, i) => {
                    const selectedSchool = schools.find((s) => s.id === c.schoolId);
                    return (
                        <div key={c.choice} className="space-y-2 rounded-xl border p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {c.choice === 1 ? "Pilihan 1 (Utama)" : "Pilihan 2"}
                            </p>
                            <select
                                value={c.schoolId}
                                onChange={(e) => selectSchool(i, e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Pilih sekolah...</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.max_score ? `(${s.min_score}-${s.max_score})` : ""}
                                    </option>
                                ))}
                            </select>
                            {selectedSchool && (
                                <p className="text-[11px] text-muted-foreground">
                                    Ambang nilai: {selectedSchool.min_score ?? "-"} - {selectedSchool.max_score ?? "-"}
                                </p>
                            )}
                            {targetType === "UNIVERSITY" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <Input value={c.major} onChange={(e) => setField(i, "major", e.target.value)} placeholder="Jurusan" />
                                    <Input value={c.passing} onChange={(e) => setField(i, "passing", e.target.value)} placeholder="Passing grade IRT" type="number" />
                                </div>
                            )}
                        </div>
                    );
                })}
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button size="sm" className="w-full" onClick={submit} disabled={saveTargets.isPending}>
                    {saveTargets.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                    Simpan Target
                </Button>
            </div>
        </Dialog>
    );
}

function NotificationsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const notifsQuery = useNotifications();
    const prefsQuery = useNotificationPreferences();
    const updatePref = useUpdateNotificationPreference();
    const markAllRead = useMarkAllNotificationsRead();
    const markRead = useMarkNotificationRead();

    const notifs: NotificationItem[] = notifsQuery.data ?? [];
    const prefs: NotificationPreference[] = prefsQuery.data ?? [];

    const unread = notifs.filter((n) => n.status === "UNREAD").length;

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Notifikasi & Pengingat" description={`${unread} belum dibaca`}>
            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saluran Pengingat</p>
                        {unread > 0 && (
                            <button className="text-[11px] font-semibold text-primary cursor-pointer" onClick={() => markAllRead.mutate()}>
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {(prefs.length > 0
                            ? prefs
                            : ["in_app", "email", "push"].map((ch) => ({ id: ch, channel: ch, enabled: true, user_id: "" }))
                        ).map((p) => (
                            <div key={p.channel} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <span className="flex items-center gap-2 text-xs font-semibold">
                                    <Mail className="h-3.5 w-3.5 text-primary" /> {CHANNEL_LABELS[p.channel] || p.channel}
                                </span>
                                <button
                                    type="button"
                                    aria-pressed={p.enabled}
                                    onClick={() => updatePref.mutate({ channel: p.channel, enabled: !p.enabled })}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${p.enabled ? "bg-primary" : "bg-muted"} cursor-pointer`}
                                >
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${p.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pesan Masuk</p>
                    {notifs.length === 0 ? (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-4">Belum ada notifikasi.</p>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {notifs.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => markRead.mutate(n.id)}
                                    className={`w-full text-left rounded-xl border p-3 cursor-pointer ${n.status === "UNREAD" ? "bg-primary/5 border-primary/20" : "bg-card"}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-bold">{n.title}</p>
                                        {n.status === "UNREAD" && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-0.5" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                        {new Date(n.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
}

function CertificatesDialog({ isOpen, onClose, certificates }: { isOpen: boolean; onClose: () => void; certificates: Certificate[] }) {
    const download = (id: string) => {
        window.open(`/api/v1/profile/certificates/${id}/download`, "_blank");
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Sertifikat Tryout" description="Unduh sertifikat untuk dicetak atau disimpan sebagai PDF.">
            <div className="space-y-2">
                {certificates.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
                        Belum ada sertifikat. Selesaikan tryout CBT untuk mendapatkan sertifikat pencapaian.
                    </p>
                ) : (
                    certificates.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-xl border p-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{c.title}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    Skor {c.percent.toFixed(1)}% • Peringkat #{c.rank} dari {c.total} •{" "}
                                    {new Date(c.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-3 shrink-0 text-xs font-semibold" onClick={() => download(c.id)}>
                                <Download className="h-3.5 w-3.5" /> Unduh
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </Dialog>
    );
}
