import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(staff)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}