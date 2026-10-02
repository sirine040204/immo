"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIntervention, deleteIntervention } from "@/features/maintenance/api/interventions";
import { fetchRapportsInterventions } from "@/features/maintenance/api/rapportsInterventions";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { fetchModelesEntretien } from "@/features/maintenance/api/modelesEntretien";
import { Intervention, StatutIntervention } from "@/features/maintenance/types/intervention";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import { ChevronLeft, Edit2, Calendar, FileText, CheckCircle2, PlayCircle, Clock, XCircle, Trash2, CalendarClock } from "lucide-react";
import { InterventionDialog } from "@/features/maintenance/components/InterventionDialog";
import { InterventionStatutDialog } from "@/features/maintenance/components/InterventionStatutDialog";
import { RapportInterventionDialog } from "@/features/maintenance/components/RapportInterventionDialog";
import { SuiviEtapeList } from "@/features/maintenance/components/SuiviEtapeList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const getStatutBadge = (statut: StatutIntervention) => {
  switch (statut) {
    case "BROUILLON": return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Brouillon</Badge>;
    case "PLANIFIEE": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planifiée</Badge>;
    case "EN_COURS": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En cours</Badge>;
    case "TERMINEE": return <Badge variant="outline" className="bg-brand-green-light text-brand-green border-brand-green/20">Terminée</Badge>;
    case "ANNULEE": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulée</Badge>;
  }
};

const getPrioriteBadge = (priorite: string) => {
  switch (priorite) {
    case "FAIBLE": return <span className="text-slate-500 font-medium">Faible</span>;
    case "NORMALE": return <span className="text-blue-600 font-medium">Normale</span>;
    case "HAUTE": return <span className="text-amber-600 font-medium">Haute</span>;
    case "URGENTE": return <span className="text-red-600 font-bold">Urgente</span>;
    default: return null;
  }
};

export default function InterventionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [statutDialogOpen, setStatutDialogOpen] = useState(false);
  const [targetStatut, setTargetStatut] = useState<StatutIntervention | null>(null);

  const [rapportDialogOpen, setRapportDialogOpen] = useState(false);

  const { data: intervention, isLoading, isError } = useQuery({
    queryKey: ["intervention", id],
    queryFn: () => fetchIntervention(id),
  });

  const { data: immobilisations } = useQuery({ queryKey: ["immobilisations"], queryFn: fetchImmobilisations });
  const { data: types } = useQuery({ queryKey: ["types-entretien"], queryFn: fetchTypesEntretien });
  const { data: modeles } = useQuery({ queryKey: ["modeles-entretien"], queryFn: fetchModelesEntretien });
  const { data: rapports } = useQuery({ queryKey: ["rapports-interventions"], queryFn: fetchRapportsInterventions });

  const deleteMutation = useMutation({
    mutationFn: deleteIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast.success("Intervention supprimée avec succès");
      router.push("/entretiens/execution");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression.");
    }
  });

  if (isLoading) return <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des détails...</div>;
  if (isError || !intervention) return <ErrorMessage title="Erreur" message="Impossible de charger cette intervention." />;

  const immo = immobilisations?.find(i => i.id_immobilisation === intervention.immobilisation);
  const typeEnt = types?.find(t => t.id === intervention.type_entretien);
  const modEnt = modeles?.find(m => m.id === intervention.modele_entretien);
  const rapport = rapports?.find(r => r.intervention === intervention.id);

  const isCorrectif = typeEnt?.code.toUpperCase() === "CORRECTIF";

  const handleDelete = () => {
    deleteMutation.mutate(id);
  };

  const openStatutDialog = (statut: StatutIntervention) => {
    setTargetStatut(statut);
    setStatutDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/entretiens/execution")} className="p-2 -ml-2 text-slate-500">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 line-clamp-1" title={intervention.intervention_nom || `Intervention #${intervention.id}`}>
            {intervention.intervention_nom || `Intervention #${intervention.id}`}
            {getStatutBadge(intervention.statut)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Créée le {intervention.date_demande} par {intervention.demande_par_nom || `Utilisateur #${intervention.demande_par}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {intervention.statut === "BROUILLON" && (
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
          {(intervention.statut === "BROUILLON" || intervention.statut === "PLANIFIEE") && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Détails de l'intervention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Immobilisation</div>
                  <div className="font-medium text-slate-900">{immo ? `${immo.code} - ${immo.designation}` : `ID: ${intervention.immobilisation}`}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Priorité</div>
                  <div>{getPrioriteBadge(intervention.priorite)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Type d'entretien</div>
                  <div className="font-medium text-slate-900">{typeEnt ? typeEnt.nom : `ID: ${intervention.type_entretien}`}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Modèle d'entretien</div>
                  <div className="font-medium text-slate-900">
                    {isCorrectif ? (
                      <span className="italic text-slate-400">Sans modèle (Correctif)</span>
                    ) : (
                      modEnt ? modEnt.nom : "Aucun modèle"
                    )}
                  </div>
                </div>
                
                <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-500 mb-2">Motif / Description</div>
                  <div className="text-slate-700 bg-slate-50 p-4 rounded-md text-sm whitespace-pre-wrap">
                    {intervention.motif || <span className="italic text-slate-400">Aucun motif renseigné.</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps Tracking */}
          <SuiviEtapeList 
            interventionId={intervention.id}
            interventionStatut={intervention.statut}
            isCorrectif={isCorrectif}
          />
        </div>

        {/* Right Column: Actions & Lifecycle */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 bg-slate-50">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intervention.statut === "BROUILLON" && (
                <>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openStatutDialog("PLANIFIEE")}>
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Planifier l'intervention
                  </Button>
                  <Button className="w-full bg-white text-slate-700 hover:bg-slate-100 border border-slate-300" onClick={() => openStatutDialog("ANNULEE")}>
                    <XCircle className="w-4 h-4 mr-2 text-slate-400" />
                    Annuler l'intervention
                  </Button>
                </>
              )}

              {intervention.statut === "PLANIFIEE" && (
                <>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => openStatutDialog("EN_COURS")}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Démarrer l'intervention
                  </Button>
                  <Button className="w-full bg-white text-slate-700 hover:bg-slate-100 border border-slate-300" onClick={() => openStatutDialog("ANNULEE")}>
                    <XCircle className="w-4 h-4 mr-2 text-slate-400" />
                    Annuler l'intervention
                  </Button>
                </>
              )}

              {intervention.statut === "EN_COURS" && (
                <>
                  <Button className="w-full bg-brand-green hover:bg-brand-green-hover text-white" onClick={() => openStatutDialog("TERMINEE")}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Terminer l'intervention
                  </Button>
                </>
              )}

              {(intervention.statut === "TERMINEE") && (
                <Button 
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white" 
                  onClick={() => setRapportDialogOpen(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {rapport ? "Consulter le rapport" : "Créer le rapport final"}
                </Button>
              )}
              {intervention.statut === "ANNULEE" && (
                <div className="text-center text-slate-500 text-sm py-4">
                  Aucune action disponible pour ce statut.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                Chronologie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200">
                {/* Creation */}
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-slate-400 ring-4 ring-white" />
                  <div className="text-sm font-medium text-slate-900">Demande créée (Brouillon)</div>
                  <div className="text-xs text-slate-500 mt-1">{intervention.date_demande}</div>
                </div>

                {/* Planification */}
                <div className="relative">
                  <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${intervention.date_prevue ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  <div className={`text-sm font-medium ${intervention.date_prevue ? 'text-slate-900' : 'text-slate-400'}`}>Planifiée pour le</div>
                  {intervention.date_prevue ? (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {intervention.date_prevue}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-1">Non définie</div>
                  )}
                </div>

                {/* En cours */}
                {(intervention.date_debut || intervention.statut === "EN_COURS" || intervention.statut === "TERMINEE") && (
                  <div className="relative">
                    <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${intervention.date_debut ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className="text-sm font-medium text-slate-900">Démarrée le</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      {intervention.date_debut ? intervention.date_debut : "En attente"}
                    </div>
                  </div>
                )}

                {/* Terminée */}
                {(intervention.statut === "TERMINEE") && (
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-brand-green-light0 ring-4 ring-white" />
                    <div className="text-sm font-medium text-slate-900">Terminée le</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      {intervention.date_fin ? intervention.date_fin : "Date inconnue"}
                    </div>
                  </div>
                )}

                {/* Annulée */}
                {intervention.statut === "ANNULEE" && (
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-red-500 ring-4 ring-white" />
                    <div className="text-sm font-medium text-red-700">Intervention annulée</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InterventionDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        intervention={intervention}
        isCorrectiveMode={isCorrectif}
      />

      <InterventionStatutDialog
        isOpen={statutDialogOpen}
        onClose={() => setStatutDialogOpen(false)}
        intervention={intervention}
        targetStatut={targetStatut}
      />

      <RapportInterventionDialog
        isOpen={rapportDialogOpen}
        onClose={() => setRapportDialogOpen(false)}
        interventionId={intervention.id}
        rapport={rapport}
        interventionDetails={{
          immoName: immo ? `${immo.code} - ${immo.designation}` : `ID: ${intervention.immobilisation}`,
          typeName: typeEnt ? typeEnt.nom : `ID: ${intervention.type_entretien}`,
          modeleName: isCorrectif ? "Sans modèle (Correctif)" : (modEnt ? modEnt.nom : "Aucun modèle"),
          motif: intervention.motif,
          priorite: intervention.priorite,
          dateDemande: intervention.date_demande,
          datePrevue: intervention.date_prevue || undefined,
          dateDebut: intervention.date_debut || undefined,
          dateFin: intervention.date_fin || undefined
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Supprimer l'intervention</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cette intervention brouillon ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
