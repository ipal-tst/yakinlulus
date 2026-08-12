"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/admin/users/UsersTab";
import { RolesTab } from "@/components/admin/users/RolesTab";

const VALID_TABS = ["users", "roles"] as const;
type TabValue = (typeof VALID_TABS)[number];

function getTabFromParams(value: string | null): TabValue {
  return (VALID_TABS as readonly string[]).includes(value ?? "")
    ? (value as TabValue)
    : "users";
}

export default function AdminUserManagementPage() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const activeTab = getTabFromParams(searchParams.get("tab"));

    function handleTabChange(next: string) {
        const value = next as TabValue;
        const params = new URLSearchParams(searchParams.toString());
        if (value === "users") {
            params.delete("tab");
        } else {
            params.set("tab", value);
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Manajemen Pengguna (User Management)"
                description="Kelola semua akun pengguna platform: Siswa, Guru, Staff, Finance, Investor, dan Super Admin."
            />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="rounded-xl">
                    <TabsTrigger value="users" className="rounded-lg">Pengguna</TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-lg">Role & Akses</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="roles">
                    <RolesTab canManage={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
