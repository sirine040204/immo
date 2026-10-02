import React from "react";
import { GuestGuard } from "@/core/auth/GuestGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <div className="min-h-screen flex">

        {/* ── Left panel: full-height background image ──────────── */}
        <div
          className="hidden lg:block w-1/2 relative"
          style={{
            backgroundImage: "url('/auth-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* ── Right panel: form area ─────────────────────────────── */}
        <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center bg-transparent relative overflow-hidden px-8 py-12">

          {/* Mobile logo (only on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-10 z-10">
            <img src="/logo.png" alt="AssetFlow Logo" className="w-9 h-9 rounded-lg object-contain" />
            <div>
              <span className="text-xl font-bold text-gray-900">AssetFlow</span>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Gestion des actifs</span>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-xl">
            {children}
          </div>
        </div>

      </div>
    </GuestGuard>
  );
}
