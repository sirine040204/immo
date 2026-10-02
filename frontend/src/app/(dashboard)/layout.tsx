import { Sidebar } from "@/layout/sidebar/Sidebar";
import { Topbar } from "@/layout/header/Topbar";
import { AuthGuard } from "@/core/auth/AuthGuard";
import { SidebarProvider } from "@/layout/SidebarContext";
import { CommandPalette } from "@/shared/components/CommandPalette";

import { CompanyCompletionAlert } from "@/features/accounts/components/CompanyCompletionAlert";
import { AiChatWidget } from "@/shared/components/ui/AiChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden relative bg-slate-50/30">
            {/* Subtle Background Grid layer */}
            <div className="absolute inset-0 z-0 bg-grid-pattern opacity-60 pointer-events-none mix-blend-multiply" />
            
            {/* Ambient glowing effects for premium feel */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-green/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

            <div className="z-10 flex flex-col flex-1 overflow-hidden">
              <CompanyCompletionAlert />
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {children}
              </main>
            </div>
          </div>
          
          <AiChatWidget />
          <CommandPalette />
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
