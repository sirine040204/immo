"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingSpinner className="h-10 w-10 text-brand-green" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Don't render guest pages while redirecting away
  }

  return <>{children}</>;
}
