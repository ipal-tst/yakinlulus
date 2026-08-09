import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(investor)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}