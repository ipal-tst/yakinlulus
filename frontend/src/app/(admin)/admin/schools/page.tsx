// src/app/(admin)/admin/schools/page.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolsTab } from "./schools-tab";
import { TargetSchoolsTab } from "./target-schools-tab";
import { SchoolsImportTab } from "@/components/admin/schools/schools-import-tab";

const VALID_TABS = ["schools", "targets", "import"] as const;
type TabValue = (typeof VALID_TABS)[number];

function getTabFromParams(value: string | null): TabValue {
  return (VALID_TABS as readonly string[]).includes(value ?? "")
    ? (value as TabValue)
    : "schools";
}

export default function AdminSchoolsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getTabFromParams(searchParams.get("tab"));

  function handleTabChange(next: string) {
    const value = next as TabValue;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "schools") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Sekolah"
        description="Daftar sekolah/PT katalog dan target sekolah untuk acuan siswa."
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="schools" className="rounded-lg">Daftar Sekolah</TabsTrigger>
          <TabsTrigger value="targets" className="rounded-lg">Target Sekolah</TabsTrigger>
          <TabsTrigger value="import" className="rounded-lg">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="schools">
          <SchoolsTab />
        </TabsContent>
        <TabsContent value="targets">
          <TargetSchoolsTab />
        </TabsContent>
        <TabsContent value="import">
          <SchoolsImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}