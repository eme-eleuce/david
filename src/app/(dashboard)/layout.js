import Sidebar from "@/components/layout/Sidebar";
import DashboardMain from "@/components/layout/DashboardMain";
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
            <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
              <Sidebar />
              <DashboardMain>{children}</DashboardMain>
            </div>
          </SidebarNavProvider>
        </FiltrosProvider>
      </EmpresaProvider>
    </DataProvider>
  );
}
