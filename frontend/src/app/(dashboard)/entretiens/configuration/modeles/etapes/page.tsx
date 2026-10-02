"use client";
// Force TS reload

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchEtapesEntretien } from "../../../../../../features/maintenance/api/etapesEntretien";
import { fetchModelesEntretien } from "../../../../../../features/maintenance/api/modelesEntretien";
import { EtapeEntretien } from "../../../../../../features/maintenance/types/etapeEntretien";
import { Plus, Edit2, Archive, Trash2, RotateCcw, Search, Filter, ListOrdered, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { EtapeEntretienDialog } from "../../../../../../features/maintenance/components/EtapeEntretienDialog";
import { EtapeEntretienArchiveDialog } from "../../../../../../features/maintenance/components/EtapeEntretienArchiveDialog";
import { EtapeEntretienRestoreDialog } from "../../../../../../features/maintenance/components/EtapeEntretienRestoreDialog";
import { EtapeEntretienDeleteDialog } from "../../../../../../features/maintenance/components/EtapeEntretienDeleteDialog";

export default function EtapesEntretienPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeleIdParam = searchParams.get("modeleId");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "ARCHIVE">("ALL");
  const [modeleFilter, setModeleFilter] = useState<"ALL" | string>(modeleIdParam || "ALL");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEtape, setSelectedEtape] = useState<EtapeEntretien | null>(null);
  const [defaultModeleId, setDefaultModeleId] = useState<number | null>(null);

  const { data: etapes, isLoading, isError, refetch } = useQuery<EtapeEntretien[]>({
    queryKey: ["etapes-entretien"],
    queryFn: fetchEtapesEntretien,
  });

  const { data: modeles } = useQuery({
    queryKey: ["modeles-entretien"],
    queryFn: fetchModelesEntretien,
  });

  const filteredEtapes = etapes?.filter((etape) => {
    const searchStr = `${etape.libelle}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || etape.statut === statusFilter;
    const matchesModele = modeleFilter === "ALL" || etape.modele_entretien.toString() === modeleFilter;
    return matchesSearch && matchesStatus && matchesModele;
  }) || [];

  const groupedEtapes = React.useMemo(() => {
    const groups: Record<number, EtapeEntretien[]> = {};
    filteredEtapes.forEach(etape => {
      if (!groups[etape.modele_entretien]) {
        groups[etape.modele_entretien] = [];
      }
      groups[etape.modele_entretien].push(etape);
    });
    
    Object.keys(groups).forEach(key => {
      groups[Number(key)].sort((a, b) => a.ordre - b.ordre);
    });
    
    return groups;
  }, [filteredEtapes]);

  const handleCreateClick = () => {
    setSelectedEtape(null);
    setDefaultModeleId(modeleFilter !== "ALL" ? Number(modeleFilter) : null);
    setIsDialogOpen(true);
  };

  const handleCreateForModeleClick = (modeleId: number) => {
    setSelectedEtape(null);
    setDefaultModeleId(modeleId);
    setIsDialogOpen(true);
  };

  const handleEditClick = (etape: EtapeEntretien) => {
    setSelectedEtape(etape);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (etape: EtapeEntretien) => {
    setSelectedEtape(etape);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (etape: EtapeEntretien) => {
    setSelectedEtape(etape);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (etape: EtapeEntretien) => {
    setSelectedEtape(etape);
    setIsDeleteDialogOpen(true);
  };

  const handleArchiveRequest = (etape: EtapeEntretien) => {
    setSelectedEtape(etape);
    setIsArchiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/entretiens/configuration/modeles')}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Étapes d'Entretien</h1>
            <p className="text-slate-500 mt-1">
              Gérez les séquences d'étapes configurées pour chaque modèle d'entretien.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle étape
          </Button>
        </div>
      </div>

      <div className="p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-4 bg-white rounded-lg shadow-sm">
        <div className="relative flex-1 min-w-[250px] w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par libellé..."
            className="pl-9 bg-slate-50 border-slate-200 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={modeleFilter} onValueChange={(v) => setModeleFilter(v || "ALL")}>
            <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200 h-9">
              <div className="flex items-center gap-2 line-clamp-1">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span data-slot="select-value">
                  {modeleFilter === "ALL" ? "Tous les modèles" : modeles?.find(m => m.id.toString() === modeleFilter)?.nom}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les modèles</SelectItem>
              {modeles?.map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200 h-9">
              <span data-slot="select-value" className="line-clamp-1 text-left">
                {statusFilter === "ALL" ? "Tous les statuts" : statusFilter === "ACTIF" ? "Actives" : "Archivées"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="ACTIF">Actives</SelectItem>
              <SelectItem value="ARCHIVE">Archivées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:ml-auto text-sm text-slate-500 font-medium whitespace-nowrap">
          Total : {filteredEtapes.length} étape{filteredEtapes.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse bg-white rounded-lg border border-slate-200 shadow-sm">Chargement des étapes...</div>
      ) : isError ? (
        <div className="p-6 flex flex-col items-center gap-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <ErrorMessage
            title="Erreur de chargement"
            message="Impossible de charger les étapes d'entretien. Veuillez réessayer."
          />
          <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
        </div>
      ) : filteredEtapes && filteredEtapes.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedEtapes).map(([modeleId, etapesGroup]) => {
            const modele = modeles?.find(m => m.id === Number(modeleId));
            return (
              <Card key={modeleId} className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-brand-green" />
                      {modele?.nom || `Modèle #${modeleId}`}
                      <span className="text-sm font-normal text-slate-500 ml-2">({modele?.code})</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{etapesGroup.length} étape(s) configurée(s) pour ce modèle</p>
                  </div>
                  <Button onClick={() => handleCreateForModeleClick(Number(modeleId))} variant="outline" size="sm" className="bg-white hover:bg-slate-50">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter une étape
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="flex flex-col relative pb-4">
                    {/* Continuous vertical line for the timeline */}
                    <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200" />
                    
                    {etapesGroup.map((etape) => (
                      <div key={etape.id} className="group relative flex items-start p-4 pl-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col items-center mr-4 mt-0.5 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white ${etape.statut === "ACTIF" ? "bg-brand-green-light text-brand-green border border-brand-green/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                            {etape.ordre}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-lg p-4 shadow-sm group-hover:border-slate-200 transition-colors relative">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-medium text-base ${etape.statut === "ACTIF" ? "text-slate-900" : "text-slate-500"}`}>{etape.libelle}</h4>
                                {etape.obligatoire && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-0 h-5">Obligatoire</Badge>
                                )}
                                {etape.statut === "ARCHIVE" && (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 text-xs py-0 h-5">Archivée</Badge>
                                )}
                              </div>
                              {etape.description && (
                                <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{etape.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50/80 rounded-md p-1">
                              {etape.statut === "ACTIF" ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleEditClick(etape)}
                                    title="Modifier cette étape"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                    onClick={() => handleArchiveClick(etape)}
                                    title="Archiver cette étape"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteClick(etape)}
                                    title="Supprimer cette étape"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                    onClick={() => handleRestoreClick(etape)}
                                    title="Restaurer cette étape"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteClick(etape)}
                                    title="Supprimer définitivement cette étape"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-lg border border-slate-200 shadow-sm">
          <EmptyState
            icon={ListOrdered}
            title="Aucune étape trouvée"
            description={searchQuery ? "Aucune étape ne correspond à votre recherche." : "Vous n'avez pas encore configuré d'étapes d'entretien. Commencez par en créer une !"}
            actionLabel={searchQuery ? "Effacer la recherche" : "Créer une étape"}
            onAction={() => searchQuery ? setSearchQuery("") : handleCreateClick()}
          />
        </div>
      )}

      <EtapeEntretienDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        etapeEntretien={selectedEtape}
        defaultModeleId={defaultModeleId}
        allEtapes={etapes || []}
      />

      <EtapeEntretienArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        etape={selectedEtape}
      />

      <EtapeEntretienRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        etape={selectedEtape}
        allEtapes={etapes || []}
      />

      <EtapeEntretienDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        etape={selectedEtape}
        onArchiveRequest={handleArchiveRequest}
      />
    </div>
  );
}
