"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSuivisEtapes, updateSuiviEtape } from "@/features/maintenance/api/suiviEtapes";
import { fetchInterventions } from "@/features/maintenance/api/interventions";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { fetchModelesEntretien } from "@/features/maintenance/api/modelesEntretien";
import { SuiviEtapeStatut, SuiviEtapeIntervention, Intervention, StatutIntervention } from "@/features/maintenance/types/intervention";
import { 
  CheckCircle, 
  Wrench,
  XCircle,
  AlertCircle,
  Calendar,
  Car,
  Settings,
  Eye,
  Info,
  Search,
  ArrowLeft,
  CalendarClock,
  Clock,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InterventionStatutDialog } from "@/features/maintenance/components/InterventionStatutDialog";

export default function ValidationsMaintenancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"DEMANDES" | "ETAPES">("DEMANDES");

  // Dialog state for Etapes
  const [selectedEtape, setSelectedEtape] = useState<SuiviEtapeIntervention | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dialog state for Interventions Lifecycle
  const [lifecycleIntervention, setLifecycleIntervention] = useState<Intervention | null>(null);
  const [targetLifecycleStatut, setTargetLifecycleStatut] = useState<StatutIntervention | null>(null);
  const [isLifecycleDialogOpen, setIsLifecycleDialogOpen] = useState(false);

  // Dialog state for Demande Details
  const [selectedDemande, setSelectedDemande] = useState<Intervention | null>(null);
  const [isDemandeDetailsOpen, setIsDemandeDetailsOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  const { data: suivisEtapes, isLoading: isLoadingSuivis, isError: isErrorSuivis } = useQuery({
    queryKey: ["suivis-etapes"],
    queryFn: () => fetchSuivisEtapes(),
  });

  const { data: interventions, isLoading: isLoadingInterventions } = useQuery({
    queryKey: ["interventions"],
    queryFn: fetchInterventions,
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const { data: typesEntretien } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
  });

  const { data: modelesEntretien } = useQuery({
    queryKey: ["modeles-entretien"],
    queryFn: fetchModelesEntretien,
  });

  const updateStatutMutation = useMutation({
    mutationFn: updateSuiviEtape,
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["suivis-etapes"] });
      if (data.statut === "VALIDEE") {
        toast.success("Étape de maintenance validée !");
      } else {
        toast.success("Étape de maintenance rejetée (non validée).");
      }
      setUpdatingId(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
      setUpdatingId(null);
    },
  });

  const handleValidateEtape = (id: number, statut: SuiviEtapeStatut, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateStatutMutation.mutate({ id, data: { statut } });
  };

  const openEtapeDetails = (etape: SuiviEtapeIntervention) => {
    setSelectedEtape(etape);
    setIsDialogOpen(true);
  };

  const openLifecycleDialog = (intervention: Intervention, statut: StatutIntervention) => {
    setLifecycleIntervention(intervention);
    setTargetLifecycleStatut(statut);
    setIsLifecycleDialogOpen(true);
  };

  const openDemandeDetails = (intervention: Intervention) => {
    setSelectedDemande(intervention);
    setIsDemandeDetailsOpen(true);
  };

  // 1. Grouped Etapes (Steps Validation)
  const { pendingCount, groupedByIntervention } = useMemo(() => {
    let pending = suivisEtapes?.filter((etape) => etape.statut === "A_VALIDER") || [];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      pending = pending.filter((etape) => {
        const intervention = interventions?.find(i => i.id === etape.intervention);
        const immo = immobilisations?.find(im => im.id_immobilisation === intervention?.immobilisation);
        const typeEntretien = typesEntretien?.find(t => t.id === intervention?.type_entretien);
        
        const interventionName = typeEntretien ? typeEntretien.nom.toLowerCase() : "";
        const immoCode = immo ? immo.code.toLowerCase() : "";
        const etapeLibelle = etape.libelle.toLowerCase();
        
        return (
          interventionName.includes(lowerSearch) ||
          immoCode.includes(lowerSearch) ||
          etapeLibelle.includes(lowerSearch)
        );
      });
    }
    
    const grouped = pending.reduce((acc, etape) => {
      const interventionId = etape.intervention;
      if (!acc[interventionId]) {
        acc[interventionId] = [];
      }
      acc[interventionId].push(etape);
      return acc;
    }, {} as Record<number, SuiviEtapeIntervention[]>);

    return { 
      pendingCount: pending.length, 
      groupedByIntervention: Object.entries(grouped).map(([id, etapes]) => ({
        interventionId: Number(id),
        etapes: etapes.sort((a, b) => a.ordre - b.ordre)
      })) 
    };
  }, [suivisEtapes, interventions, immobilisations, typesEntretien, searchTerm]);

  // 2. Pending Demandes (Lifecycle Validation)
  const pendingDemandes = useMemo(() => {
    let pending = interventions?.filter(i => i.statut === "BROUILLON") || [];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      pending = pending.filter(i => {
        const immo = immobilisations?.find(im => im.id_immobilisation === i.immobilisation);
        const typeEntretien = typesEntretien?.find(t => t.id === i.type_entretien);
        
        return (
          (immo?.code.toLowerCase().includes(lowerSearch) || false) ||
          (typeEntretien?.nom.toLowerCase().includes(lowerSearch) || false) ||
          (`intervention #${i.id}`.includes(lowerSearch))
        );
      });
    }
    return pending;
  }, [interventions, immobilisations, typesEntretien, searchTerm]);

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case "FAIBLE": return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Faible</Badge>;
      case "NORMALE": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Normale</Badge>;
      case "HAUTE": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Haute</Badge>;
      case "URGENTE": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Urgente</Badge>;
      default: return null;
    }
  };

  const isLoading = isLoadingSuivis || isLoadingInterventions;
  const isError = isErrorSuivis;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/validations")}
          className="text-slate-500 hover:text-slate-900 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux validations
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            Validations Maintenance
          </h1>
          <p className="text-slate-500">
            Examinez et validez les demandes d'intervention et les étapes réalisées.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="relative w-full md:w-64 mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher (Intervention, Immo, Étape)..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 mt-8">
        <button 
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'DEMANDES' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('DEMANDES')}
        >
          Demandes d'intervention
          <Badge variant="outline" className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === 'DEMANDES' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600'}`}>
            {pendingDemandes.length}
          </Badge>
        </button>
        <button 
          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'ETAPES' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('ETAPES')}
        >
          Étapes de maintenance
          <Badge variant="outline" className={`ml-1 rounded-full px-2 py-0.5 text-xs ${activeTab === 'ETAPES' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-slate-100 text-slate-600'}`}>
            {pendingCount}
          </Badge>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 text-red-600 flex items-center gap-2 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5" />
          Impossible de charger les données
        </div>
      ) : activeTab === "DEMANDES" ? (
        // DEMANDES CONTENT
        pendingDemandes.length === 0 ? (
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
              <div className="p-5 bg-slate-100 rounded-full">
                <CheckCircle className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg">Aucune demande d'intervention en attente de validation.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDemandes.map((intervention) => {
              const immo = immobilisations?.find(im => im.id_immobilisation === intervention.immobilisation);
              const typeEntretien = typesEntretien?.find(t => t.id === intervention.type_entretien);
              const modele = modelesEntretien?.find(m => m.id === intervention.modele_entretien);
              const isCorrectif = typeEntretien?.code.toUpperCase() === "CORRECTIF";
              
              const interventionName = isCorrectif 
                ? (intervention.motif || "Intervention Corrective") 
                : (modele?.nom || typeEntretien?.nom || `Intervention #${intervention.id}`);

              return (
                <Card 
                  key={intervention.id} 
                  className="border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer hover:border-orange-300"
                  onClick={() => openDemandeDetails(intervention)}
                >
                  <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base text-slate-900 line-clamp-1" title={interventionName}>
                          {interventionName}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Car className="w-3.5 h-3.5" />
                          <span className="truncate">{immo?.code} - {immo?.designation}</span>
                        </div>
                      </div>
                      {getPrioriteBadge(intervention.priorite)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Demande soumise le {format(new Date(intervention.date_demande), "dd MMM yyyy", { locale: fr })}
                    </div>
                    {intervention.motif && (
                      <div className="bg-orange-50/50 p-3 rounded-md text-sm text-slate-700 border border-orange-100 mb-4 flex-1">
                        <p className="font-semibold text-orange-800 text-xs uppercase mb-1">Motif</p>
                        <p className="line-clamp-3">{intervention.motif}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLifecycleDialog(intervention, "ANNULEE");
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                      <Button 
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLifecycleDialog(intervention, "PLANIFIEE");
                        }}
                      >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Planifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        // ETAPES CONTENT
        groupedByIntervention.length === 0 ? (
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
              <div className="p-5 bg-slate-100 rounded-full">
                <CheckCircle className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg">Aucune étape de maintenance en attente de validation.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedByIntervention.map(({ interventionId, etapes }) => {
              const intervention = interventions?.find(i => i.id === interventionId);
              const immo = immobilisations?.find(im => im.id_immobilisation === intervention?.immobilisation);
              const typeEntretien = typesEntretien?.find(t => t.id === intervention?.type_entretien);
              const interventionName = typeEntretien ? typeEntretien.nom : `Intervention #${interventionId}`;

              return (
                <Card key={interventionId} className="border-slate-200 shadow-sm overflow-hidden group">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" />
                            {interventionName}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-brand-green/10 text-brand-green hover:bg-brand-green/20 font-normal">
                            {etapes.length} étape(s)
                          </Badge>
                        </div>
                        <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                          {immo && (
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <Car className="w-4 h-4 text-slate-400" />
                              {immo.code} - {immo.designation}
                            </span>
                          )}
                          {intervention?.date_demande && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              Demandée le {format(new Date(intervention.date_demande), "dd MMM yyyy", { locale: fr })}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {etapes.map((etape) => (
                        <div 
                          key={etape.id} 
                          className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                          onClick={() => openEtapeDetails(etape)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                Étape {etape.ordre}
                              </span>
                              <span className="font-medium text-slate-900">{etape.libelle}</span>
                              {etape.obligatoire && (
                                <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0 h-4 border-red-200 text-red-600 bg-red-50">Obligatoire</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 max-w-2xl pl-1 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              Cliquez pour voir les détails
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                              disabled={updatingId === etape.id}
                              onClick={(e) => handleValidateEtape(etape.id, "NON_VALIDEE", e)}
                            >
                              {updatingId === etape.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1.5"></div>
                              ) : (
                                <XCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Rejeter
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-brand-green hover:bg-brand-green/90 text-white shadow-sm"
                              disabled={updatingId === etape.id}
                              onClick={(e) => handleValidateEtape(etape.id, "VALIDEE", e)}
                            >
                              {updatingId === etape.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Valider
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Details Dialog for Etape */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Eye className="w-6 h-6 text-brand-green" />
              Détails de l'étape
            </DialogTitle>
            <DialogDescription className="text-base">
              Informations complètes sur l'étape d'intervention sélectionnée.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEtape && (
            <div className="space-y-6 w-full pb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Ordre</div>
                  <div className="text-base font-semibold text-slate-900">Étape n° {selectedEtape.ordre}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Caractère</div>
                  <div>
                    {selectedEtape.obligatoire ? (
                      <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 px-3 py-1">Obligatoire</Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 px-3 py-1">Facultatif</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Libellé</div>
                  <div className="text-lg font-medium text-slate-900">{selectedEtape.libelle}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Description détaillée</div>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {selectedEtape.description || "Aucune description fournie pour cette étape."}
                </div>
              </div>
              
              {selectedEtape.commentaire && (
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    Commentaire du technicien
                  </div>
                  <div className="text-sm text-slate-700 bg-amber-50/70 p-4 rounded-xl border border-amber-100 whitespace-pre-wrap leading-relaxed">
                    {selectedEtape.commentaire}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">

            {selectedEtape && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleValidateEtape(selectedEtape.id, "NON_VALIDEE")}
                  disabled={updatingId === selectedEtape.id}
                >
                  Rejeter
                </Button>
                <Button 
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                  onClick={() => handleValidateEtape(selectedEtape.id, "VALIDEE")}
                  disabled={updatingId === selectedEtape.id}
                >
                  Valider l'étape
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDemandeDetailsOpen} onOpenChange={setIsDemandeDetailsOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
              <Info className="w-5 h-5 text-orange-500" />
              Détails de la demande
            </DialogTitle>
          </DialogHeader>
          
          {selectedDemande && (() => {
            const immo = immobilisations?.find(im => im.id_immobilisation === selectedDemande.immobilisation);
            const typeEntretien = typesEntretien?.find(t => t.id === selectedDemande.type_entretien);
            const modele = modelesEntretien?.find(m => m.id === selectedDemande.modele_entretien);
            const isCorrectif = typeEntretien?.code.toUpperCase() === "CORRECTIF";
            
            const interventionName = isCorrectif 
              ? (selectedDemande.motif || "Intervention Corrective") 
              : (modele?.nom || typeEntretien?.nom || `Intervention #${selectedDemande.id}`);

            return (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Intervention</p>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2" title={interventionName}>{interventionName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Immobilisation</p>
                    <p className="text-sm font-medium text-slate-900">{immo?.code} - {immo?.designation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priorité</p>
                    <div className="mt-1">{getPrioriteBadge(selectedDemande.priorite)}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date de demande</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(selectedDemande.date_demande), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Demandée par</p>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">
                      {selectedDemande.demande_par_nom || `ID: ${selectedDemande.demande_par}`}
                    </p>
                  </div>
                </div>

                {selectedDemande.motif && (
                  <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Motif de la demande</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedDemande.motif}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setIsDemandeDetailsOpen(false);
                      openLifecycleDialog(selectedDemande, "ANNULEE");
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      setIsDemandeDetailsOpen(false);
                      openLifecycleDialog(selectedDemande, "PLANIFIEE");
                    }}
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Planifier
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>


      
      <InterventionStatutDialog
        isOpen={isLifecycleDialogOpen}
        onClose={() => setIsLifecycleDialogOpen(false)}
        intervention={lifecycleIntervention}
        targetStatut={targetLifecycleStatut}
      />

    </div>
  );
}
