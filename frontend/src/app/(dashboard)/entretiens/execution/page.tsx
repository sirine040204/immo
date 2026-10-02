"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchInterventions } from "@/features/maintenance/api/interventions";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { fetchModelesEntretien } from "@/features/maintenance/api/modelesEntretien";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchRapportsInterventions } from "@/features/maintenance/api/rapportsInterventions";
import { Intervention, StatutIntervention } from "@/features/maintenance/types/intervention";
import { Plus, Search, Calendar, FileWarning, Wrench, Settings, Filter, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
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
import { InterventionDialog } from "@/features/maintenance/components/InterventionDialog";
import { RapportInterventionDialog } from "@/features/maintenance/components/RapportInterventionDialog";

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

export default function ExécutionPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<"ALL" | StatutIntervention>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCorrectiveMode, setIsCorrectiveMode] = useState(false);

  const [rapportDialogOpen, setRapportDialogOpen] = useState(false);
  const [selectedInterventionId, setSelectedInterventionId] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: interventions, isLoading, isError, refetch } = useQuery({
    queryKey: ["interventions"],
    queryFn: fetchInterventions,
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const { data: types } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
  });

  const { data: modeles } = useQuery({
    queryKey: ["modeles-entretien"],
    queryFn: fetchModelesEntretien,
  });

  const { data: rapports } = useQuery({
    queryKey: ["rapports-interventions"],
    queryFn: fetchRapportsInterventions,
  });

  const getImmobilisationName = (id: number) => {
    const immo = immobilisations?.find(i => i.id_immobilisation === id);
    return immo ? `${immo.code} - ${immo.designation}` : `Immo #${id}`;
  };

  const getTypeName = (id: number) => {
    return types?.find(t => t.id === id)?.nom || `Type #${id}`;
  };

  const getModeleName = (id: number | null) => {
    if (!id) return "N/A";
    return modeles?.find(m => m.id === id)?.nom || `Modèle #${id}`;
  };

  const filteredInterventions = interventions?.filter(inv => {
    const searchStr = `${inv.id} ${inv.motif} ${getImmobilisationName(inv.immobilisation)}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatut = statutFilter === "ALL" || inv.statut === statutFilter;
    const matchesType = typeFilter === "ALL" || inv.type_entretien.toString() === typeFilter;
    return matchesSearch && matchesStatut && matchesType;
  }) || [];

  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);

  const currentInterventions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInterventions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInterventions, currentPage, itemsPerPage]);

  const handleCreateStandard = () => {
    setIsCorrectiveMode(false);
    setIsDialogOpen(true);
  };

  const handleCreateCorrective = () => {
    setIsCorrectiveMode(true);
    setIsDialogOpen(true);
  };

  const openRapportDialog = (e: React.MouseEvent, interventionId: number) => {
    e.stopPropagation();
    setSelectedInterventionId(interventionId);
    setRapportDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exécution des Interventions</h1>
          <p className="text-slate-500 mt-1">
            Gérez le cycle de vie de vos interventions préventives et correctives.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleCreateStandard} className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle intervention standard
          </Button>
          <Button onClick={handleCreateCorrective} variant="outline" className="w-full sm:w-auto border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800">
            <FileWarning className="w-4 h-4 mr-2" />
            Nouvelle intervention corrective
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-white rounded-t-lg">
          <div className="relative flex-1 min-w-[250px] w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par ID, motif, immobilisation..."
              className="pl-9 bg-slate-50 border-slate-200 h-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v as any); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9">
                <div className="flex items-center gap-2 line-clamp-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span data-slot="select-value">
                    {statutFilter === "ALL" ? "Tous les statuts" : statutFilter}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="BROUILLON">Brouillon</SelectItem>
                <SelectItem value="PLANIFIEE">Planifiée</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="TERMINEE">Terminée</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9">
                <span data-slot="select-value" className="line-clamp-1 text-left">
                  {typeFilter === "ALL" ? "Tous les types" : types?.find(t => t.id.toString() === typeFilter)?.nom}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {types?.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:ml-auto text-sm text-slate-500 font-medium whitespace-nowrap">
            Total : {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des interventions...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les interventions. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredInterventions && filteredInterventions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Immobilisation</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type / Modèle</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date Prévue</TableHead>
                    <TableHead className="font-semibold text-slate-700">Priorité</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInterventions.map((inv) => {
                    const rapport = rapports?.find(r => r.intervention === inv.id);
                    return (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/entretiens/execution/${inv.id}`)}
                    >
                      <TableCell className="text-slate-900 font-medium">
                        {getImmobilisationName(inv.immobilisation)}
                        {inv.motif && <div className="text-xs text-slate-500 truncate max-w-[200px]" title={inv.motif}>{inv.motif}</div>}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="font-medium">{getTypeName(inv.type_entretien)}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{getModeleName(inv.modele_entretien)}</div>
                      </TableCell>
                      <TableCell>
                        {inv.date_prevue ? (
                          <div className="flex items-center text-slate-700 text-sm">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {inv.date_prevue}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Non planifiée</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPrioriteBadge(inv.priorite)}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(inv.statut)}
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.statut === "TERMINEE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openRapportDialog(e, inv.id)}
                            className="text-slate-500 hover:text-brand-green hover:bg-brand-green-light"
                          >
                            <FileText className="w-4 h-4 mr-1.5" />
                            {rapport ? "Voir le rapport" : "Rapport"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={Wrench}
                title="Aucune intervention trouvée"
                description={searchQuery ? "Aucune intervention ne correspond à votre recherche." : "Vous n'avez pas encore d'intervention enregistrée."}
                actionLabel={searchQuery ? "Effacer la recherche" : "Créer une intervention"}
                onAction={() => searchQuery ? setSearchQuery("") : handleCreateStandard()}
              />
            </div>
          )}
        </CardContent>

        {/* Compact Pagination Footer */}
        {filteredInterventions && filteredInterventions.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500 rounded-b-lg">
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-fit border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-0">
                  <SelectValue placeholder={`${itemsPerPage} par page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="25">25 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                  <SelectItem value="100">100 par page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredInterventions.length)} sur {filteredInterventions.length}
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <InterventionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isCorrectiveMode={isCorrectiveMode}
      />

      <RapportInterventionDialog
        isOpen={rapportDialogOpen}
        onClose={() => setRapportDialogOpen(false)}
        interventionId={selectedInterventionId}
        rapport={rapports?.find(r => r.intervention === selectedInterventionId)}
        interventionDetails={
          (() => {
            const inv = interventions?.find(i => i.id === selectedInterventionId);
            if (!inv) return undefined;
            return {
              immoName: getImmobilisationName(inv.immobilisation),
              typeName: getTypeName(inv.type_entretien),
              modeleName: getModeleName(inv.modele_entretien),
              motif: inv.motif,
              priorite: inv.priorite,
              dateDemande: inv.date_demande,
              datePrevue: inv.date_prevue || undefined,
              dateDebut: inv.date_debut || undefined,
              dateFin: inv.date_fin || undefined
            };
          })()
        }
      />
    </div>
  );
}
