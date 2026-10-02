"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCosts, deleteCost, submitCost, validateCost, rejectCost, archiveCost, unarchiveCost, exportCostsToCSV } from "@/features/costs/api/costs";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { Button } from "@/shared/components/ui/button";
import { Plus, Search, ChevronLeft, ChevronRight, DollarSign, Calendar, Eye, Edit2, Trash2, Send, ShieldCheck, XCircle, Loader2, Archive, ArchiveRestore, GitBranch, Download } from "lucide-react";
import { toast } from "sonner";
import { CostDialog } from "@/features/costs/components/CostDialog";
import { CoutImmobilisation, StatutCout } from "@/features/costs/types/costs";
import { Badge } from "@/shared/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";

export default function CostsPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<CoutImmobilisation | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StatutCout>("ALL");
  const [archivedFilter, setArchivedFilter] = useState<"ALL" | "active" | "archived">("active");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [immobFilter, setImmobFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Action Dialog State
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    type: "submit" | "delete" | "validate" | "reject" | null;
    costId: number | null;
  }>({ isOpen: false, type: null, costId: null });
  const [rejectMotifInput, setRejectMotifInput] = useState("");

  const { data: costs, isLoading, isError } = useQuery({
    queryKey: ["costs"],
    queryFn: fetchCosts,
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: () => fetchImmobilisations(),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût supprimé avec succès");
      setActionDialog({ isOpen: false, type: null, costId: null });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => submitCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût soumis pour validation");
      setActionDialog({ isOpen: false, type: null, costId: null });
    },
    onError: () => toast.error("Erreur lors de la soumission"),
  });

  const validateMutation = useMutation({
    mutationFn: (id: number) => validateCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût validé");
      setActionDialog({ isOpen: false, type: null, costId: null });
    },
    onError: () => toast.error("Erreur lors de la validation"),
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { id: number; motif_rejet: string }) => rejectCost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût rejeté");
      setActionDialog({ isOpen: false, type: null, costId: null });
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût archivé");
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: number) => unarchiveCost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Coût désarchivé");
    },
    onError: () => toast.error("Erreur lors du désarchivage"),
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const blob = await exportCostsToCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export_couts_${format(new Date(), "yyyyMMdd")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (statut: StatutCout) => {
    switch (statut) {
      case StatutCout.BROUILLON:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Brouillon</Badge>;
      case StatutCout.EN_ATTENTE_VALIDATION:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En attente</Badge>;
      case StatutCout.VALIDE:
        return <Badge variant="outline" className="bg-brand-green-light text-brand-green border-brand-green/20">Validé</Badge>;
      case StatutCout.REJETE:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeté</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const getArchivedBadge = (cost: CoutImmobilisation) => {
    if (!cost.is_archived) return null;
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ml-1"><Archive className="h-3 w-3 mr-1" />Archivé</Badge>;
  };

  const handleEdit = (cost: CoutImmobilisation) => {
    setSelectedCost(cost);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCost(null);
    setIsDialogOpen(true);
  };

  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter((cost) => {
      const searchStr = `${cost.libelle} ${cost.type_cout} ${cost.immobilisation_nom || cost.immobilisation}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || cost.statut === statusFilter;
      
      const matchesDateStart = !dateStart || cost.date_cout >= dateStart;
      const matchesDateEnd = !dateEnd || cost.date_cout <= dateEnd;
      
      const matchesImmob = immobFilter === "ALL" || cost.immobilisation.toString() === immobFilter;
      const matchesArchived =
        archivedFilter === "ALL" ||
        (archivedFilter === "active" && !cost.is_archived) ||
        (archivedFilter === "archived" && cost.is_archived);
      
      return matchesSearch && matchesStatus && matchesDateStart && matchesDateEnd && matchesImmob && matchesArchived;
    });
  }, [costs, searchTerm, statusFilter, dateStart, dateEnd, immobFilter, archivedFilter]);

  const totalPages = Math.ceil(filteredCosts.length / itemsPerPage);
  
  const currentCosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCosts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCosts, currentPage, itemsPerPage]);

  if (isError) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          Une erreur est survenue lors de la récupération des coûts.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Coûts et Dépenses</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les coûts associés à vos immobilisations (entretiens, réparations, assurances, etc.).</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportCSV} 
            disabled={isExporting}
            variant="outline" 
            className="gap-2 shadow-sm"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter
          </Button>
          <Button onClick={handleCreate} className="bg-brand-green hover:bg-brand-green-hover text-white gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Nouveau Coût
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input 
                placeholder="Rechercher un coût par libellé, type, ou immobilisation..." 
                className="pl-9 bg-white w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="text-sm text-slate-500 font-medium whitespace-nowrap bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              Total : <span className="text-slate-900">{filteredCosts.length}</span> coût{filteredCosts.length > 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white shadow-sm border-slate-200">
                <SelectValue placeholder="Statut">
                  {statusFilter === "ALL" 
                    ? "Tous les statuts" 
                    : statusFilter === StatutCout.BROUILLON 
                      ? "Brouillon" 
                      : statusFilter === StatutCout.EN_ATTENTE_VALIDATION 
                        ? "En attente" 
                        : statusFilter === StatutCout.VALIDE
                          ? "Validé"
                          : "Rejeté"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value={StatutCout.BROUILLON}>Brouillon</SelectItem>
                <SelectItem value={StatutCout.EN_ATTENTE_VALIDATION}>En attente</SelectItem>
                <SelectItem value={StatutCout.VALIDE}>Validé</SelectItem>
                <SelectItem value={StatutCout.REJETE}>Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={archivedFilter} onValueChange={(val: any) => { setArchivedFilter(val || "active"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white shadow-sm border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Non archivés</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
                <SelectItem value="ALL">Tous</SelectItem>
              </SelectContent>
            </Select>
            <SearchableSelect
              value={immobFilter}
              onValueChange={(val) => { setImmobFilter(val || "ALL"); setCurrentPage(1); }}
              placeholder="Toutes les immob."
              searchPlaceholder="Rechercher..."
              options={[
                { value: "ALL", label: "Toutes les immob." },
                ...((immobilisations as any[])?.map(imm => ({
                  value: imm.id_immobilisation.toString(),
                  label: `${imm.code} - ${imm.designation}`
                })) || [])
              ]}
              className="w-full sm:w-[240px] bg-white shadow-sm border-slate-200"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <span className="text-sm text-slate-500 pl-2 hidden sm:inline font-medium">Du</span>
              <Input 
                type="date"
                value={dateStart}
                onChange={(e) => { setDateStart(e.target.value); setCurrentPage(1); }}
                className="flex-1 sm:w-[130px] border-none shadow-none focus-visible:ring-0 px-2 h-8"
              />
              <span className="text-sm text-slate-500 hidden sm:inline font-medium">Au</span>
              <Input 
                type="date"
                value={dateEnd}
                onChange={(e) => { setDateEnd(e.target.value); setCurrentPage(1); }}
                className="flex-1 sm:w-[130px] border-none shadow-none focus-visible:ring-0 px-2 h-8"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Libellé & Type</th>
                <th className="px-6 py-4">Immob.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
                    </div>
                  </td>
                </tr>
              ) : currentCosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <DollarSign className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p>Aucun coût trouvé.</p>
                  </td>
                </tr>
              ) : (
                currentCosts.map((cost) => (
                  <tr 
                    key={cost.id_cout} 
                    onClick={() => handleEdit(cost)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 group-hover:text-brand-green transition-colors flex items-center gap-1">
                        {cost.libelle}
                        {cost.is_archived && <Archive className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{cost.type_cout.replace("_", " ")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-[200px]" title={cost.immobilisation_nom || `ID: ${cost.immobilisation}`}>
                        {cost.immobilisation_nom || `ID: ${cost.immobilisation}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(cost.date_cout), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(cost.statut)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleEdit(cost); }}
                          className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                          title={cost.statut === StatutCout.BROUILLON ? "Modifier" : "Détails"}
                        >
                          {cost.statut === StatutCout.BROUILLON ? <Edit2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        
                        {cost.statut === StatutCout.BROUILLON && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionDialog({ isOpen: true, type: "submit", costId: cost.id_cout });
                              }}
                              disabled={submitMutation.isPending && submitMutation.variables === cost.id_cout}
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Soumettre pour validation"
                            >
                              {submitMutation.isPending && submitMutation.variables === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionDialog({ isOpen: true, type: "delete", costId: cost.id_cout });
                              }}
                              disabled={deleteMutation.isPending && deleteMutation.variables === cost.id_cout}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              {deleteMutation.isPending && deleteMutation.variables === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </>
                        )}

                        {cost.statut === StatutCout.EN_ATTENTE_VALIDATION && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionDialog({ isOpen: true, type: "validate", costId: cost.id_cout });
                              }}
                              disabled={validateMutation.isPending && validateMutation.variables === cost.id_cout}
                              className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                              title="Valider"
                            >
                              {validateMutation.isPending && validateMutation.variables === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectMotifInput("");
                                setActionDialog({ isOpen: true, type: "reject", costId: cost.id_cout });
                              }}
                              disabled={rejectMutation.isPending && rejectMutation.variables?.id === cost.id_cout}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Rejeter"
                            >
                              {rejectMutation.isPending && rejectMutation.variables?.id === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); router.push(`/costs/${cost.id_cout}/lifecycle`); }}
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Cycle de vie"
                        >
                          <GitBranch className="h-4 w-4" />
                        </Button>

                        {/* Archive / Unarchive */}
                        {!cost.is_archived ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(cost.id_cout); }}
                            disabled={archiveMutation.isPending && archiveMutation.variables === cost.id_cout}
                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            title="Archiver"
                          >
                            {archiveMutation.isPending && archiveMutation.variables === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); unarchiveMutation.mutate(cost.id_cout); }}
                            disabled={unarchiveMutation.isPending && unarchiveMutation.variables === cost.id_cout}
                            className="h-8 w-8 text-amber-600 hover:text-slate-700 hover:bg-slate-100 bg-amber-50"
                            title="Désarchiver"
                          >
                            {unarchiveMutation.isPending && unarchiveMutation.variables === cost.id_cout ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredCosts.length > 0 && (
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCosts.length)} of {filteredCosts.length}
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

      <CostDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        cost={selectedCost}
      />

      {/* Action Dialogs */}
      <Dialog 
        open={actionDialog.isOpen} 
        onOpenChange={(open) => !open && setActionDialog({ isOpen: false, type: null, costId: null })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "submit" && "Soumettre pour validation"}
              {actionDialog.type === "delete" && "Supprimer le coût"}
              {actionDialog.type === "validate" && "Valider le coût"}
              {actionDialog.type === "reject" && "Rejeter le coût"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "submit" && "Êtes-vous sûr de vouloir soumettre ce coût pour validation ? Cette action changera son statut en 'En attente'."}
              {actionDialog.type === "delete" && "Êtes-vous sûr de vouloir supprimer définitivement ce coût ? Cette action est irréversible."}
              {actionDialog.type === "validate" && "Êtes-vous sûr de vouloir valider ce coût ? Il sera marqué comme définitif."}
              {actionDialog.type === "reject" && "Veuillez préciser le motif pour lequel vous rejetez ce coût. Ce motif est obligatoire."}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === "reject" && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motif">Motif du rejet <span className="text-red-500">*</span></Label>
                <Input
                  id="motif"
                  value={rejectMotifInput}
                  onChange={(e) => setRejectMotifInput(e.target.value)}
                  placeholder="Ex: Facture manquante..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ isOpen: false, type: null, costId: null })}>
              Annuler
            </Button>
            {actionDialog.type === "submit" && (
              <Button 
                onClick={() => submitMutation.mutate(actionDialog.costId!)}
                disabled={submitMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre
              </Button>
            )}
            {actionDialog.type === "delete" && (
              <Button 
                variant="destructive"
                onClick={() => deleteMutation.mutate(actionDialog.costId!)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Supprimer
              </Button>
            )}
            {actionDialog.type === "validate" && (
              <Button 
                onClick={() => validateMutation.mutate(actionDialog.costId!)}
                disabled={validateMutation.isPending}
                className="bg-brand-green hover:bg-brand-green-hover"
              >
                {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Valider
              </Button>
            )}
            {actionDialog.type === "reject" && (
              <Button 
                variant="destructive"
                onClick={() => rejectMutation.mutate({ id: actionDialog.costId!, motif_rejet: rejectMotifInput })}
                disabled={!rejectMotifInput.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer le rejet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

