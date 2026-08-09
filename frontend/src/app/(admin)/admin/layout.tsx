import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(admin)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}