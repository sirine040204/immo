import { Sidebar } from "@/layout/sidebar/Sidebar";
import { Topbar } from "@/layout/header/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Subtle Background Grid layer */}
        <div className="absolute inset-0 z-0 bg-grid-pattern opacity-60 pointer-events-none"></div>
        
        <div className="z-10 flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
