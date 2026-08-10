// frontend/src/app/(siswa)/settings/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { User as UserIcon, Lock, Check, AlertCircle, Target as TargetIcon, Bell, Monitor } from "lucide-react";

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();

    const [fullName, setFullName] = useState(user?.full_name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [schoolName, setSchoolName] = useState(user?.school_name || "");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingPass, setSavingPass] = useState(false);
    const [passSuccess, setPassSuccess] = useState("");
    const [passError, setPassError] = useState("");

    const [notifToggle, setNotifToggle] = useState(true);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileSuccess("");
        setProfileError("");

        try {
            const updated = await authService.updateProfile({
                full_name: fullName,
                phone,
                school_name: schoolName,
            });
            updateUser(updated);
            setProfileSuccess("Profil berhasil diperbarui!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal memperbarui profil";
            setProfileError(msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return;

        setSavingPass(true);
        setPassSuccess("");
        setPassError("");

        try {
            await authService.changePassword(oldPassword, newPassword);
            setPassSuccess("Kata sandi berhasil diubah!");
            setOldPassword("");
            setNewPassword("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengubah kata sandi";
            setPassError(msg);
        } finally {
            setSavingPass(false);
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Konfigurasi</h1>
                    <p className="text-sm text-muted-foreground">Kelola profil, kata sandi, target, dan preferensi akun Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profil Sidebar */}
                    <Card className="md:col-span-1 flex flex-col items-center p-6 text-center">
                        <Avatar
                            src={user?.avatar_url}
                            fallback={user?.full_name?.charAt(0) || "U"}
                            size="xl"
                            className="mb-4"
                        />
                        <h2 className="font-heading font-semibold text-lg">{user?.full_name || "Pengguna"}</h2>
                        <p className="text-xs text-muted-foreground mb-2">{user?.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {user?.role || "SISWA"}
                        </span>
                        <nav className="w-full mt-6 space-y-1">
                            <Link href="#profil" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground">
                                <UserIcon className="h-4 w-4" /> Profil & Keamanan
                            </Link>
                            <Link href="#target" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 transition-colors">
                                <TargetIcon className="h-4 w-4" /> Target
                            </Link>
                            <Link href="#preferensi" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 transition-colors">
                                <Bell className="h-4 w-4" /> Preferensi
                            </Link>
                        </nav>
                    </Card>

                    <div className="md:col-span-2 space-y-6">
                        {/* Edit Profil */}
                        <Card id="profil">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-primary" /> Informasi Pribadi
                                </CardTitle>
                                <CardDescription>Perbarui nama dan kontak Anda.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    {profileSuccess && (
                                        <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2">
                                            <Check className="h-4 w-4" /> {profileSuccess}
                                        </div>
                                    )}
                                    {profileError && (
                                        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> {profileError}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold">Nama Lengkap</label>
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold">Nomor Telepon / WhatsApp</label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="08123456789"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold">Asal Sekolah</label>
                                        <Input
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            placeholder="SMA Negeri 1 Jakarta"
                                        />
                                    </div>

                                    <Button type="submit" disabled={savingProfile} className="rounded-xl">
                                        {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Ubah Kata Sandi */}
                        <Card id="keamanan">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-primary" /> Ubah Kata Sandi
                                </CardTitle>
                                <CardDescription>Pastikan kata sandi baru Anda aman.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    {passSuccess && (
                                        <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2">
                                            <Check className="h-4 w-4" /> {passSuccess}
                                        </div>
                                    )}
                                    {passError && (
                                        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> {passError}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold">Kata Sandi Lama</label>
                                        <Input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold">Kata Sandi Baru</label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <Button type="submit" disabled={savingPass} variant="outline" className="rounded-xl">
                                        {savingPass ? "Memproses..." : "Perbarui Kata Sandi"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Target */}
                        <Card id="target">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TargetIcon className="h-4 w-4 text-primary" /> Target PTN
                                </CardTitle>
                                <CardDescription>Atur perguruan tinggi dan jurusan impian untuk menghitung peluang.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href="/targets">
                                    <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                                        Kelola Target Sekarang
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Preferensi */}
                        <Card id="preferensi">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-primary" /> Preferensi
                                </CardTitle>
                                <CardDescription>Atur preferensi notifikasi dan tampilan.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <label className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium">Notifikasi push (pengumuman & jadwal)</span>
                                    <button
                                        type="button"
                                        onClick={() => setNotifToggle((v) => !v)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifToggle ? "bg-primary" : "bg-muted"}`}
                                        aria-pressed={notifToggle}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifToggle ? "translate-x-6" : "translate-x-1"}`} />
                                    </button>
                                </label>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}