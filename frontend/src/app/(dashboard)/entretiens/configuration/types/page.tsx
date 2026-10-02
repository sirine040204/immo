"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { TypeEntretien } from "@/features/maintenance/types/typeEntretien";
import { Plus, Edit2, Archive, Trash2, RotateCcw, Search, Settings, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
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
import { TypeEntretienDialog } from "@/features/maintenance/components/TypeEntretienDialog";
import { TypeEntretienArchiveDialog } from "@/features/maintenance/components/TypeEntretienArchiveDialog";
import { TypeEntretienRestoreDialog } from "@/features/maintenance/components/TypeEntretienRestoreDialog";
import { TypeEntretienDeleteDialog } from "@/features/maintenance/components/TypeEntretienDeleteDialog";

export default function TypesEntretienPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "ARCHIVE">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeEntretien | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: types, isLoading, isError, refetch } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
  });

  const filteredTypes = types?.filter((type) => {
    const searchStr = `${type.code} ${type.nom}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || type.statut === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  const currentTypes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTypes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTypes, currentPage, itemsPerPage]);

  const activeCount = types?.filter((t) => t.statut === "ACTIF").length || 0;

  const handleCreateClick = () => {
    setSelectedType(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (type: TypeEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedType(type);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (type: TypeEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedType(type);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (type: TypeEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedType(type);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (type: TypeEntretien, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedType(type);
    setIsDeleteDialogOpen(true);
  };

  // Called from DeleteDialog if user clicks "Archiver plutôt"
  const handleArchiveRequest = (type: TypeEntretien) => {
    setSelectedType(type);
    setIsArchiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Types d'Entretiens</h1>
          <p className="text-slate-500 mt-1">
            Gérez les différents types de maintenance pour votre entreprise.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un type
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-green" />
              Liste des types d'entretiens
            </CardTitle>
            <CardDescription>
              {activeCount} type(s) actif(s) dans votre entreprise.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs uniquement</SelectItem>
                <SelectItem value="ARCHIVE">Archivés uniquement</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un type..."
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
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des types d'entretiens...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les types d'entretiens. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredTypes && filteredTypes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-32">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[40%]">Description</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTypes.map((type) => (
                    <TableRow
                      key={type.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {type.code}
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {type.nom}
                      </TableCell>
                      <TableCell className="text-slate-500 truncate max-w-[200px]" title={type.description}>
                        {type.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={type.statut === "ACTIF" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {type.statut === "ACTIF" ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {type.statut === "ACTIF" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => handleEditClick(type, e)}
                                title="Modifier ce type d'entretien"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                onClick={(e) => handleArchiveClick(type, e)}
                                title="Archiver ce type d'entretien"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteClick(type, e)}
                                title="Supprimer ce type d'entretien"
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
                                onClick={(e) => handleRestoreClick(type, e)}
                                title="Restaurer ce type d'entretien"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteClick(type, e)}
                                title="Supprimer définitivement ce type d'entretien"
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
                icon={Wrench}
                title="Aucun type d'entretien trouvé"
                description={searchQuery ? "Aucun type ne correspond à votre recherche." : "Vous n'avez pas encore créé de type d'entretien. Commencez par en ajouter un !"}
                actionLabel={searchQuery ? "Effacer la recherche" : "Ajouter un type"}
                onAction={() => searchQuery ? setSearchQuery("") : handleCreateClick()}
              />
            </div>
          )}
        </CardContent>
        {/* Compact Pagination Footer */}
        {filteredTypes && filteredTypes.length > 0 && (
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTypes.length)} sur {filteredTypes.length}
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

      <TypeEntretienDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        typeEntretien={selectedType}
      />

      <TypeEntretienArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        typeEntretien={selectedType}
      />

      <TypeEntretienRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        typeEntretien={selectedType}
      />

      <TypeEntretienDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        typeEntretien={selectedType}
        onArchiveRequest={handleArchiveRequest}
      />
    </div>
  );
}
