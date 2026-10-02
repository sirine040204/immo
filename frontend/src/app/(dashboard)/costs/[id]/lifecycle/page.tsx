"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCostById } from "@/features/costs/api/costs";
import { StatutCout } from "@/features/costs/types/costs";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  FileEdit,
  Send,
  ShieldCheck,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function formatDateTime(dt: string | null | undefined) {
  if (!dt) return null;
  return format(new Date(dt), "dd MMM yyyy 'à' HH:mm", { locale: fr });
}

export default function CostLifecyclePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: cost, isLoading, isError } = useQuery({
    queryKey: ["costs", id],
    queryFn: () => fetchCostById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !cost) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Impossible de charger ce coût.
        </div>
      </div>
    );
  }

  const isRejected = cost.statut === StatutCout.REJETE;
  const isValidated = cost.statut === StatutCout.VALIDE;
  const isWaiting = cost.statut === StatutCout.EN_ATTENTE_VALIDATION;
  const isDraft = cost.statut === StatutCout.BROUILLON;

  type Step = {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    done: boolean;
    active: boolean;
    rejected?: boolean;
    meta?: string | null;
    metaUser?: string | null;
  };

  const steps: Step[] = [
    {
      key: "creation",
      label: "Création",
      description: "Le coût a été enregistré en tant que brouillon.",
      icon: <FileEdit className="h-5 w-5" />,
      color: "text-slate-700",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-300",
      done: true,
      active: isDraft,
      meta: formatDateTime(cost.date_creation),
      metaUser: cost.cree_par_nom || (cost.cree_par ? `Utilisateur #${cost.cree_par}` : null),
    },
    {
      key: "soumission",
      label: "Soumission",
      description: "Le coût a été soumis pour validation.",
      icon: <Send className="h-5 w-5" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      done: !isDraft,
      active: isWaiting,
      meta: !isDraft && cost.date_modification ? formatDateTime(cost.date_modification) : null,
      metaUser: !isDraft
        ? cost.modifie_par_nom || (cost.modifie_par ? `Utilisateur #${cost.modifie_par}` : null)
        : null,
    },
    {
      key: "validation",
      label: isRejected ? "Rejet" : "Validation",
      description: isRejected
        ? "Le coût a été rejeté."
        : isValidated
          ? "Le coût a été validé et est définitif."
          : "En attente d'une décision.",
      icon: isRejected ? <XCircle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />,
      color: isRejected ? "text-red-700" : isValidated ? "text-green-700" : "text-slate-400",
      bgColor: isRejected ? "bg-red-50" : isValidated ? "bg-green-50" : "bg-slate-50",
      borderColor: isRejected
        ? "border-red-300"
        : isValidated
          ? "border-green-300"
          : "border-dashed border-slate-300",
      done: isValidated || isRejected,
      active: isValidated || isRejected,
      rejected: isRejected,
      meta: isValidated
        ? formatDateTime(cost.date_validation)
        : isRejected
          ? formatDateTime(cost.date_modification)
          : null,
      metaUser: isValidated
        ? cost.valide_par_nom || (cost.valide_par ? `Utilisateur #${cost.valide_par}` : null)
        : isRejected
          ? cost.modifie_par_nom || (cost.modifie_par ? `Utilisateur #${cost.modifie_par}` : null)
          : null,
    },
  ];

  const statusBadge = () => {
    switch (cost.statut) {
      case StatutCout.BROUILLON:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Brouillon</Badge>;
      case StatutCout.EN_ATTENTE_VALIDATION:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En attente</Badge>;
      case StatutCout.VALIDE:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Validé</Badge>;
      case StatutCout.REJETE:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeté</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mt-1 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{cost.libelle}</h1>
            {statusBadge()}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {cost.immobilisation_nom || `Immobilisation #${cost.immobilisation}`} &middot; {cost.type_cout.replace(/_/g, " ")}
            &nbsp;&middot;&nbsp;
            {format(new Date(cost.date_cout), "dd MMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border border-slate-200 bg-white text-center">
          <div className="text-lg font-bold text-slate-900">{parseFloat(cost.montant_ht).toLocaleString("fr-FR")} TND</div>
          <div className="text-xs text-slate-500 mt-1">Montant HT</div>
        </div>
        <div className="rounded-xl p-4 border border-slate-200 bg-white text-center">
          <div className="text-lg font-bold text-slate-900">{parseFloat(cost.montant_tva).toLocaleString("fr-FR")} TND</div>
          <div className="text-xs text-slate-500 mt-1">TVA ({cost.taux_tva}%)</div>
        </div>
        <div className="rounded-xl p-4 border border-green-200 bg-green-50 text-center">
          <div className="text-lg font-bold text-green-700">{parseFloat(cost.montant_ttc).toLocaleString("fr-FR")} TND</div>
          <div className="text-xs text-slate-500 mt-1">Montant TTC</div>
        </div>
      </div>

      {/* Rejection Banner */}
      {isRejected && cost.motif_rejet && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Motif du rejet</p>
            <p className="text-sm text-red-800 mt-1">{cost.motif_rejet}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" />
          Cycle de vie
        </h2>

        <div className="relative">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200" />
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.key} className="relative flex gap-5 items-start">
                <div
                  className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 ${step.done
                      ? `${step.bgColor} ${step.borderColor} ${step.color}`
                      : "bg-slate-50 border-dashed border-slate-300 text-slate-300"
                    }`}
                >
                  {step.done ? step.icon : <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
                </div>

                <div className={`flex-1 pt-2 ${step.done ? "" : "opacity-40"}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`font-semibold text-base ${step.done ? step.color : "text-slate-400"}`}>
                      {step.label}
                    </h3>
                    {step.active && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${step.rejected
                            ? "bg-red-100 text-red-700"
                            : step.done && step.key === "validation"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        Étape actuelle
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                  {step.metaUser && (
                    <p className="text-xs text-slate-400 mt-2">
                      <span className="font-medium text-slate-600">{step.metaUser}</span>
                      {step.meta && <span> &middot; {step.meta}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commentaire */}
      {cost.commentaire && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Commentaire</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{cost.commentaire}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    </div>
  );
}
