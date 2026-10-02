"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Archive, RotateCcw, Trash2, Search, FileText, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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

import { Document, DocumentStatut } from "@/features/documents/types/document";
import { fetchDocuments } from "@/features/documents/api/documents";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";

import { DocumentFormDialog } from "@/features/documents/components/DocumentFormDialog";
import { DocumentArchiveDialog } from "@/features/documents/components/DocumentArchiveDialog";
import { DocumentRestoreDialog } from "@/features/documents/components/DocumentRestoreDialog";
import { DocumentDeleteDialog } from "@/features/documents/components/DocumentDeleteDialog";
import { DocumentDetailsDialog } from "@/features/documents/components/DocumentDetailsDialog";
import { FilePreviewDialog } from "@/features/documents/components/FilePreviewDialog";

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DocumentStatut>("ALL");
  const [linkFilter, setLinkFilter] = useState<"ALL" | "ENTREPRISE" | "IMMOBILISATION">("ALL");
  const [selectedImmobilisationFilter, setSelectedImmobilisationFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const searchParams = useSearchParams();
  const initialHighlightId = searchParams.get("highlightId");
  const [highlightedId, setHighlightedId] = React.useState<number | null>(null);

  // We need to move the useEffect down AFTER filteredDocuments is defined, 
  // but React hooks must be at the top level. We can define the effect later.

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");

  const { data: documents, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const filteredDocuments = documents?.filter((doc) => {
    const searchStr = `${doc.nom} ${doc.type_document_nom || ""} ${doc.immobilisation_code || ""}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || doc.statut === statusFilter;
    
    let matchesLink = true;
    if (linkFilter === "ENTREPRISE") {
      matchesLink = doc.immobilisation === null;
    } else if (linkFilter === "IMMOBILISATION") {
      matchesLink = doc.immobilisation !== null;
      if (selectedImmobilisationFilter !== "ALL") {
        matchesLink = matchesLink && doc.immobilisation?.toString() === selectedImmobilisationFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesLink;
  }) || [];

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  const currentDocuments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocuments, currentPage, itemsPerPage]);

  React.useEffect(() => {
    if (initialHighlightId && filteredDocuments.length > 0) {
      const id = Number(initialHighlightId);
      setHighlightedId(id);
      
      const docIndex = filteredDocuments.findIndex(d => d.id === id);
      if (docIndex !== -1) {
        const page = Math.floor(docIndex / itemsPerPage) + 1;
        setCurrentPage(page);
      }
    }
  }, [initialHighlightId, filteredDocuments, itemsPerPage]);

  const activeCount = documents?.filter((doc) => doc.statut === DocumentStatut.ACTIF).length || 0;

  const handleCreateClick = () => {
    setSelectedDocument(null);
    setIsFormDialogOpen(true);
  };

  const handleRowClick = (doc: Document) => {
    if (highlightedId === doc.id) {
      setHighlightedId(null);
    }
    setSelectedDocument(doc);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = (doc: Document, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocument(doc);
    setIsFormDialogOpen(true);
  };

  const handleArchiveClick = (doc: Document, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocument(doc);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (doc: Document, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocument(doc);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (doc: Document, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadClick = (doc: Document, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (doc.fichier) {
      let url = doc.fichier;
      if (!url.startsWith('http')) {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
      }
      setPreviewUrl(url);
      setPreviewFileName(doc.nom);
      setIsPreviewOpen(true);
    }
  };

  if (isError) {
    return <ErrorMessage message="Erreur lors du chargement des documents." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos documents généraux et liés aux immobilisations
          </p>
        </div>
        <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Table section with integrated filters */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Rechercher..."
                className="pl-9 bg-white w-full"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <Select
              value={linkFilter}
              onValueChange={(value: any) => {
                setLinkFilter(value);
                setCurrentPage(1);
                if (value !== "IMMOBILISATION") setSelectedImmobilisationFilter("ALL");
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Liaison">
                  {linkFilter === "ALL" ? "Toutes les liaisons" : linkFilter === "ENTREPRISE" ? "Relié à l'entreprise" : "Relié à une immobilisation"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les liaisons</SelectItem>
                <SelectItem value="ENTREPRISE">Relié à l'entreprise</SelectItem>
                <SelectItem value="IMMOBILISATION">Relié à une immobilisation</SelectItem>
              </SelectContent>
            </Select>

            {linkFilter === "IMMOBILISATION" && (
              <Select
                value={selectedImmobilisationFilter}
                onValueChange={(value: string | null) => {
                  if (value) {
                    setSelectedImmobilisationFilter(value);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-white">
                  <SelectValue placeholder="Filtrer par immobilisation">
                    {selectedImmobilisationFilter === "ALL" 
                      ? "Toutes les immobilisations" 
                      : (immobilisations?.find(i => i.id_immobilisation.toString() === selectedImmobilisationFilter)
                          ? `${immobilisations.find(i => i.id_immobilisation.toString() === selectedImmobilisationFilter)!.code} - ${immobilisations.find(i => i.id_immobilisation.toString() === selectedImmobilisationFilter)!.designation}`
                          : selectedImmobilisationFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les immobilisations</SelectItem>
                  {immobilisations?.map((imm) => (
                    <SelectItem key={imm.id_immobilisation} value={imm.id_immobilisation.toString()}>
                      {`${imm.code} - ${imm.designation}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={statusFilter}
              onValueChange={(value: string | null) => {
                if (value) {
                  setStatusFilter(value as "ALL" | DocumentStatut);
                  setCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-white">
                <SelectValue placeholder="Tous les statuts">
                  {statusFilter === "ALL" ? "Tous les statuts" : statusFilter === "ACTIF" ? "Actifs" : "Archivés"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs</SelectItem>
                <SelectItem value="ARCHIVE">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total : {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="w-8 h-8 animate-spin mb-4 border-4 border-brand-green/20 border-t-brand-green rounded-full" />
            <p>Chargement des documents...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Immobilisation</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center w-[120px]">Statut</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDocuments.map((doc) => (
                  <TableRow 
                    key={doc.id}
                    onClick={() => handleRowClick(doc)}
                    className={cn(
                      "transition-colors group cursor-pointer",
                      highlightedId === doc.id
                        ? "bg-amber-100/50 hover:bg-amber-100"
                        : "hover:bg-slate-50/50"
                    )}
                  >
                    <TableCell className={cn(highlightedId === doc.id && "border-l-4 border-amber-500")}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-900 truncate max-w-[200px]" title={doc.nom}>{doc.nom}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {format(new Date(doc.date_ajout), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {doc.type_document_nom || `ID: ${doc.type_document}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.immobilisation_code ? (
                        <Badge variant="outline" className="border-slate-200 text-slate-600 font-mono text-xs">
                          {doc.immobilisation_code}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={
                          doc.statut === DocumentStatut.ACTIF 
                            ? "bg-brand-green-light text-brand-green border-brand-green/20" 
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }
                      >
                        {doc.statut === DocumentStatut.ACTIF ? "Actif" : "Archivé"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.fichier && (
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={(e) => handleDownloadClick(doc, e)}
                             title="Aperçu du fichier"
                             className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                        )}
                        {doc.statut === DocumentStatut.ACTIF ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditClick(doc, e)}
                              title="Modifier"
                              className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleArchiveClick(doc, e)}
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
                              onClick={(e) => handleRestoreClick(doc, e)}
                              title="Restaurer"
                              className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteClick(doc, e)}
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
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description={searchQuery || statusFilter !== "ALL" || linkFilter !== "ALL"
              ? "Aucun document ne correspond à vos critères de recherche." 
              : "Commencez par ajouter votre premier document."}
            actionLabel={!searchQuery && statusFilter === "ALL" && linkFilter === "ALL" ? "Ajouter un document" : undefined}
            onAction={!searchQuery && statusFilter === "ALL" && linkFilter === "ALL" ? handleCreateClick : undefined}
          />
        )}
        
        {filteredDocuments.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Afficher</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[110px] bg-white border-slate-200 text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="25">25 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                  <SelectItem value="100">100 par page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700 text-sm">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredDocuments.length)} sur {filteredDocuments.length}
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 shadow-sm bg-white">
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

      <DocumentFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        document={selectedDocument}
      />

      <DocumentDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        document={selectedDocument}
      />

      <DocumentArchiveDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        document={selectedDocument}
      />

      <DocumentRestoreDialog
        open={isRestoreDialogOpen}
        onOpenChange={setIsRestoreDialogOpen}
        document={selectedDocument}
      />

      <DocumentDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        document={selectedDocument}
      />

      <FilePreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        fileUrl={previewUrl} 
        fileName={previewFileName} 
      />
    </div>
  );
}
