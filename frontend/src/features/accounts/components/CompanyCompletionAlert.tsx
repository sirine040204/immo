"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/accounts/api/auth";
import { getCompanyProfile } from "@/features/accounts/api/companies";
import { AlertCircle, X, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function CompanyCompletionAlert() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const { data: user } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ["companyProfile"],
    queryFn: getCompanyProfile,
    enabled: !!user && user.is_company_admin,
  });

  if (!user || !user.is_company_admin || isLoading || !company) {
    return null;
  }

  // Define what "missing info" means (fields not required during initial registration)
  const isMissingInfo = !company.adresse || company.adresse.trim() === "";

  if (!isMissingInfo || !isVisible) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-3 shadow-md flex items-center justify-between z-50 shrink-0">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-100" />
        <div>
          <p className="font-semibold text-sm">Action requise : Complétez le profil de votre entreprise</p>
          <p className="text-amber-100 text-xs mt-0.5">
            Veuillez fournir l'adresse et les coordonnées manquantes pour garantir le bon fonctionnement de l'application.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/parametres")}
          className="text-xs font-bold bg-white text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-sm"
        >
          Compléter maintenant <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-200 hover:text-white transition-colors"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
