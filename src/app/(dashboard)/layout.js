import DashboardShell from "@/components/layout/DashboardShell";
import { SidebarNavProvider } from "@/components/layout/SidebarNavContext";
import { EmpresaProvider } from "@/components/empresas/EmpresaProvider";
import { FiltrosProvider } from "@/components/filtros/FiltrosProvider";
import { DataProvider } from "@/components/data/DataProvider";

export default function DashboardLayout({ children }) {
  return (
    <DataProvider>
      <EmpresaProvider>
        <FiltrosProvider>
          <SidebarNavProvider>
            <DashboardShell>{children}</DashboardShell>
          </SidebarNavProvider>
        </FiltrosProvider>
      </EmpresaProvider>
    </DataProvider>
  );
}
