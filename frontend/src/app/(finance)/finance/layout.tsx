import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(finance)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}