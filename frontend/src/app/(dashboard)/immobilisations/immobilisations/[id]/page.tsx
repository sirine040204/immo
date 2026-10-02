"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Edit2, CheckCircle2, Archive, RotateCcw,
  Trash2, Ban, PauseCircle, PlayCircle, Box, AlertCircle
} from "lucide-react";
import { fetchImmobilisation, fetchValeursAttributs } from "@/features/immobilisations/api/immobilisations";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { fetchAttributs, fetchOptions } from "@/features/immobilisations/api/attributs";
import { ImmobilisationStatut } from "@/features/immobilisations/types/immobilisation";
import { TypeDonnee, AttributDynamique, OptionAttribut } from "@/features/immobilisations/types/attribut";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(num);
};

// Dialogs
import { ImmobilisationFormDialog } from "@/features/immobilisations/components/ImmobilisationFormDialog";
import { ImmobilisationArchiveDialog } from "@/features/immobilisations/components/ImmobilisationArchiveDialog";
import { ImmobilisationRestoreDialog } from "@/features/immobilisations/components/ImmobilisationRestoreDialog";
import { ImmobilisationDeleteDialog } from "@/features/immobilisations/components/ImmobilisationDeleteDialog";
import { ImmobilisationActivateDialog } from "@/features/immobilisations/components/ImmobilisationActivateDialog";
import { ReformerDialog } from "@/features/immobilisations/components/ReformerDialog";
import { ImmobilisationHorsServiceDialog } from "@/features/immobilisations/components/ImmobilisationHorsServiceDialog";
import { ImmobilisationRemettreEnServiceDialog } from "@/features/immobilisations/components/ImmobilisationRemettreEnServiceDialog";
import { HistoriqueTimeline } from "@/features/immobilisations/components/HistoriqueTimeline";
import { DocumentsRequisPanel } from "@/features/immobilisations/components/DocumentsRequisPanel";

export default function ImmobilisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isReformerDialogOpen, setIsReformerDialogOpen] = useState(false);
  const [isHorsServiceDialogOpen, setIsHorsServiceDialogOpen] = useState(false);
  const [isRemettreEnServiceDialogOpen, setIsRemettreEnServiceDialogOpen] = useState(false);

  const [optionsMap, setOptionsMap] = useState<Record<number, OptionAttribut[]>>({});

  const { data: imm, isLoading: isImmLoading } = useQuery({
    queryKey: ["immobilisations", id],
    queryFn: () => fetchImmobilisation(id),
    enabled: !!id,
  });

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const { data: attributs } = useQuery({
    queryKey: ["attributs", imm?.famille],
    queryFn: () => fetchAttributs(imm!.famille),
    enabled: !!imm?.famille,
  });

  const { data: valeursAttributs } = useQuery({
    queryKey: ["valeurs-attributs", id],
    queryFn: () => fetchValeursAttributs(id),
    enabled: !!id,
  });

  React.useEffect(() => {
    const loadOptions = async () => {
      const listAttributs = attributs?.filter(a => a.type_donnee === TypeDonnee.LISTE) || [];
      const newOptionsMap: Record<number, OptionAttribut[]> = {};

      for (const attr of listAttributs) {
        try {
          const opts = await fetchOptions(attr.id_attribut);
          newOptionsMap[attr.id_attribut] = opts;
        } catch (err) {
          console.error(`Failed to fetch options for attr ${attr.id_attribut}`, err);
        }
      }
      setOptionsMap(newOptionsMap);
    };

    if (attributs && attributs.length > 0) {
      loadOptions();
    }
  }, [attributs]);

  if (isImmLoading || !imm) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const famille = familles?.find((f) => f.id_famille === imm.famille);

  const renderStatusBadge = (status: ImmobilisationStatut) => {
    const configs = {
      [ImmobilisationStatut.CREEE]: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Créée" },
      [ImmobilisationStatut.ACTIVE]: { color: "bg-brand-green-light text-brand-green border-brand-green/20", label: "Active" },
      [ImmobilisationStatut.ARCHIVEE]: { color: "bg-slate-50 text-slate-700 border-slate-200", label: "Archivée" },
      [ImmobilisationStatut.HORS_SERVICE]: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Hors Service" },
      [ImmobilisationStatut.REFORMEE]: { color: "bg-red-50 text-red-700 border-red-200", label: "Réformée" },
    };
    const config = configs[status] || configs[ImmobilisationStatut.CREEE];
    return <Badge variant="outline" className={`${config.color} font-medium`}>{config.label}</Badge>;
  };

  // Render the visual lifecycle map
  const renderLifecycleMap = () => {
    const states = [
      ImmobilisationStatut.CREEE,
      ImmobilisationStatut.ACTIVE,
      ImmobilisationStatut.HORS_SERVICE,
      ImmobilisationStatut.REFORMEE
    ];

    return (
      <Card className="mb-8 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Cycle de vie de l'immobilisation</h3>
        </div>
        <CardContent className="p-8">
          <div className="relative flex items-center justify-between max-w-4xl mx-auto">
            {/* Connecting lines */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />

            {states.map((state, index) => {
              const isActive = imm.statut === state;
              const isPast = states.indexOf(imm.statut) > index;
              const isArchivee = imm.statut === ImmobilisationStatut.ARCHIVEE;

              // Special logic for Archivée (which branches off ACTIVE)
              if (state === ImmobilisationStatut.ACTIVE && isArchivee) {
                return (
                  <div key={state} className="relative z-10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-brand-green-light0 mb-2 ring-4 ring-white" />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                    <div className="absolute top-full mt-4 flex flex-col items-center">
                      <div className="w-0.5 h-8 bg-brand-green-light0 mb-2" />
                      <div className="w-4 h-4 rounded-full bg-slate-500 mb-2 ring-4 ring-white shadow-[0_0_0_4px_rgba(100,116,139,0.2)]" />
                      <span className="text-sm font-bold text-slate-900">Archivée</span>
                    </div>
                  </div>
                );
              }

              let color = "bg-slate-200";
              if (isActive) color = "bg-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]";
              else if (isPast) color = "bg-brand-green-light0";

              // If we are archived, anything past ACTIVE is not past
              if (isArchivee && index > 1) {
                color = "bg-slate-200";
              }

              const label = state === ImmobilisationStatut.CREEE ? "Créée" :
                state === ImmobilisationStatut.ACTIVE ? "Active" :
                  state === ImmobilisationStatut.HORS_SERVICE ? "Hors Service" : "Réformée";

              return (
                <div key={state} className="relative z-10 flex flex-col items-center bg-white px-2">
                  <div className={`w-4 h-4 rounded-full ${color} mb-2 ring-4 ring-white transition-all`} />
                  <span className={`text-sm ${isActive ? 'font-bold text-indigo-900' : isPast ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/immobilisations/immobilisations")} className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{imm.designation}</h1>
                {renderStatusBadge(imm.statut)}
              </div>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Box className="w-4 h-4" /> {famille?.nom || `Famille ID: ${imm.famille}`} • Code: {imm.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(imm.statut === ImmobilisationStatut.CREEE || imm.statut === ImmobilisationStatut.ACTIVE || imm.statut === ImmobilisationStatut.HORS_SERVICE) && (
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Modifier
              </Button>
            )}

            {imm.statut === ImmobilisationStatut.CREEE && (
              <>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsActivateDialogOpen(true)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Activer
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </>
            )}

            {imm.statut === ImmobilisationStatut.ACTIVE && (
              <>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsHorsServiceDialogOpen(true)}>
                  <PauseCircle className="mr-2 h-4 w-4" /> Hors service
                </Button>
                <Button variant="outline" onClick={() => setIsArchiveDialogOpen(true)}>
                  <Archive className="mr-2 h-4 w-4" /> Archiver
                </Button>
                <Button variant="destructive" onClick={() => setIsReformerDialogOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" /> Réformer
                </Button>
              </>
            )}

            {imm.statut === ImmobilisationStatut.HORS_SERVICE && (
              <>
                <Button className="bg-brand-green hover:bg-brand-green-hover" onClick={() => setIsRemettreEnServiceDialogOpen(true)}>
                  <PlayCircle className="mr-2 h-4 w-4" /> Remettre en service
                </Button>
                <Button variant="destructive" onClick={() => setIsReformerDialogOpen(true)}>
                  <Ban className="mr-2 h-4 w-4" /> Réformer
                </Button>
              </>
            )}

            {imm.statut === ImmobilisationStatut.ARCHIVEE && (
              <Button className="bg-brand-green hover:bg-brand-green-hover" onClick={() => setIsRestoreDialogOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" /> Restaurer
              </Button>
            )}
          </div>
        </div>
        
        {/* Alerte IA Prédictive */}
        {imm.alerte_predictive && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            imm.alerte_predictive.niveau === "CRITIQUE" 
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <AlertCircle className={`w-6 h-6 shrink-0 ${
              imm.alerte_predictive.niveau === "CRITIQUE" ? "text-red-600" : "text-amber-600"
            }`} />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-1">
                {imm.alerte_predictive.niveau === "CRITIQUE" ? "Alerte de Panne Critique" : "Avertissement Maintenance"}
              </h4>
              <p className="text-sm font-medium">{imm.alerte_predictive.message}</p>
            </div>
          </div>
        )}

        {/* Lifecycle Map */}
        {renderLifecycleMap()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informations Générales */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4">
                <div className="text-sm text-slate-500">Date d'acquisition</div>
                <div className="text-sm font-medium">{new Date(imm.date_acquisition).toLocaleDateString("fr-FR")}</div>

                <div className="text-sm text-slate-500">Numéro de série</div>
                <div className="text-sm font-medium">{imm.numero_serie || "-"}</div>

                <div className="text-sm text-slate-500">Mise en service</div>
                <div className="text-sm font-medium">{imm.date_mise_en_service ? new Date(imm.date_mise_en_service).toLocaleDateString("fr-FR") : "-"}</div>

                <div className="text-sm text-slate-500">Fin de garantie</div>
                <div className="text-sm font-medium">{imm.date_fin_garantie ? new Date(imm.date_fin_garantie).toLocaleDateString("fr-FR") : "-"}</div>

                <div className="text-sm text-slate-500">État physique</div>
                <div className="text-sm font-medium">{imm.etat_physique || "-"}</div>
              </div>

              {imm.description && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Description</div>
                  <p className="text-sm text-slate-700">{imm.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations Financières */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg">Informations Financières</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4">
                <div className="text-sm text-slate-500">Valeur brute</div>
                <div className="text-sm font-medium">{formatCurrency(imm.valeur_brute)}</div>

                <div className="text-sm text-slate-500">TVA récupérable</div>
                <div className="text-sm font-medium">{formatCurrency(imm.tva_recuperable || "0")}</div>

                <div className="text-sm text-slate-500">Amortissement antérieur</div>
                <div className="text-sm font-medium">{formatCurrency(imm.amortissement_anterieur || "0")}</div>

                <div className="text-sm text-slate-500">Mode de calcul</div>
                <div className="text-sm font-medium">{imm.mode_calcul}</div>

                <div className="text-sm text-slate-500">Taux d'amortissement</div>
                <div className="text-sm font-medium">{imm.taux_amortissement ? `${imm.taux_amortissement}%` : "-"}</div>

                <div className="text-sm text-slate-500">Numéro de facture</div>
                <div className="text-sm font-medium">{imm.numero_facture || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Attributs Dynamiques */}
          {attributs && attributs.length > 0 && (
            <Card className="border-slate-200 shadow-sm md:col-span-2">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg">Attributs reliés à la famille {famille?.nom}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {attributs.map((attr: AttributDynamique) => {
                    const valeurObj = valeursAttributs?.find(v => v.attribut === attr.id_attribut);
                    let displayValue = "-";

                    if (valeurObj) {
                      if (attr.type_donnee === TypeDonnee.LISTE) {
                        const optionId = valeurObj.option || Number(valeurObj.valeur);
                        if (optionId) {
                          const optionObj = optionsMap[attr.id_attribut]?.find(o => String(o.id) === String(optionId));
                          displayValue = optionObj ? optionObj.libelle : String(optionId);
                        }
                      } else if (attr.type_donnee === TypeDonnee.BOOLEEN) {
                        displayValue = valeurObj.valeur === "true" ? "Oui" : "Non";
                      } else if (valeurObj.valeur) {
                        displayValue = valeurObj.valeur;
                      }
                    }

                    return (
                      <div key={attr.id_attribut}>
                        <div className="text-sm text-slate-500 mb-1">{attr.libelle}</div>
                        <div className="text-sm font-medium">{displayValue}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations de Sortie */}
          {(imm.date_cession || imm.motif_sortie) && (
            <Card className="border-slate-200 shadow-sm md:col-span-2 border-l-4 border-l-red-500">
              <CardHeader className="bg-red-50 border-b border-red-100">
                <CardTitle className="text-lg text-red-800">Informations de Sortie (Réforme / Cession)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-y-4">
                  <div className="text-sm text-red-600">Date de cession</div>
                  <div className="text-sm font-medium col-span-2">{imm.date_cession ? new Date(imm.date_cession).toLocaleDateString("fr-FR") : "-"}</div>

                  <div className="text-sm text-red-600">Prix de cession</div>
                  <div className="text-sm font-medium col-span-2">{imm.prix_cession ? formatCurrency(imm.prix_cession) : "-"}</div>

                  <div className="text-sm text-red-600">Motif de sortie</div>
                  <div className="text-sm font-medium col-span-2">{imm.motif_sortie?.replace(/_/g, " ") || "-"}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 mt-8">
          <DocumentsRequisPanel immobilisationId={id} />
        </div>

        {/* Audit & Maintenance */}
        <Card className="border-slate-200 shadow-sm mt-8">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg">Audit & Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4">
              <div className="text-sm text-slate-500">Créé par</div>
              <div className="text-sm font-medium">{imm.cree_par_nom || "-"}</div>

              <div className="text-sm text-slate-500">Date de création</div>
              <div className="text-sm font-medium">{imm.date_creation ? new Date(imm.date_creation).toLocaleString("fr-FR") : "-"}</div>

              <div className="text-sm text-slate-500">Dernière maintenance</div>
              <div className="text-sm font-medium">{imm.date_derniere_maintenance ? new Date(imm.date_derniere_maintenance).toLocaleDateString("fr-FR") : "-"}</div>

              <div className="text-sm text-slate-500">Modifié par</div>
              <div className="text-sm font-medium">{imm.modifie_par_nom || "-"}</div>

              <div className="text-sm text-slate-500">Dernière modif.</div>
              <div className="text-sm font-medium">{imm.date_derniere_modification ? new Date(imm.date_derniere_modification).toLocaleString("fr-FR") : "-"}</div>

              <div className="text-sm text-slate-500">Prochaine maintenance</div>
              <div className="text-sm font-medium">{imm.date_prochaine_maintenance ? new Date(imm.date_prochaine_maintenance).toLocaleDateString("fr-FR") : "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Historique Timeline */}
        <HistoriqueTimeline
          immobilisationId={id}
          attributs={attributs}
          optionsMap={optionsMap}
          immobilisation={imm}
          famille={famille}
        />
      </div>

      {/* Dialogs */}
      <ImmobilisationFormDialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationArchiveDialog isOpen={isArchiveDialogOpen} onClose={() => setIsArchiveDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationRestoreDialog isOpen={isRestoreDialogOpen} onClose={() => setIsRestoreDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationDeleteDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationActivateDialog isOpen={isActivateDialogOpen} onClose={() => setIsActivateDialogOpen(false)} immobilisation={imm} />
      <ReformerDialog isOpen={isReformerDialogOpen} onClose={() => setIsReformerDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationHorsServiceDialog isOpen={isHorsServiceDialogOpen} onClose={() => setIsHorsServiceDialogOpen(false)} immobilisation={imm} />
      <ImmobilisationRemettreEnServiceDialog isOpen={isRemettreEnServiceDialogOpen} onClose={() => setIsRemettreEnServiceDialogOpen(false)} immobilisation={imm} />
    </div>
  );
}
