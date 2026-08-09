// src/app/(admin)/admin/schools/page.tsx
"use client";

import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolsTab } from "./schools-tab";
import { TargetSchoolsTab } from "./target-schools-tab";

export default function AdminSchoolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Sekolah"
        description="Daftar sekolah/PT katalog dan target sekolah untuk acuan siswa."
      />
      <Tabs defaultValue="schools" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="schools" className="rounded-lg">Daftar Sekolah</TabsTrigger>
          <TabsTrigger value="targets" className="rounded-lg">Target Sekolah</TabsTrigger>
        </TabsList>
        <TabsContent value="schools">
          <SchoolsTab />
        </TabsContent>
        <TabsContent value="targets">
          <TargetSchoolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}