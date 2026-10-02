"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { Famille } from "@/features/immobilisations/types/famille";
import { Plus, Edit2, Eye, Trash2, Archive, Box, Search, ChevronLeft, ChevronRight, RotateCcw, Settings } from "lucide-react";
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
import { FamilleDialog } from "@/features/immobilisations/components/FamilleDialog";
import { FamilleArchiveDialog } from "@/features/immobilisations/components/FamilleArchiveDialog";
import { FamilleRestoreDialog } from "@/features/immobilisations/components/FamilleRestoreDialog";
import { FamilleDeleteDialog } from "@/features/immobilisations/components/FamilleDeleteDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export default function FamillesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVEE">("ALL");
  const [isFamilleDialogOpen, setIsFamilleDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFamille, setSelectedFamille] = useState<Famille | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: familles, isLoading, isError, refetch } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const filteredFamilles = familles?.filter((famille) => {
    const searchStr = `${famille.code} ${famille.nom}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || famille.statut === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredFamilles.length / itemsPerPage);

  const currentFamilles = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFamilles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFamilles, currentPage, itemsPerPage]);

  const activeCount = familles?.filter((f) => f.statut === "ACTIVE").length || 0;

  const handleCreateClick = () => {
    setSelectedFamille(null);
    setIsFamilleDialogOpen(true);
  };

  const handleEditClick = (famille: Famille, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFamille(famille);
    setIsFamilleDialogOpen(true);
  };

  const handleArchiveClick = (famille: Famille, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFamille(famille);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (famille: Famille, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFamille(famille);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (famille: Famille, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFamille(famille);
    setIsDeleteDialogOpen(true);
  };

  const handleRowClick = (familleId: number) => {
    router.push(`/immobilisations/familles/${familleId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Familles d'immobilisations</h1>
          <p className="text-slate-500 mt-1">
            Gérez les familles d'actifs pour structurer vos immobilisations.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => router.push("/immobilisations/familles/attribut-dynamique")}
            variant="outline"
            className="border-slate-200 text-slate-700 bg-white shadow-sm hover:bg-slate-50"
          >
            <Settings className="w-4 h-4 mr-2 text-slate-500" />
            Gestion des attributs dynamiques
          </Button>
          <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une famille
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-green" />
              Liste des familles
            </CardTitle>
            <CardDescription>
              {activeCount} famille(s) active(s) dans votre entreprise.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actives uniquement</SelectItem>
                <SelectItem value="ARCHIVEE">Archivées uniquement</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une famille..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand-green"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des familles...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les familles. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredFamilles && filteredFamilles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nom de la famille</TableHead>
                    <TableHead className="font-semibold text-slate-700">Taux d'amort. (%)</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFamilles.map((famille) => (
                    <TableRow
                      key={famille.id_famille}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() => handleRowClick(famille.id_famille)}
                    >
                      <TableCell className="font-medium text-slate-900">
                        {famille.code}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {famille.nom}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {famille.taux_amortissement !== null ? `${famille.taux_amortissement}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={famille.statut === "ACTIVE" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {famille.statut === "ACTIVE" ? "Active" : "Archivée"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {famille.statut === "ACTIVE" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                onClick={(e) => { e.stopPropagation(); router.push(`/immobilisations/familles/${famille.id_famille}`); }}
                                title="Voir la famille"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(famille, e); }}
                                title="Modifier cette famille"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleArchiveClick(famille, e); }}
                                title="Archiver cette famille"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                onClick={(e) => { e.stopPropagation(); handleRestoreClick(famille, e); }}
                                title="Restaurer cette famille"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(famille, e); }}
                                title="Supprimer définitivement cette famille"
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
                icon={Box}
                title="Aucune famille trouvée"
                description={searchQuery ? "Aucune famille ne correspond à votre recherche." : "Vous n'avez pas encore créé de famille d'immobilisations. Commencez par en ajouter une !"}
                actionLabel={searchQuery ? "Effacer la recherche" : "Ajouter une famille"}
                onAction={() => searchQuery ? setSearchQuery("") : handleCreateClick()}
              />
            </div>
          )}
        </CardContent>
        {/* Compact Pagination Footer */}
        {filteredFamilles && filteredFamilles.length > 0 && (
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
                  <SelectValue placeholder={`${itemsPerPage} per page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredFamilles.length)} of {filteredFamilles.length}
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

      <FamilleDialog
        isOpen={isFamilleDialogOpen}
        onClose={() => setIsFamilleDialogOpen(false)}
        famille={selectedFamille}
      />

      <FamilleArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        famille={selectedFamille}
      />

      <FamilleRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        famille={selectedFamille}
      />

      <FamilleDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        famille={selectedFamille}
      />
    </div>
  );
}
