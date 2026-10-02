"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchImmobilisations, 
  activateImmobilisation, 
  deleteImmobilisation 
} from "@/features/immobilisations/api/immobilisations";
import { Immobilisation, ImmobilisationStatut } from "@/features/immobilisations/types/immobilisation";
import { 
  CheckCircle, 
  Car,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Info,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ValidationsImmobilisationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Details dialog state
  const [selectedImmo, setSelectedImmo] = useState<Immobilisation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = (immo: Immobilisation) => {
    setSelectedImmo(immo);
    setIsDetailsOpen(true);
  };

  const { data: immobilisations, isLoading, isError } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const activateMutation = useMutation({
    mutationFn: activateImmobilisation,
    onMutate: (id) => setValidatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation validée avec succès");
      setValidatingId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la validation");
      setValidatingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImmobilisation,
    onMutate: (id) => setRejectingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation rejetée (supprimée)");
      setRejectingId(null);
    },
    onError: () => {
      toast.error("Erreur lors du rejet");
      setRejectingId(null);
    },
  });

  // Filter only those that are CREEE and match search term
  const pendingValidations = immobilisations?.filter(
    (immo) => {
      if (immo.statut !== ImmobilisationStatut.CREEE) return false;
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        immo.code.toLowerCase().includes(lowerSearch) ||
        immo.designation.toLowerCase().includes(lowerSearch)
      );
    }
  ) || [];

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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            Validations des Immobilisations
          </h1>
          <p className="text-slate-500">
            Examinez et validez les nouvelles immobilisations ajoutées au système.
          </p>
        </div>
        
        <Badge variant="outline" className="px-4 py-1.5 bg-blue-50 text-blue-700 border-blue-200">
          {pendingValidations.length} en attente
        </Badge>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Demandes en attente</CardTitle>
            <CardDescription>
              Liste des immobilisations avec le statut "Créée".
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par code ou nom..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-slate-50/30">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
            </div>
          ) : isError ? (
            <div className="p-6 bg-red-50 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Impossible de charger les données
            </div>
          ) : pendingValidations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p>Aucune immobilisation en attente de validation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {pendingValidations.map((immo) => (
                <div 
                  key={immo.id_immobilisation}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  onClick={() => openDetails(immo)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Car className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-mono text-xs">
                        {immo.code}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {immo.designation}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {immo.description || "Aucune description fournie"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Valeur:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND" }).format(Number(immo.valeur_brute))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Acquisition:</span>
                      <span className="font-medium text-slate-700">
                        {format(new Date(immo.date_acquisition), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    
                    <div className="pt-4 mt-2 border-t border-slate-100 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-9"
                        disabled={rejectingId === immo.id_immobilisation || validatingId === immo.id_immobilisation}
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(immo.id_immobilisation); }}
                      >
                        {rejectingId === immo.id_immobilisation ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        ) : (
                          <XCircle className="w-4 h-4 mr-1.5" />
                        )}
                        Rejeter
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white h-9 shadow-sm"
                        disabled={validatingId === immo.id_immobilisation || rejectingId === immo.id_immobilisation}
                        onClick={(e) => { e.stopPropagation(); activateMutation.mutate(immo.id_immobilisation); }}
                      >
                        {validatingId === immo.id_immobilisation ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                        )}
                        Valider
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Eye className="w-6 h-6 text-blue-600" />
              Détails de l'immobilisation
            </DialogTitle>
            <DialogDescription className="text-base">
              Informations complètes sur cette demande.
            </DialogDescription>
          </DialogHeader>
          
          {selectedImmo && (
            <div className="space-y-8 w-full pb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Code</div>
                  <div className="text-base font-semibold text-slate-900">{selectedImmo.code}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Désignation</div>
                  <div className="text-base font-medium text-slate-900">{selectedImmo.designation}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Valeur d'acquisition</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND" }).format(Number(selectedImmo.valeur_brute))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1.5">Date d'acquisition</div>
                  <div className="text-base text-slate-900">
                    {format(new Date(selectedImmo.date_acquisition), "dd MMMM yyyy", { locale: fr })}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-500 mb-2">Description</div>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {selectedImmo.description || "Aucune description fournie."}
                </div>
              </div>

              {/* Audit Info */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Créé par:</span>
                    <span className="text-sm font-medium text-slate-900">{selectedImmo.cree_par_nom || "Utilisateur #" + selectedImmo.cree_par || "Système"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Le:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {selectedImmo.date_creation ? format(new Date(selectedImmo.date_creation), "dd MMM yyyy à HH:mm", { locale: fr }) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">

            {selectedImmo && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    deleteMutation.mutate(selectedImmo.id_immobilisation);
                    setIsDetailsOpen(false);
                  }}
                  disabled={validatingId === selectedImmo.id_immobilisation || rejectingId === selectedImmo.id_immobilisation}
                >
                  Rejeter
                </Button>
                <Button 
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                  onClick={() => {
                    activateMutation.mutate(selectedImmo.id_immobilisation);
                    setIsDetailsOpen(false);
                  }}
                  disabled={validatingId === selectedImmo.id_immobilisation || rejectingId === selectedImmo.id_immobilisation}
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
