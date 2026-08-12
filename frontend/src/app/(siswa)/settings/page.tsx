// frontend/src/app/(siswa)/settings/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import {
    User as UserIcon,
    Lock,
    Check,
    AlertCircle,
    Target as TargetIcon,
    Monitor,
    Camera,
    UploadCloud,
    ShieldCheck,
    Moon,
    ArrowRight,
} from "lucide-react";
import { User } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

interface EducationLevelOption {
    id: string;
    name: string;
    code: string;
    display_order: number;
    is_active: boolean;
}

interface GradeOption {
    id: string;
    education_level_id: string;
    level_code: string;
    name: string;
    alias?: string;
    display_order: number;
    is_active: boolean;
}

function isStrongPassword(pw: string): boolean {
    return (
        pw.length >= 10 &&
        /[A-Z]/.test(pw) &&
        /[a-z]/.test(pw) &&
        /[0-9]/.test(pw) &&
        /[^A-Za-z0-9]/.test(pw)
    );
}

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);

    // Profil
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [schoolName, setSchoolName] = useState(user?.school_name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [gender, setGender] = useState<string | null>(user?.gender || null);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
    const [levels, setLevels] = useState<EducationLevelOption[]>([]);
    const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
    const [grades, setGrades] = useState<GradeOption[]>([]);
    const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    // Avatar upload
    const [uploading, setUploading] = useState(false);
    const [avatarStatus, setAvatarStatus] = useState("");
    const [avatarError, setAvatarError] = useState("");

    // Kata Sandi
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passFieldErrors, setPassFieldErrors] = useState<{ new?: string; confirm?: string }>({});
    const [savingPass, setSavingPass] = useState(false);
    const [passSuccess, setPassSuccess] = useState("");
    const [passError, setPassError] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                const [me, levelOptions] = await Promise.all([
                    authService.getMe(),
                    authService.getEducationLevels(),
                ]);
                if (cancelled) return;
                setFullName(me.full_name || "");
                setSchoolName(me.school_name || "");
                setPhone(me.phone || "");
                setGender(me.gender || null);
                setAvatarUrl(me.avatar_url || "");
                setLevels(levelOptions);
                setSelectedGradeId(me.grade_id || null);

                const currentLevel = levelOptions.find(
                    (l) => l.code === (me.education_level || "").toUpperCase()
                );
                if (currentLevel) {
                    setSelectedLevelId(currentLevel.id);
                    try {
                        const gradeOptions = await authService.getGradesByLevel(currentLevel.id);
                        if (cancelled) return;
                        setGrades(gradeOptions);
                    } catch {
                        if (cancelled) return;
                        setGrades([]);
                    }
                }
            } catch {
                // Keep store data as fallback when getMe fails
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        init();
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleLevelChange(value: string | null) {
        setSelectedLevelId(value);
        setSelectedGradeId(null);
        setGrades([]);
        if (!value) return;
        try {
            const gradeOptions = await authService.getGradesByLevel(value);
            setGrades(gradeOptions);
        } catch {
            setGrades([]);
        }
    }

    async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setAvatarError("Hanya file JPG/PNG yang diperbolehkan.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setAvatarError("Ukuran file maksimal 2 MB.");
            return;
        }

        setUploading(true);
        setAvatarError("");
        setAvatarStatus("");
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("yl_token") : null;
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_BASE}/media/upload`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData,
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json || json.success === false) {
                throw new Error(json?.message || "Gagal mengunggah foto");
            }
            const url = json.data?.url as string | undefined;
            if (!url) throw new Error("Respon upload tidak valid");
            setAvatarUrl(url);
            setAvatarStatus("Foto berhasil diunggah. Klik Simpan Perubahan untuk menerapkan.");
        } catch (err) {
            setAvatarError(err instanceof Error ? err.message : "Gagal mengunggah foto");
        } finally {
            setUploading(false);
        }
    }

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault();
        setSavingProfile(true);
        setProfileSuccess("");
        setProfileError("");

        const selectedLevel = levels.find((l) => l.id === selectedLevelId) || null;
        const payload: Partial<User> = {
            full_name: fullName.trim(),
            avatar_url: avatarUrl || undefined,
            gender: gender || undefined,
        };
        if (schoolName.trim()) payload.school_name = schoolName.trim();
        if (phone.trim()) payload.phone = phone.trim();
        if (selectedGradeId) payload.grade_id = selectedGradeId;
        if (selectedLevel) payload.education_level = selectedLevel.code;

        try {
            await authService.updateProfile(payload);
            const fresh = await authService.getMe();
            updateUser(fresh);
            setFullName(fresh.full_name || "");
            setSchoolName(fresh.school_name || "");
            setPhone(fresh.phone || "");
            setGender(fresh.gender || null);
            setAvatarUrl(fresh.avatar_url || "");
            setSelectedGradeId(fresh.grade_id || null);
            setProfileSuccess("Profil berhasil disimpan!");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal menyimpan profil";
            setProfileError(msg);
        } finally {
            setSavingProfile(false);
        }
    }

    function validatePasswords(): boolean {
        const errors: { new?: string; confirm?: string } = {};
        if (!isStrongPassword(newPassword)) {
            errors.new =
                "Minimal 10 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.";
        }
        if (confirmPassword !== newPassword) {
            errors.confirm = "Konfirmasi kata sandi tidak cocok.";
        }
        setPassFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPassSuccess("");
        setPassError("");
        if (!validatePasswords()) return;

        setSavingPass(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            setPassSuccess("Kata sandi berhasil diperbarui!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPassFieldErrors({});
        } catch (err) {
            setPassError(err instanceof Error ? err.message : "Gagal mengubah kata sandi");
        } finally {
            setSavingPass(false);
        }
    }

    const displayName = fullName || user?.full_name || "Pengguna";

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Konfigurasi</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola profil, kata sandi, target, dan preferensi akun Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar Profile */}
                    <div className="md:col-span-1">
                        {loading ? (
                            <Skeleton className="h-80 w-full rounded-2xl" />
                        ) : (
                            <Card className="flex flex-col items-center p-6 text-center">
                                <Avatar
                                    src={avatarUrl || undefined}
                                    fallback={displayName.charAt(0) || "U"}
                                    size="xl"
                                    className="mb-4"
                                />
                                <h2 className="font-heading font-semibold text-lg">{displayName}</h2>
                                <p className="text-xs text-muted-foreground mb-2">{user?.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                    {user?.role || "SISWA"}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleAvatarFileChange}
                                    className="hidden"
                                    aria-label="Unggah foto profil"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 rounded-xl"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploading ? (
                                        <UploadCloud className="h-4 w-4" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                    {uploading ? "Mengunggah..." : "Ubah Foto"}
                                </Button>
                                {avatarError && (
                                    <p className="mt-2 text-xs text-red-600">{avatarError}</p>
                                )}
                                <nav className="w-full mt-6 space-y-1">
                                    <Link
                                        href="#profil"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground"
                                    >
                                        <UserIcon className="h-4 w-4" /> Profil &amp; Keamanan
                                    </Link>
                                    <Link
                                        href="#target"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
                                    >
                                        <TargetIcon className="h-4 w-4" /> Target
                                    </Link>
                                    <Link
                                        href="#preferensi"
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
                                    >
                                        <Monitor className="h-4 w-4" /> Preferensi
                                    </Link>
                                </nav>
                            </Card>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {loading ? (
                            <>
                                <Skeleton className="h-96 w-full rounded-2xl" />
                                <Skeleton className="h-72 w-full rounded-2xl" />
                                <Skeleton className="h-40 w-full rounded-2xl" />
                                <Skeleton className="h-40 w-full rounded-2xl" />
                            </>
                        ) : (
                            <>
                                {/* Profil */}
                                <Card id="profil">
                                    <CardHeader>
                                        <SectionHeader
                                            title="Profil"
                                            subtitle="Perbarui informasi pribadi dan pengaturan belajar Anda."
                                            icon={UserIcon}
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                                            {profileSuccess && (
                                                <div className="p-3 rounded-xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-xs flex items-center gap-2">
                                                    <Check className="h-4 w-4" /> {profileSuccess}
                                                </div>
                                            )}
                                            {profileError && (
                                                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 text-xs flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" /> {profileError}
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Foto Profil
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <Avatar
                                                        src={avatarUrl || undefined}
                                                        fallback={displayName.charAt(0) || "U"}
                                                        size="lg"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl"
                                                        disabled={uploading}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        {uploading ? (
                                                            <UploadCloud className="h-4 w-4" />
                                                        ) : (
                                                            <Camera className="h-4 w-4" />
                                                        )}
                                                        {uploading ? "Mengunggah..." : "Ubah Foto"}
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground">
                                                        JPG/PNG, maks 2 MB.
                                                    </p>
                                                </div>
                                                {avatarError && (
                                                    <p className="text-xs text-red-600">{avatarError}</p>
                                                )}
                                                {avatarStatus && (
                                                    <p className="text-xs text-green-700 dark:text-green-400">
                                                        {avatarStatus}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    URL Foto Profil (opsional)
                                                </label>
                                                <Input
                                                    value={avatarUrl}
                                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                                    placeholder="https://.../avatar.jpg"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Nama Lengkap <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Nama kamu"
                                                    required
                                                    maxLength={200}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Email
                                                </label>
                                                <Input value={user?.email || ""} readOnly disabled />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Asal Sekolah
                                                </label>
                                                <Input
                                                    value={schoolName}
                                                    onChange={(e) => setSchoolName(e.target.value)}
                                                    placeholder="SMA Negeri 1 Jakarta"
                                                    maxLength={200}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Jenjang
                                                    </label>
                                                    <Select
                                                        value={selectedLevelId}
                                                        onValueChange={handleLevelChange}
                                                    >
                                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                                            <SelectValue placeholder="Pilih jenjang" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Jenjang</SelectLabel>
                                                                {levels.map((lvl) => (
                                                                    <SelectItem key={lvl.id} value={lvl.id}>
                                                                        {lvl.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Kelas (opsional)
                                                    </label>
                                                    <Select
                                                        value={selectedGradeId}
                                                        onValueChange={setSelectedGradeId}
                                                        disabled={!selectedLevelId}
                                                    >
                                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                                            <SelectValue
                                                                placeholder={
                                                                    selectedLevelId
                                                                        ? "Pilih kelas"
                                                                        : "Pilih jenjang dulu"
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Kelas</SelectLabel>
                                                                {grades.map((g) => (
                                                                    <SelectItem key={g.id} value={g.id}>
                                                                        {g.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Jenis Kelamin
                                                    </label>
                                                    <Select value={gender} onValueChange={setGender}>
                                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                                            <SelectValue placeholder="Pilih jenis kelamin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Jenis Kelamin</SelectLabel>
                                                                <SelectItem value="M">Laki-laki</SelectItem>
                                                                <SelectItem value="F">Perempuan</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Nomor HP (opsional)
                                                    </label>
                                                    <Input
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="08123456789"
                                                        maxLength={20}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={savingProfile}
                                                className="rounded-xl"
                                            >
                                                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Ubah Kata Sandi */}
                                <Card id="keamanan">
                                    <CardHeader>
                                        <SectionHeader
                                            title="Ubah Kata Sandi"
                                            subtitle="Minimal 10 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol."
                                            icon={Lock}
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleChangePassword} className="space-y-4">
                                            {passSuccess && (
                                                <div className="p-3 rounded-xl bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-xs flex items-center gap-2">
                                                    <Check className="h-4 w-4" /> {passSuccess}
                                                </div>
                                            )}
                                            {passError && (
                                                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 text-xs flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" /> {passError}
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Kata Sandi Lama
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                    autoComplete="current-password"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Kata Sandi Baru
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Minimal 10 karakter"
                                                />
                                                {passFieldErrors.new && (
                                                    <p className="text-xs text-red-600">
                                                        {passFieldErrors.new}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Konfirmasi Kata Sandi Baru
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                    placeholder="Ulangi kata sandi baru"
                                                />
                                                {passFieldErrors.confirm && (
                                                    <p className="text-xs text-red-600">
                                                        {passFieldErrors.confirm}
                                                    </p>
                                                )}
                                            </div>

                                            <Button
                                                type="submit"
                                                variant="outline"
                                                disabled={savingPass}
                                                className="rounded-xl"
                                            >
                                                {savingPass ? "Memproses..." : "Perbarui Kata Sandi"}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Target */}
                                <Card id="target">
                                    <CardHeader>
                                        <SectionHeader
                                            title="Target"
                                            subtitle="Atur sekolah tujuan dan lihat estimasi peluangmu."
                                            icon={TargetIcon}
                                        />
                                    </CardHeader>
                                    <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Kelola target sekolah tujuanmu untuk memantau peluang kelulusan.
                                        </p>
                                        <Button asChild className="rounded-xl shrink-0">
                                            <Link href="/targets">
                                                Kelola Target <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Preferensi */}
                                <Card id="preferensi">
                                    <CardHeader>
                                        <SectionHeader
                                            title="Preferensi"
                                            subtitle="Preferensi tampilan dan langganan Anda."
                                            icon={Monitor}
                                        />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                                            <Moon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <p className="text-sm text-muted-foreground">
                                                Mode gelap dapat diatur lewat tombol di pojok kanan atas.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
                                            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <p className="text-sm text-muted-foreground">
                                                Atur langganan dan perpanjangan otomatis di halaman{" "}
                                                <Link
                                                    href="/membership"
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    Membership
                                                </Link>
                                                .
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}