"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchSuivisEtapes } from "@/features/maintenance/api/suiviEtapes";
import { fetchCosts } from "@/features/costs/api/costs";
import { ImmobilisationStatut } from "@/features/immobilisations/types/immobilisation";
import { StatutCout } from "@/features/costs/types/costs";

import { 
  CheckCircle, 
  Car, 
  Wrench, 
  CircleDollarSign, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

export default function ValidationsDashboardPage() {
  // 1. Fetch Immobilisations
  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  // 2. Fetch Maintenance Steps
  const { data: suivisEtapes } = useQuery({
    queryKey: ["suivis-etapes"],
    queryFn: () => fetchSuivisEtapes(),
  });

  // 3. Fetch Costs
  const { data: costs } = useQuery({
    queryKey: ["costs"],
    queryFn: fetchCosts,
  });

  // Calculate dynamic counts
  const counts = useMemo(() => {
    const immoCount = immobilisations?.filter((immo) => immo.statut === ImmobilisationStatut.CREEE).length || 0;
    
    // Suivis Etapes grouped by intervention
    const pendingEtapes = suivisEtapes?.filter((etape) => etape.statut === "A_VALIDER") || [];
    const maintenanceCount = new Set(pendingEtapes.map(e => e.intervention)).size; 
    // Wait, the maintenance page grouped by intervention, but the user might want the count of interventions, or the count of steps. 
    // The maintenance page says "{pendingCount} étape(s) en attente". Let's show the number of steps to be consistent.
    const maintenanceStepsCount = pendingEtapes.length;

    const costsCount = costs?.filter((cost) => cost.statut === StatutCout.EN_ATTENTE_VALIDATION && !cost.is_archived).length || 0;

    return {
      immobilisations: immoCount,
      maintenance: maintenanceStepsCount,
      couts: costsCount,
      total: immoCount + maintenanceStepsCount + costsCount
    };
  }, [immobilisations, suivisEtapes, costs]);

  const validationGroups = [
    {
      id: "immobilisations",
      title: "Immobilisations",
      description: "Valider les nouvelles immobilisations, les transferts et les mises au rebut.",
      icon: Car,
      href: "/validations/immobilisations",
      color: "bg-blue-100 text-blue-600",
      borderColor: "border-blue-200",
      hoverBorder: "hover:border-blue-300",
      pendingCount: counts.immobilisations,
      badgeText: `${counts.immobilisations} en attente`,
    },
    {
      id: "maintenance",
      title: "Maintenance & Entretiens",
      description: "Approuver les demandes d'intervention, les planifications et les étapes d'entretien.",
      icon: Wrench,
      href: "/validations/maintenance",
      color: "bg-orange-100 text-orange-600",
      borderColor: "border-orange-200",
      hoverBorder: "hover:border-orange-300",
      pendingCount: counts.maintenance,
      badgeText: `${counts.maintenance} étape(s)`,
    },
    {
      id: "couts",
      title: "Coûts & Dépenses",
      description: "Valider les coûts associés aux interventions, achats et autres dépenses.",
      icon: CircleDollarSign,
      href: "/validations/couts",
      color: "bg-emerald-100 text-emerald-600",
      borderColor: "border-emerald-200",
      hoverBorder: "hover:border-emerald-300",
      pendingCount: counts.couts,
      badgeText: `${counts.couts} en attente`,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-brand-green/10 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-brand-green" />
            </div>
            Centre de Validations
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Gérez toutes les demandes en attente d'approbation. Sélectionnez une catégorie ci-dessous pour examiner et traiter les éléments nécessitant votre attention.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className={`p-2 rounded-lg ${counts.total > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Total en attente</div>
            <div className="text-xl font-bold text-slate-900">
              {counts.total} demande{counts.total > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Validation Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validationGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card 
              key={group.id} 
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md ${group.borderColor} ${group.hoverBorder}`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
                <Icon className="w-32 h-32 transform translate-x-4 -translate-y-4" />
              </div>
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${group.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {group.pendingCount > 0 ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-medium">
                      {group.badgeText}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none">
                      À jour
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {group.title}
                </CardTitle>
                <CardDescription className="text-slate-500 mt-2 text-sm leading-relaxed">
                  {group.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 relative z-10 mt-4">
                <Link href={group.href} className="block w-full">
                  <Button 
                    variant="outline" 
                    className={`w-full justify-between bg-white hover:bg-slate-50 ${group.borderColor} group-hover:border-brand-green/30 transition-colors`}
                  >
                    <span>Consulter</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-green transition-colors" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
