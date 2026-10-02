"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { Immobilisation, ImmobilisationStatut } from "@/features/immobilisations/types/immobilisation";
import { 
  Box, 
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  PauseCircle,
  PlayCircle,
  ArrowLeft,
  Settings2,
  ShieldAlert,
  ArrowRight,
  History
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import { ImmobilisationFormDialog } from "@/features/immobilisations/components/ImmobilisationFormDialog";
import { ImmobilisationArchiveDialog } from "@/features/immobilisations/components/ImmobilisationArchiveDialog";
import { ImmobilisationRestoreDialog } from "@/features/immobilisations/components/ImmobilisationRestoreDialog";
import { ImmobilisationDeleteDialog } from "@/features/immobilisations/components/ImmobilisationDeleteDialog";
import { ImmobilisationActivateDialog } from "@/features/immobilisations/components/ImmobilisationActivateDialog";
import { ReformerDialog } from "@/features/immobilisations/components/ReformerDialog";
import { ImmobilisationHorsServiceDialog } from "@/features/immobilisations/components/ImmobilisationHorsServiceDialog";
import { ImmobilisationRemettreEnServiceDialog } from "@/features/immobilisations/components/ImmobilisationRemettreEnServiceDialog";
import { InterventionDialog } from "@/features/maintenance/components/InterventionDialog";
import { useRouter } from "next/navigation";
import { Wrench, FileWarning } from "lucide-react";

export default function ImmobilisationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [familleFilter, setFamilleFilter] = useState("ALL");
  
  const [selectedImmobilisation, setSelectedImmobilisation] = useState<Immobilisation | null>(null);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isReformerDialogOpen, setIsReformerDialogOpen] = useState(false);
  const [isHorsServiceDialogOpen, setIsHorsServiceDialogOpen] = useState(false);
  const [isRemettreEnServiceDialogOpen, setIsRemettreEnServiceDialogOpen] = useState(false);
  
  const [isInterventionDialogOpen, setIsInterventionDialogOpen] = useState(false);
  const [isCorrectiveMode, setIsCorrectiveMode] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const {
    data: immobilisations,
    isLoading: isImmobilisationsLoading,
    error: immobilisationsError,
  } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const {
    data: familles,
    isLoading: isFamillesLoading,
  } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const isLoading = isImmobilisationsLoading || isFamillesLoading;

  const filteredImmobilisations = React.useMemo(() => {
    if (!immobilisations) return [];
    
    return immobilisations.filter((imm) => {
      const matchesSearch = 
        imm.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
        imm.designation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || imm.statut === statusFilter;
      const matchesFamille = familleFilter === "ALL" || imm.famille.toString() === familleFilter;
      
      return matchesSearch && matchesStatus && matchesFamille;
    });
  }, [immobilisations, searchQuery, statusFilter, familleFilter]);

  const totalPages = Math.ceil(filteredImmobilisations.length / itemsPerPage);

  const currentImmobilisations = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredImmobilisations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredImmobilisations, currentPage, itemsPerPage]);

  const activeCount = immobilisations?.filter((i) => i.statut === ImmobilisationStatut.ACTIVE).length || 0;
  const creeeCount = immobilisations?.filter((i) => i.statut === ImmobilisationStatut.CREEE).length || 0;

  const handleEditClick = (imm: Immobilisation) => {
    setSelectedImmobilisation(imm);
    setIsEditDialogOpen(true);
  };

  const handleArchiveClick = (imm: Immobilisation) => {
    setSelectedImmobilisation(imm);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (imm: Immobilisation) => {
    setSelectedImmobilisation(imm);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (imm: Immobilisation) => {
    setSelectedImmobilisation(imm);
    setIsDeleteDialogOpen(true);
  };

  const handleActivateClick = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsActivateDialogOpen(true);
  };

  const handleReformerClick = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsReformerDialogOpen(true);
  };

  const handleHorsServiceClick = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsHorsServiceDialogOpen(true);
  };

  const handleRemettreEnServiceClick = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsRemettreEnServiceDialogOpen(true);
  };

  const handleCreateStandardIntervention = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsCorrectiveMode(false);
    setIsInterventionDialogOpen(true);
  };

  const handleCreateCorrectiveIntervention = (immobilisation: Immobilisation) => {
    setSelectedImmobilisation(immobilisation);
    setIsCorrectiveMode(true);
    setIsInterventionDialogOpen(true);
  };

  const getFamilleName = (id: number) => {
    const famille = familles?.find(f => f.id_famille === id);
    return famille ? famille.nom : `ID: ${id}`;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(num);
  };

  const renderStatusBadge = (statut: ImmobilisationStatut) => {
    switch (statut) {
      case ImmobilisationStatut.ACTIVE:
        return <Badge variant="outline" className="bg-brand-green-light text-brand-green border-brand-green/20">Active</Badge>;
      case ImmobilisationStatut.CREEE:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Créée</Badge>;
      case ImmobilisationStatut.HORS_SERVICE:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Hors service</Badge>;
      case ImmobilisationStatut.REFORMEE:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Réformée</Badge>;
      case ImmobilisationStatut.ARCHIVEE:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Archivée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (immobilisationsError) {
    return (
      <div className="p-6">
        <ErrorMessage 
          title="Erreur de chargement" 
          message="Impossible de charger la liste des immobilisations." 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Immobilisations</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Gérez vos actifs physiques
            {immobilisations && !isLoading && (
              <>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{activeCount} actives</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{creeeCount} en attente</span>
              </>
            )}
          </p>
        </div>
        <Button onClick={() => { setSelectedImmobilisation(null); setIsEditDialogOpen(true); }} className="bg-brand-green hover:bg-brand-green-hover text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle immobilisation
        </Button>
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
                placeholder="Rechercher par code ou désignation..."
                className="pl-9 bg-white w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={familleFilter} onValueChange={(val) => { setFamilleFilter(val || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Toutes les familles">
                  {familleFilter === "ALL" 
                    ? "Toutes les familles" 
                    : familles?.find(f => f.id_famille.toString() === familleFilter)?.nom || "Toutes les familles"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les familles</SelectItem>
                {familles?.map((fam) => (
                  <SelectItem key={fam.id_famille} value={fam.id_famille.toString()}>
                    {fam.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Tous les statuts">
                  {statusFilter === "ALL"
                    ? "Tous les statuts"
                    : statusFilter === ImmobilisationStatut.ACTIVE
                    ? "Active"
                    : statusFilter === ImmobilisationStatut.CREEE
                    ? "Créée"
                    : statusFilter === ImmobilisationStatut.HORS_SERVICE
                    ? "Hors service"
                    : statusFilter === ImmobilisationStatut.REFORMEE
                    ? "Réformée"
                    : "Archivée"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value={ImmobilisationStatut.CREEE}>Créée</SelectItem>
                <SelectItem value={ImmobilisationStatut.ACTIVE}>Active</SelectItem>
                <SelectItem value={ImmobilisationStatut.HORS_SERVICE}>Hors service</SelectItem>
                <SelectItem value={ImmobilisationStatut.REFORMEE}>Réformée</SelectItem>
                <SelectItem value={ImmobilisationStatut.ARCHIVEE}>Archivée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total : {filteredImmobilisations.length} immobilisation{filteredImmobilisations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-green" />
            <p>Chargement des immobilisations...</p>
          </div>
        ) : filteredImmobilisations.length > 0 ? (
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">Code</TableHead>
                  <TableHead className="font-semibold text-slate-700">Désignation</TableHead>
                  <TableHead className="font-semibold text-slate-700">Famille</TableHead>
                  <TableHead className="font-semibold text-slate-700">Acquisition</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Valeur Brute</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center w-[120px]">Statut</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentImmobilisations.map((imm) => (
                  <TableRow 
                    key={imm.id_immobilisation}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/immobilisations/immobilisations/${imm.id_immobilisation}`)}
                  >
                    <TableCell className="font-mono text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{imm.code}</span>
                        {imm.has_missing_documents && imm.statut !== ImmobilisationStatut.REFORMEE && imm.statut !== ImmobilisationStatut.ARCHIVEE && (
                          <div className="relative flex items-center justify-center cursor-help" title="Documents obligatoires manquants">
                            <span className="absolute -inset-0.5 rounded-full bg-red-400 opacity-50 animate-ping"></span>
                            <FileWarning className="w-4 h-4 text-red-500 relative z-10" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {imm.designation}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Box className="w-4 h-4 text-slate-400" />
                        {getFamilleName(imm.famille)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(imm.date_acquisition).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      {formatCurrency(imm.valeur_brute)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(imm.statut)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* VIEW DETAIL */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => router.push(`/immobilisations/immobilisations/${imm.id_immobilisation}`)}
                          title="Détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* VIEW HISTORY */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                          onClick={() => router.push(`/immobilisations/immobilisations/${imm.id_immobilisation}#historique`)}
                          title="Historique"
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        {/* EDIT */}
                        {(imm.statut === ImmobilisationStatut.CREEE || imm.statut === ImmobilisationStatut.ACTIVE || imm.statut === ImmobilisationStatut.HORS_SERVICE) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                            onClick={() => handleEditClick(imm)}
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* DELETE (ONLY FOR CREEE) */}
                        {imm.statut === ImmobilisationStatut.CREEE && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(imm)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* MORE ACTIONS */}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 text-slate-400 hover:text-slate-600 inline-flex items-center justify-center rounded-md hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {imm.statut === ImmobilisationStatut.CREEE && (
                              <DropdownMenuItem onClick={() => handleActivateClick(imm)} className="text-blue-600 cursor-pointer">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Activer
                              </DropdownMenuItem>
                            )}

                            {imm.statut === ImmobilisationStatut.ACTIVE && (
                              <>
                                <DropdownMenuItem onClick={() => handleHorsServiceClick(imm)} className="text-amber-600 cursor-pointer">
                                  <PauseCircle className="mr-2 h-4 w-4" /> Mettre hors service
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleArchiveClick(imm)} className="text-slate-600 cursor-pointer">
                                  <Archive className="mr-2 h-4 w-4" /> Archiver
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleReformerClick(imm)} className="text-red-600 cursor-pointer">
                                  <Ban className="mr-2 h-4 w-4" /> Réformer
                                </DropdownMenuItem>
                              </>
                            )}

                            {imm.statut === ImmobilisationStatut.HORS_SERVICE && (
                              <>
                                <DropdownMenuItem onClick={() => handleRemettreEnServiceClick(imm)} className="text-brand-green cursor-pointer">
                                  <PlayCircle className="mr-2 h-4 w-4" /> Remettre en service
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleReformerClick(imm)} className="text-red-600 cursor-pointer">
                                  <Ban className="mr-2 h-4 w-4" /> Réformer
                                </DropdownMenuItem>
                              </>
                            )}

                            {(imm.statut === ImmobilisationStatut.ACTIVE || imm.statut === ImmobilisationStatut.HORS_SERVICE) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-xs text-slate-500 font-normal">Maintenance</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleCreateStandardIntervention(imm)} className="cursor-pointer">
                                    <Wrench className="mr-2 h-4 w-4 text-brand-green" /> Nouv. Intervention (Standard)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCreateCorrectiveIntervention(imm)} className="cursor-pointer text-amber-700">
                                    <FileWarning className="mr-2 h-4 w-4 text-amber-600" /> Nouv. Intervention Corrective
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </>
                            )}

                            {imm.statut === ImmobilisationStatut.ARCHIVEE && (
                              <DropdownMenuItem onClick={() => handleRestoreClick(imm)} className="text-brand-green cursor-pointer">
                                <RotateCcw className="mr-2 h-4 w-4" /> Restaurer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100">
              <Box className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune immobilisation trouvée</h3>
            <p className="text-slate-500 max-w-md">
              {searchQuery || statusFilter !== "ALL" || familleFilter !== "ALL"
                ? "Aucun résultat ne correspond à vos filtres. Essayez de modifier vos critères de recherche."
                : "Vous n'avez pas encore d'immobilisations enregistrées."}
            </p>
          </div>
        )}

        {/* Compact Pagination Footer */}
        {filteredImmobilisations.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500">
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredImmobilisations.length)} of {filteredImmobilisations.length}
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

      <ImmobilisationFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationActivateDialog
        isOpen={isActivateDialogOpen}
        onClose={() => setIsActivateDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationHorsServiceDialog
        isOpen={isHorsServiceDialogOpen}
        onClose={() => setIsHorsServiceDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ImmobilisationRemettreEnServiceDialog
        isOpen={isRemettreEnServiceDialogOpen}
        onClose={() => setIsRemettreEnServiceDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <ReformerDialog
        isOpen={isReformerDialogOpen}
        onClose={() => setIsReformerDialogOpen(false)}
        immobilisation={selectedImmobilisation}
      />
      <InterventionDialog
        isOpen={isInterventionDialogOpen}
        onClose={() => setIsInterventionDialogOpen(false)}
        isCorrectiveMode={isCorrectiveMode}
        initialImmobilisationId={selectedImmobilisation?.id_immobilisation}
      />
    </div>
  );
}
