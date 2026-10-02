"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCosts, validateCost, rejectCost } from "@/features/costs/api/costs";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { StatutCout, CoutImmobilisation } from "@/features/costs/types/costs";
import { 
  CheckCircle, 
  XCircle,
  AlertCircle,
  CircleDollarSign,
  Calendar,
  Car,
  FileText,
  MessageSquare,
  Search,
  ArrowLeft,
  Eye,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ValidationsCoutsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  
  // Reject Dialog State
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedCostToReject, setSelectedCostToReject] = useState<CoutImmobilisation | null>(null);
  const [motifRejet, setMotifRejet] = useState("");

  // Details Dialog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCostDetails, setSelectedCostDetails] = useState<CoutImmobilisation | null>(null);

  const openDetails = (cost: CoutImmobilisation) => {
    setSelectedCostDetails(cost);
    setIsDetailsOpen(true);
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const { data: costs, isLoading: isLoadingCosts, isError: isErrorCosts } = useQuery({
    queryKey: ["costs"],
    queryFn: fetchCosts,
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const validateMutation = useMutation({
    mutationFn: validateCost,
    onMutate: (id) => setUpdatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Le coût a été validé avec succès !");
      setUpdatingId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la validation du coût");
      setUpdatingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCost,
    onMutate: (variables) => setUpdatingId(variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast.success("Le coût a été rejeté.");
      setUpdatingId(null);
      setIsRejectDialogOpen(false);
      setMotifRejet("");
    },
    onError: () => {
      toast.error("Erreur lors du rejet du coût");
      setUpdatingId(null);
    },
  });

  const handleValidate = (id: number) => {
    validateMutation.mutate(id);
  };

  const openRejectDialog = (cost: CoutImmobilisation) => {
    setSelectedCostToReject(cost);
    setMotifRejet("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (selectedCostToReject && motifRejet.trim()) {
      rejectMutation.mutate({ 
        id: selectedCostToReject.id_cout, 
        motif_rejet: motifRejet.trim() 
      });
    }
  };

  const pendingCosts = costs?.filter(
    (cost) => {
      if (cost.statut !== StatutCout.EN_ATTENTE_VALIDATION || cost.is_archived) return false;
      if (!searchTerm) return true;
      
      const lowerSearch = searchTerm.toLowerCase();
      const immo = immobilisations?.find(im => im.id_immobilisation === cost.immobilisation);
      const immoCode = immo ? immo.code.toLowerCase() : "";
      
      return (
        cost.libelle.toLowerCase().includes(lowerSearch) ||
        cost.type_cout.toLowerCase().includes(lowerSearch) ||
        immoCode.includes(lowerSearch)
      );
    }
  ) || [];

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "TND", // Assuming MAD or change to EUR based on standard
    }).format(Number(amount));
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  React.useEffect(() => {
    const initialHighlightId = searchParams.get("highlightId");
    if (initialHighlightId && pendingCosts.length > 0) {
      const id = Number(initialHighlightId);
      setHighlightedId(id);
      
      setTimeout(() => {
        const el = document.getElementById(`cost-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [searchParams, pendingCosts.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/validations")}
          className="text-slate-500 hover:text-slate-900 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux validations
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CircleDollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            Validations des Coûts & Dépenses
          </h1>
          <p className="text-slate-500">
            Examinez et validez les coûts associés aux immobilisations (achats, entretiens, etc.).
          </p>
        </div>
        
        <Badge variant="outline" className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
          {pendingCosts.length} en attente
        </Badge>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Dépenses en attente de validation</CardTitle>
            <CardDescription>
              Ces coûts ont été soumis par les utilisateurs et nécessitent une approbation financière.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par libellé, type ou immo..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingCosts ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
            </div>
          ) : isErrorCosts ? (
            <div className="p-6 bg-red-50 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Impossible de charger les données.
            </div>
          ) : pendingCosts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p>Aucune dépense n'est actuellement en attente de validation.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingCosts.map((cost) => {
                const immo = immobilisations?.find(im => im.id_immobilisation === cost.immobilisation);

                return (
                  <div 
                    id={`cost-${cost.id_cout}`}
                    key={cost.id_cout} 
                    className={cn(
                      "p-6 transition-all flex flex-col lg:flex-row gap-6 cursor-pointer relative",
                      highlightedId === cost.id_cout
                        ? "bg-amber-50 shadow-[inset_4px_0_0_0_rgba(245,158,11,1)] ring-1 ring-amber-500/20"
                        : "hover:bg-slate-50/50 bg-white"
                    )}
                    onClick={() => {
                      if (highlightedId === cost.id_cout) setHighlightedId(null);
                      openDetails(cost);
                    }}
                  >
                    {/* Infos Principales */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px]">
                              {formatType(cost.type_cout)}
                            </Badge>
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                              {cost.libelle}
                              <Info className="w-4 h-4 text-slate-400" />
                            </h3>
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {format(new Date(cost.date_cout), "dd MMMM yyyy", { locale: fr })}
                            </span>
                            {immo && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                                <Car className="w-3.5 h-3.5 text-slate-400" />
                                {immo.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {cost.commentaire && (
                        <div className="flex items-start gap-2 text-sm text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p>{cost.commentaire}</p>
                        </div>
                      )}
                    </div>

                    {/* Section Financière & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-end justify-between lg:justify-start gap-4 lg:gap-3 lg:min-w-[200px]">
                      <div className="text-center sm:text-left lg:text-right w-full">
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                          {formatCurrency(cost.montant_ttc)}
                        </div>
                        <div className="text-xs text-slate-500 flex justify-center sm:justify-start lg:justify-end gap-2 mt-1">
                          <span>HT: {formatCurrency(cost.montant_ht)}</span>
                          <span className="text-slate-300">•</span>
                          <span>TVA: {cost.taux_tva}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          className="flex-1 lg:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
                          disabled={updatingId === cost.id_cout}
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectDialog(cost);
                          }}
                        >
                          Rejeter
                        </Button>
                        <Button 
                          className="flex-1 lg:flex-none bg-brand-green hover:bg-brand-green/90 text-white shadow-sm"
                          disabled={updatingId === cost.id_cout}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidate(cost.id_cout);
                          }}
                        >
                          {updatingId === cost.id_cout ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                          )}
                          Valider
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Rejeter le coût
            </DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du rejet. Ce motif sera enregistré pour la traçabilité de cette dépense.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="motif" className="block text-sm font-medium text-slate-700 mb-2">
              Motif de rejet (obligatoire)
            </label>
            <Textarea 
              id="motif"
              placeholder="Ex: Montant incorrect, facture manquante..."
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Annuler</Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!motifRejet.trim() || updatingId === selectedCostToReject?.id_cout}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Eye className="w-6 h-6 text-emerald-600" />
              Détails de la dépense
            </DialogTitle>
            <DialogDescription className="text-base">
              Informations complètes sur ce coût.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCostDetails && (
            <div className="space-y-4 w-full pb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/80 p-5 rounded-xl border border-slate-100">
                {/* Ligne 1 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Libellé</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedCostDetails.libelle}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Type</div>
                  <div>
                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 px-2 py-0 text-xs font-medium shadow-sm">
                      {formatType(selectedCostDetails.type_cout)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Date</div>
                  <div className="text-sm font-medium text-slate-900">
                    {format(new Date(selectedCostDetails.date_cout), "dd MMM yyyy", { locale: fr })}
                  </div>
                </div>

                {/* Ligne 2 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Montant HT</div>
                  <div className="text-sm font-semibold text-slate-700">{formatCurrency(selectedCostDetails.montant_ht)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">TVA</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {selectedCostDetails.taux_tva}% <span className="text-slate-500 font-normal">({formatCurrency(selectedCostDetails.montant_tva)})</span>
                  </div>
                </div>
                <div className="bg-emerald-100/50 p-2.5 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-0.5">Total TTC</div>
                  <div className="text-lg font-black text-emerald-700 leading-none">
                    {formatCurrency(selectedCostDetails.montant_ttc)}
                  </div>
                </div>

                {/* Ligne 3 */}
                <div className="col-span-1 md:col-span-3 border-t border-slate-200/60 pt-4 mt-1">
                  <div className="text-xs font-medium text-slate-500 mb-1">Immobilisation associée</div>
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {selectedCostDetails.immobilisation_nom || immobilisations?.find(im => im.id_immobilisation === selectedCostDetails.immobilisation)?.code || "Non spécifié"}
                  </div>
                </div>
              </div>

              {selectedCostDetails.commentaire && (
                <div className="text-sm text-slate-700 bg-amber-50/70 p-4 rounded-xl border border-amber-100 whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold text-amber-800 text-[10px] uppercase tracking-wider block mb-1.5">Commentaire :</span>
                  {selectedCostDetails.commentaire}
                </div>
              )}

              {/* Audit Info Inline */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 pt-1">
                 <div className="flex items-center gap-1.5">
                   <Info className="w-3.5 h-3.5" />
                   <span>Créé par: <span className="font-semibold text-slate-700">{selectedCostDetails.cree_par_nom || "Système"}</span></span>
                 </div>
                 <span>Le: <span className="font-semibold text-slate-700">{selectedCostDetails.date_creation ? format(new Date(selectedCostDetails.date_creation), "dd/MM/yyyy à HH:mm") : "N/A"}</span></span>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">

            {selectedCostDetails && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    openRejectDialog(selectedCostDetails);
                    setIsDetailsOpen(false);
                  }}
                  disabled={updatingId === selectedCostDetails.id_cout}
                >
                  Rejeter
                </Button>
                <Button 
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                  onClick={() => {
                    handleValidate(selectedCostDetails.id_cout);
                    setIsDetailsOpen(false);
                  }}
                  disabled={updatingId === selectedCostDetails.id_cout}
                >
                  Valider
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
