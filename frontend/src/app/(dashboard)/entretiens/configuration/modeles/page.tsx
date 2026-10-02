"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchModelesEntretien } from "@/features/maintenance/api/modelesEntretien";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { ModeleEntretien, TypePlanification } from "@/features/maintenance/types/modeleEntretien";
import { Plus, Edit2, Archive, Trash2, RotateCcw, Search, Settings, Calendar, Clock, Activity, Settings2, ChevronLeft, ChevronRight, Filter, ListOrdered } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
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
import { ModeleEntretienDialog } from "@/features/maintenance/components/ModeleEntretienDialog";
import { ModeleEntretienArchiveDialog } from "@/features/maintenance/components/ModeleEntretienArchiveDialog";
import { ModeleEntretienRestoreDialog } from "@/features/maintenance/components/ModeleEntretienRestoreDialog";
import { ModeleEntretienDeleteDialog } from "@/features/maintenance/components/ModeleEntretienDeleteDialog";

const getPlanificationIcon = (type: TypePlanification) => {
  switch (type) {
    case "TEMPS": return <Clock className="w-4 h-4 text-blue-500" />;
    case "USAGE": return <Activity className="w-4 h-4 text-purple-500" />;
    case "DATE_FIXE": return <Calendar className="w-4 h-4 text-amber-500" />;
    case "MANUELLE": return <Settings2 className="w-4 h-4 text-slate-500" />;
    default: return null;
  }
};

const getPlanificationBadge = (modele: ModeleEntretien) => {
  switch (modele.type_planification) {
    case "TEMPS":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        {modele.periodicite} {modele.unite_periodicite}
      </Badge>;
    case "USAGE":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Activity className="w-3 h-3 mr-1" />
        {modele.seuil_usage} {modele.unite_usage}
      </Badge>;
    case "DATE_FIXE":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <Calendar className="w-3 h-3 mr-1" />
        {modele.date_fixe}
      </Badge>;
    case "MANUELLE":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
        <Settings2 className="w-3 h-3 mr-1" />
        Manuelle
      </Badge>;
  }
};

export default function ModelesEntretienPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "ARCHIVE">("ALL");
  const [familleFilter, setFamilleFilter] = useState<"ALL" | string>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModele, setSelectedModele] = useState<ModeleEntretien | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: modeles, isLoading, isError, refetch } = useQuery({
    queryKey: ["modeles-entretien"],
    queryFn: fetchModelesEntretien,
  });

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const { data: typesEntretien } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
  });

  const getFamilleName = (id: number) => {
    return familles?.find((f) => f.id_famille === id)?.nom || `Famille #${id}`;
  };

  const getTypeEntretienName = (id: number) => {
    return typesEntretien?.find((t) => t.id === id)?.nom || `Type #${id}`;
  };

  const filteredModeles = modeles?.filter((modele) => {
    const searchStr = `${modele.code} ${modele.nom}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || modele.statut === statusFilter;
    const matchesFamille = familleFilter === "ALL" || modele.famille.toString() === familleFilter;
    const matchesType = typeFilter === "ALL" || modele.type_entretien.toString() === typeFilter;
    return matchesSearch && matchesStatus && matchesFamille && matchesType;
  }) || [];

  const totalPages = Math.ceil(filteredModeles.length / itemsPerPage);

  const currentModeles = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredModeles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredModeles, currentPage, itemsPerPage]);

  const activeCount = modeles?.filter((m) => m.statut === "ACTIF").length || 0;

  const handleCreateClick = () => {
    setSelectedModele(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (modele: ModeleEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedModele(modele);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (modele: ModeleEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedModele(modele);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (modele: ModeleEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedModele(modele);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (modele: ModeleEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedModele(modele);
    setIsDeleteDialogOpen(true);
  };

  const handleArchiveRequest = (modele: ModeleEntretien) => {
    setSelectedModele(modele);
    setIsArchiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Modèles d'Entretiens</h1>
          <p className="text-slate-500 mt-1">
            Définissez les procédures et la planification standardisées pour la maintenance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.push('/entretiens/configuration/modeles/etapes')} className="w-full sm:w-auto shadow-sm">
            <ListOrdered className="w-4 h-4 mr-2" />
            Gestion des étapes d'entretien
          </Button>
          <Button onClick={handleCreateClick} className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau modèle
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-white rounded-t-lg">
          <div className="relative flex-1 min-w-[250px] w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par code ou désignation..."
              className="pl-9 bg-slate-50 border-slate-200 h-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={familleFilter} onValueChange={(v) => { setFamilleFilter(v || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9">
                <div className="flex items-center gap-2 line-clamp-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span data-slot="select-value">
                    {familleFilter === "ALL" ? "Toutes les familles" : familles?.find(f => f.id_famille.toString() === familleFilter)?.nom}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les familles</SelectItem>
                {familles?.map(f => (
                  <SelectItem key={f.id_famille} value={f.id_famille.toString()}>{f.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9">
                <span data-slot="select-value" className="line-clamp-1 text-left">
                  {typeFilter === "ALL" ? "Tous les types" : typesEntretien?.find(t => t.id.toString() === typeFilter)?.nom}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {typesEntretien?.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200 h-9">
                <span data-slot="select-value" className="line-clamp-1 text-left">
                  {statusFilter === "ALL" ? "Tous les statuts" : statusFilter === "ACTIF" ? "Actifs" : "Archivés"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs</SelectItem>
                <SelectItem value="ARCHIVE">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:ml-auto text-sm text-slate-500 font-medium whitespace-nowrap">
            Total : {filteredModeles.length} modèle{filteredModeles.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des modèles...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les modèles d'entretiens. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredModeles && filteredModeles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-24">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[20%]">Nom</TableHead>
                    <TableHead className="font-semibold text-slate-700">Famille</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Planification</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentModeles.map((modele) => (
                    <TableRow
                      key={modele.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/entretiens/configuration/modeles/${modele.id}`)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {modele.code}
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {modele.nom}
                        {modele.description && <div className="text-xs text-slate-500 truncate max-w-[200px]" title={modele.description}>{modele.description}</div>}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-sm">
                        {getFamilleName(modele.famille)}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-sm">
                        {getTypeEntretienName(modele.type_entretien)}
                      </TableCell>
                      <TableCell>
                        {getPlanificationBadge(modele)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={modele.statut === "ACTIF" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {modele.statut === "ACTIF" ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {modele.statut === "ACTIF" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/entretiens/configuration/modeles/etapes?modeleId=${modele.id}`);
                                }}
                                title="Voir les étapes de ce modèle"
                              >
                                <ListOrdered className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => handleEditClick(modele, e)}
                                title="Modifier ce modèle"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                onClick={(e) => handleArchiveClick(modele, e)}
                                title="Archiver ce modèle"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteClick(modele, e)}
                                title="Supprimer ce modèle"
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
                                onClick={(e) => handleRestoreClick(modele, e)}
                                title="Restaurer ce modèle"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteClick(modele, e)}
                                title="Supprimer définitivement ce modèle"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={Settings}
                title="Aucun modèle trouvé"
                description={searchQuery ? "Aucun modèle ne correspond à votre recherche." : "Vous n'avez pas encore configuré de modèle d'entretien. Commencez par en créer un !"}
                actionLabel={searchQuery ? "Effacer la recherche" : "Créer un modèle"}
                onAction={() => searchQuery ? setSearchQuery("") : handleCreateClick()}
              />
            </div>
          )}
        </CardContent>
        {/* Compact Pagination Footer */}
        {filteredModeles && filteredModeles.length > 0 && (
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredModeles.length)} sur {filteredModeles.length}
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

      <ModeleEntretienDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        modeleEntretien={selectedModele}
      />

      <ModeleEntretienArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        modeleEntretien={selectedModele}
      />

      <ModeleEntretienRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        modeleEntretien={selectedModele}
      />

      <ModeleEntretienDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        modeleEntretien={selectedModele}
        onArchiveRequest={handleArchiveRequest}
      />
    </div>
  );
}
