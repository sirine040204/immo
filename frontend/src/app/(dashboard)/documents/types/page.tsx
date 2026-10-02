"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Archive, RotateCcw, Trash2, Search, ChevronLeft, ChevronRight, FileType, CheckCircle, Clock } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";

import { TypeDocument } from "@/features/documents/types/type-document";
import { fetchTypeDocuments } from "@/features/documents/api/types-document";
import { TypeDocumentDialog } from "@/features/documents/components/TypeDocumentDialog";
import { TypeDocumentArchiveDialog } from "@/features/documents/components/TypeDocumentArchiveDialog";
import { TypeDocumentRestoreDialog } from "@/features/documents/components/TypeDocumentRestoreDialog";
import { TypeDocumentDeleteDialog } from "@/features/documents/components/TypeDocumentDeleteDialog";
import { TypeDocumentDetailsDialog } from "@/features/documents/components/TypeDocumentDetailsDialog";
import { TypeDocumentFamilleDialog } from "@/features/documents/components/TypeDocumentFamilleDialog";

export default function TypeDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "ARCHIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isFamilleDialogOpen, setIsFamilleDialogOpen] = useState(false);
  const [selectedTypeDocument, setSelectedTypeDocument] = useState<TypeDocument | null>(null);

  const { data: typeDocuments, isLoading, isError, refetch } = useQuery({
    queryKey: ["type-documents"],
    queryFn: fetchTypeDocuments,
  });

  const filteredTypeDocuments = typeDocuments?.filter((td) => {
    const searchStr = `${td.code} ${td.nom} ${td.description || ""}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || td.statut === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredTypeDocuments.length / itemsPerPage);

  const currentTypeDocuments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTypeDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTypeDocuments, currentPage, itemsPerPage]);


  const handleCreateClick = () => {
    setSelectedTypeDocument(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (td: TypeDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTypeDocument(td);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (td: TypeDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTypeDocument(td);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (td: TypeDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTypeDocument(td);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (td: TypeDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTypeDocument(td);
    setIsDeleteDialogOpen(true);
  };

  const handleRowClick = (td: TypeDocument) => {
    setSelectedTypeDocument(td);
    setIsDetailsDialogOpen(true);
  };

  if (isError) {
    return <ErrorMessage message="Erreur lors du chargement des types de documents." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Types de Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les catégories de documents de votre entreprise
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button 
            onClick={() => setIsFamilleDialogOpen(true)} 
            variant="outline" 
            className="text-slate-700 border-slate-200"
          >
            <FileType className="w-4 h-4 mr-2" />
            Gérer les relations Familles
          </Button>
          <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un type
          </Button>
        </div>
      </div>

      {/* Table section with integrated filters */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Rechercher par code ou nom..."
                className="pl-9 bg-white w-full"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: string | null) => {
                if (value) {
                  setStatusFilter(value as "ALL" | "ACTIF" | "ARCHIVE");
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-white">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs</SelectItem>
                <SelectItem value="ARCHIVE">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total : {filteredTypeDocuments.length} type{filteredTypeDocuments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="w-8 h-8 animate-spin mb-4 border-4 border-brand-green/20 border-t-brand-green rounded-full" />
            <p>Chargement des types de documents...</p>
          </div>
        ) : filteredTypeDocuments.length > 0 ? (
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">Code</TableHead>
                  <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">Options</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center w-[120px]">Statut</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTypeDocuments.map((td) => (
                  <TableRow 
                    key={td.id_type_document}
                    onClick={() => handleRowClick(td)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{td.code}</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {td.nom}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 max-w-[200px] truncate">
                      {td.description || "-"}
                    </TableCell>
                    <TableCell>
                      {td.a_echeance ? (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 flex w-fit items-center gap-1">
                          <Clock className="h-3 w-3" /> Échéance
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          td.statut === "ACTIF" 
                            ? "bg-brand-green-light text-brand-green border-brand-green/20" 
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {td.statut === "ACTIF" ? "Actif" : "Archivé"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        {td.statut === "ACTIF" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditClick(td, e)}
                              title="Modifier"
                              className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleArchiveClick(td, e)}
                              title="Archiver"
                              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleRestoreClick(td, e)}
                              title="Restaurer"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteClick(td, e)}
                              title="Supprimer définitivement"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState
              icon={FileType}
              title="Aucun type de document"
              description={
                searchQuery || statusFilter !== "ALL"
                  ? "Aucun type ne correspond à vos critères de recherche."
                  : "Commencez par ajouter votre premier type de document."
              }
              actionLabel={
                !searchQuery && statusFilter === "ALL" ? "Ajouter un type" : undefined
              }
              onAction={
                !searchQuery && statusFilter === "ALL" ? handleCreateClick : undefined
              }
            />
          </div>
        )}

        {/* Compact Pagination Footer */}
        {filteredTypeDocuments.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(val: string | null) => {
                  if (val) {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredTypeDocuments.length)} of {filteredTypeDocuments.length}
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
      </div>

      <TypeDocumentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        typeDocument={selectedTypeDocument}
      />

      <TypeDocumentArchiveDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        typeDocument={selectedTypeDocument}
      />

      <TypeDocumentRestoreDialog
        open={isRestoreDialogOpen}
        onOpenChange={setIsRestoreDialogOpen}
        typeDocument={selectedTypeDocument}
      />

      <TypeDocumentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        typeDocument={selectedTypeDocument}
      />

      <TypeDocumentDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        typeDocument={selectedTypeDocument}
      />

      <TypeDocumentFamilleDialog 
        open={isFamilleDialogOpen}
        onOpenChange={setIsFamilleDialogOpen}
      />
    </div>
  );
}
