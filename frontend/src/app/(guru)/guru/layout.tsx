import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(guru)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}