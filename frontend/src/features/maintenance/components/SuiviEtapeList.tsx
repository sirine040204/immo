"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSuivisEtapes, deleteSuiviEtape } from "../api/suiviEtapes";
import { SuiviEtapeIntervention, SuiviEtapeStatut, StatutIntervention } from "../types/intervention";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ListChecks, Plus, Trash2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { SuiviEtapeDialog } from "./SuiviEtapeDialog";
import { SuiviEtapeValidationDialog } from "./SuiviEtapeValidationDialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface SuiviEtapeListProps {
  interventionId: number;
  interventionStatut: StatutIntervention;
  isCorrectif: boolean;
}

const getSuiviStatutBadge = (statut: SuiviEtapeStatut) => {
  switch (statut) {
    case "A_VALIDER": return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">À valider</Badge>;
    case "VALIDEE": return <Badge variant="outline" className="bg-brand-green-light text-brand-green border-brand-green/20">Validée</Badge>;
    case "NON_VALIDEE": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Non validée</Badge>;
  }
};

export function SuiviEtapeList({ interventionId, interventionStatut, isCorrectif }: SuiviEtapeListProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [validationStep, setValidationStep] = useState<SuiviEtapeIntervention | null>(null);

  const { data: etapes = [], isLoading } = useQuery({
    queryKey: ["suivis-etapes", interventionId],
    queryFn: () => fetchSuivisEtapes(interventionId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSuiviEtape,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-etapes", interventionId] });
      toast.success("Étape supprimée");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression.");
    }
  });

  const canAddStep = isCorrectif && !["TERMINEE", "ANNULEE"].includes(interventionStatut);
  const canDeleteStep = interventionStatut === "BROUILLON";
  const canValidateStep = interventionStatut === "EN_COURS";

  if (isLoading) {
    return <div className="text-center p-6 text-slate-500 animate-pulse">Chargement des étapes...</div>;
  }

  return (
    <Card className="shadow-sm border-slate-200 mt-6">
      <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-slate-500" />
          Étapes de l'intervention
        </CardTitle>
        {canAddStep && (
          <Button onClick={() => setIsAddOpen(true)} size="sm" className="bg-brand-green hover:bg-brand-green-hover text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une étape
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {etapes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucune étape définie pour cette intervention.
            {isCorrectif && " Vous pouvez en ajouter manuellement."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {etapes.map((etape: SuiviEtapeIntervention) => (
              <div key={etape.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                  {etape.ordre}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{etape.libelle}</h4>
                    {etape.obligatoire && (
                      <Badge variant="outline" className="text-xs font-normal bg-amber-50 text-amber-700 border-amber-200">
                        Obligatoire
                      </Badge>
                    )}
                    {getSuiviStatutBadge(etape.statut)}
                  </div>
                  {etape.description && (
                    <p className="text-sm text-slate-500">{etape.description}</p>
                  )}
                  {etape.commentaire && (
                    <div className="mt-2 p-2 bg-slate-100 rounded text-sm text-slate-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{etape.commentaire}</span>
                    </div>
                  )}
                  {etape.date_validation && (
                    <div className="text-xs text-slate-400 mt-1">
                      Validée le {format(new Date(etape.date_validation), "dd/MM/yyyy HH:mm")}
                      {etape.validee_par_nom ? ` par ${etape.validee_par_nom}` : ''}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 self-start">
                  {canValidateStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setValidationStep(etape)}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {etape.statut === "A_VALIDER" ? "Évaluer" : "Modifier l'évaluation"}
                    </Button>
                  )}
                  {canDeleteStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(etape.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <SuiviEtapeDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        interventionId={interventionId}
        existingOrders={etapes.map((e) => e.ordre)}
      />
      
      <SuiviEtapeValidationDialog
        isOpen={!!validationStep}
        onClose={() => setValidationStep(null)}
        suiviEtape={validationStep}
      />
    </Card>
  );
}
