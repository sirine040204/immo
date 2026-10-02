import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/shared/components/ui/select";
import { CoutImmobilisation, CreateCoutDTO, StatutCout, TypeCout, UpdateCoutDTO } from "../types/costs";
import { createCost, updateCost, deleteCost, submitCost, validateCost, rejectCost } from "../api/costs";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchDocuments } from "@/features/documents/api/documents";
import { AlertTriangle, Info, Check, X, DollarSign, ChevronDown, Search, GitBranch, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
import { DocumentFormDialog } from "@/features/documents/components/DocumentFormDialog";
import { cn } from "cn";



interface CostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cost: CoutImmobilisation | null;
}

export function CostDialog({ isOpen, onClose, cost }: CostDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!cost;
  
  // Queries
  const { data: immobilisations, isLoading: isLoadingImmos } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: () => fetchImmobilisations(),
    enabled: isOpen,
  });

  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fetchDocuments(),
    enabled: isOpen,
  });

  // Form State
  const [immobilisationId, setImmobilisationId] = useState<string>("");
  const [typeCout, setTypeCout] = useState<TypeCout>(TypeCout.ENTRETIEN);
  const [libelle, setLibelle] = useState("");
  const [dateCout, setDateCout] = useState("");
  const [montantHt, setMontantHt] = useState("");
  const [tauxTva, setTauxTva] = useState("0");
  const [documentId, setDocumentId] = useState<string>("none");
  const [commentaire, setCommentaire] = useState("");

  const [motifRejet, setMotifRejet] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Document Creation State
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  // Computed Values for Display Only
  const calculatedTva = (parseFloat(montantHt || "0") * parseFloat(tauxTva || "0")) / 100;
  const calculatedTtc = parseFloat(montantHt || "0") + calculatedTva;

  // Today's date as YYYY-MM-DD — used for max date constraint (date non future)
  const today = new Date().toISOString().split("T")[0];

  // Selected immobilisation object for ACQUISITION pre-fill
  const selectedImmobilisation = useMemo(
    () => (immobilisations as any[])?.find((i: any) => i.id_immobilisation.toString() === immobilisationId),
    [immobilisations, immobilisationId]
  );

  // Filtered documents: only ACTIF docs explicitly linked to this immobilisation
  const filteredDocuments = useMemo(() => {
    if (!documents || !immobilisationId) return [];
    return (documents as any[]).filter(
      (d: any) =>
        d.statut === "ACTIF" &&
        d.immobilisation?.toString() === immobilisationId
    );
  }, [documents, immobilisationId]);

  const router = useRouter();

  // Status checks
  const isBrouillon = isEditing ? cost.statut === StatutCout.BROUILLON : true;
  const isEnAttente = isEditing && cost.statut === StatutCout.EN_ATTENTE_VALIDATION;
  const isReadOnly = !isBrouillon;

  useEffect(() => {
    if (isOpen) {
      setShowRejectInput(false);
      setMotifRejet("");
      
      if (cost) {
        setImmobilisationId(cost.immobilisation.toString());
        setTypeCout(cost.type_cout);
        setLibelle(cost.libelle);
        setDateCout(cost.date_cout);
        setMontantHt(cost.montant_ht);
        setTauxTva(cost.taux_tva);
        setDocumentId(cost.document ? cost.document.toString() : "none");
        setCommentaire(cost.commentaire || "");
      } else {
        setImmobilisationId("");
        setTypeCout(TypeCout.ENTRETIEN);
        setLibelle("");
        setDateCout(today);
        setMontantHt("");
        setTauxTva("19"); // Default TVA
        setDocumentId("none");
        setCommentaire("");
      }
    }
  }, [isOpen, cost]);

  // ACQUISITION pre-fill: when type changes to ACQUISITION on a new form,
  // suggest date_acquisition and valeur_brute from the immobilisation (stays editable per backend comment)
  useEffect(() => {
    if (!isEditing && typeCout === TypeCout.ACQUISITION && selectedImmobilisation) {
      if (selectedImmobilisation.date_acquisition) {
        setDateCout(selectedImmobilisation.date_acquisition);
      }
      if (selectedImmobilisation.valeur_brute) {
        setMontantHt(selectedImmobilisation.valeur_brute);
      }
      if (!libelle) {
        setLibelle(`Acquisition - ${selectedImmobilisation.designation}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeCout, immobilisationId]);
  const createMutation = useMutation({
    mutationFn: createCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const validateMutation = useMutation({
    mutationFn: validateCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!immobilisationId || !libelle || !dateCout || !montantHt || !tauxTva) return;

    const data: CreateCoutDTO = {
      immobilisation: parseInt(immobilisationId),
      type_cout: typeCout,
      libelle,
      date_cout: dateCout,
      montant_ht: montantHt,
      taux_tva: tauxTva,
      document: documentId === "none" ? null : parseInt(documentId),
      commentaire,
    };

    if (isEditing) {
      updateMutation.mutate({ id: cost.id_cout, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 pr-8">
            {isEditing ? cost.libelle : "Nouveau Coût"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Consultez ou modifiez les détails du coût. Statut actuel: ${cost.statut.replace("_", " ")}` 
              : "Enregistrez une nouvelle dépense associée à une immobilisation."}
          </DialogDescription>
        </DialogHeader>

        {isEditing && cost.statut === StatutCout.REJETE && cost.motif_rejet && (
          <div className="bg-red-50 text-red-900 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900">Coût Rejeté</h4>
              <p className="text-sm mt-1 text-red-800">Motif: {cost.motif_rejet}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Immobilisation <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={immobilisationId}
                onValueChange={setImmobilisationId}
                disabled={isEditing}
                placeholder="Sélectionnez une immobilisation"
                searchPlaceholder="Rechercher une immobilisation..."
                options={immobilisations ? (immobilisations as any[]).map(imm => ({
                  value: imm.id_immobilisation.toString(),
                  label: `${imm.code} - ${imm.designation}`
                })) : []}
                className={isEditing ? "bg-slate-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Type de Coût <span className="text-red-500">*</span></Label>
              <Select value={typeCout} onValueChange={(v) => setTypeCout(v as TypeCout)} disabled={isReadOnly}>
                <SelectTrigger className={isReadOnly ? "bg-slate-50" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TypeCout).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input 
                value={libelle} 
                onChange={e => setLibelle(e.target.value)} 
                disabled={isReadOnly}
                className={isReadOnly ? "bg-slate-50" : ""}
                placeholder="Ex: Réparation moteur"
              />
            </div>

            <div className="space-y-2">
              <Label>Date du Coût <span className="text-red-500">*</span></Label>
              <Input 
                type="date"
                value={dateCout} 
                onChange={e => setDateCout(e.target.value)} 
                max={today}
                disabled={isReadOnly}
                className={isReadOnly ? "bg-slate-50" : ""}
              />
              {!isReadOnly && dateCout > today && (
                <p className="text-xs text-red-500 mt-1">La date ne peut pas être dans le futur.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Document Justificatif (Optionnel)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={documentId}
                    onValueChange={setDocumentId}
                    disabled={isReadOnly}
                    placeholder="Aucun document lié"
                    searchPlaceholder="Rechercher un document..."
                    options={[
                      { value: "none", label: "Aucun document" },
                      ...filteredDocuments.map((doc: any) => ({
                        value: doc.id.toString(),
                        label: doc.nom
                      }))
                    ]}
                    className={isReadOnly ? "bg-slate-50" : ""}
                  />
                </div>
                {!isReadOnly && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsDocumentDialogOpen(true)}
                    className="flex-shrink-0"
                    title="Nouveau document"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Affiche uniquement les documents actifs liés à cette immobilisation.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
              <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Détails Financiers
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant HT (TND) <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={montantHt} 
                    onChange={e => setMontantHt(e.target.value)} 
                    disabled={isReadOnly}
                    className={isReadOnly ? "bg-white" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux TVA (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={tauxTva} 
                    onChange={e => setTauxTva(e.target.value)} 
                    disabled={isReadOnly}
                    className={isReadOnly ? "bg-white" : ""}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Montant TVA (Calculé)</span>
                  <span className="font-medium text-slate-700">{isEditing ? cost.montant_tva : calculatedTva.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-bold text-slate-800">Montant TTC (Calculé)</span>
                  <span className="font-bold text-brand-green">{isEditing ? cost.montant_ttc : calculatedTtc.toFixed(2)} TND</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Commentaire</Label>
              <textarea 
                className={`w-full min-h-[80px] p-3 text-sm rounded-md border border-slate-200 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all ${isReadOnly ? 'bg-slate-50' : 'bg-white'}`}
                placeholder="Notes additionnelles..."
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            
            {isEditing && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Traçabilité (Audit)
                </h4>
                <div className="text-sm space-y-2 text-slate-600">
                  {cost.date_creation && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Création</span>
                      <span className="text-right">{cost.cree_par_nom || `Utilisateur #${cost.cree_par}`} le {new Date(cost.date_creation).toLocaleString()}</span>
                    </div>
                  )}
                  {cost.date_modification && new Date(cost.date_modification).getTime() !== new Date(cost.date_creation).getTime() && cost.statut !== StatutCout.REJETE && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dernière modif.</span>
                      <span className="text-right">{cost.modifie_par_nom || `Utilisateur #${cost.modifie_par}`} le {new Date(cost.date_modification).toLocaleString()}</span>
                    </div>
                  )}
                  {cost.statut === StatutCout.VALIDE && cost.date_validation && (
                    <div className="flex justify-between">
                      <span className="text-green-600 font-medium">Validation</span>
                      <span className="text-right">{cost.valide_par_nom || `Utilisateur #${cost.valide_par}`} le {new Date(cost.date_validation).toLocaleString()}</span>
                    </div>
                  )}
                  {cost.statut === StatutCout.REJETE && (
                    <div className="flex justify-between">
                      <span className="text-red-600 font-medium">Rejet</span>
                      <span className="text-right">{cost.modifie_par_nom || `Utilisateur #${cost.modifie_par}`} le {new Date(cost.date_modification).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REJECT FORM */}
        {showRejectInput && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg animate-in fade-in zoom-in-95 duration-200">
            <Label className="text-red-900 mb-2 block">Motif du rejet <span className="text-red-500">*</span></Label>
            <textarea 
              className="w-full min-h-[80px] p-3 text-sm rounded-md border border-red-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
              placeholder="Veuillez expliquer pourquoi ce coût est rejeté..."
              value={motifRejet}
              onChange={e => setMotifRejet(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>Annuler</Button>
              <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate({ id: cost!.id_cout, motif_rejet: motifRejet })} disabled={!motifRejet.trim() || rejectMutation.isPending}>
                Confirmer le Rejet
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-0 border-t border-slate-100 pt-4">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handleSave} className="bg-brand-green hover:bg-brand-green-hover" disabled={createMutation.isPending || !immobilisationId || !montantHt || !libelle}>
                Créer
              </Button>
            </>
          )}

          {isEditing && cost.statut === StatutCout.BROUILLON && (
            <>
              <div className="mr-auto flex gap-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => deleteMutation.mutate(cost.id_cout)}>
                  Supprimer
                </Button>
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => submitMutation.mutate(cost.id_cout)}>
                  Soumettre pour validation
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5" onClick={() => { onClose(); router.push(`/costs/${cost.id_cout}/lifecycle`); }}>
                <GitBranch className="h-4 w-4" /> Cycle de vie
              </Button>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
              <Button onClick={handleSave} className="bg-brand-green hover:bg-brand-green-hover" disabled={updateMutation.isPending}>
                Sauvegarder
              </Button>
            </>
          )}

          {isEditing && cost.statut === StatutCout.EN_ATTENTE_VALIDATION && !showRejectInput && (
            <>
              <div className="mr-auto flex gap-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowRejectInput(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button variant="default" className="bg-brand-green hover:bg-brand-green-hover" onClick={() => validateMutation.mutate(cost.id_cout)}>
                  <Check className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5" onClick={() => { onClose(); router.push(`/costs/${cost.id_cout}/lifecycle`); }}>
                <GitBranch className="h-4 w-4" /> Cycle de vie
              </Button>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </>
          )}

          {isEditing && (cost.statut === StatutCout.VALIDE || cost.statut === StatutCout.REJETE) && (
            <div className="w-full flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5" onClick={() => { onClose(); router.push(`/costs/${cost.id_cout}/lifecycle`); }}>
                <GitBranch className="h-4 w-4" /> Cycle de vie
              </Button>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>

      <DocumentFormDialog
        isOpen={isDocumentDialogOpen}
        onClose={() => setIsDocumentDialogOpen(false)}
        initialImmobilisation={immobilisationId ? parseInt(immobilisationId) : undefined}
        onSuccessSubmit={(newDocumentId) => {
          setDocumentId(newDocumentId.toString());
        }}
      />
    </Dialog>
  );
}
