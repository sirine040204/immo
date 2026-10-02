import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreEtapeEntretien } from "../api/etapesEntretien";
import { EtapeEntretien } from "../types/etapeEntretien";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { RotateCcw, Loader2, AlertCircle } from "lucide-react";

interface EtapeEntretienRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  etape: EtapeEntretien | null;
  allEtapes: EtapeEntretien[];
}

export function EtapeEntretienRestoreDialog({ isOpen, onClose, etape, allEtapes }: EtapeEntretienRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: restoreEtapeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapes-entretien"] });
      toast.success("Étape d'entretien restaurée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la restauration.");
    },
  });

  const handleRestore = () => {
    if (etape) {
      restoreMutation.mutate(etape.id);
    }
  };

  if (!etape) return null;

  const hasConflict = allEtapes.some(
    e => e.modele_entretien === etape.modele_entretien && e.ordre === etape.ordre && e.statut === "ACTIF" && e.id !== etape.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            <RotateCcw className="h-5 w-5" />
            Restaurer l'étape
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer l'étape <strong>{etape.libelle}</strong> ?
            <br /><br />
            Elle sera à nouveau incluse dans les futures interventions.
          </DialogDescription>

          {hasConflict ? (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                Impossible de restaurer cette étape car une autre étape <strong>active</strong> utilise déjà l'ordre {etape.ordre} pour ce modèle.
              </div>
            </div>
          ) : restoreMutation.isError ? (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <span className="font-semibold block mb-1">Erreur de restauration</span>
                {/* @ts-ignore */}
                {restoreMutation.error?.response?.data?.detail || "Une erreur est survenue lors de la restauration."}
              </div>
            </div>
          ) : null}
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
            Annuler
          </Button>
          <Button
            className="bg-brand-green hover:bg-brand-green-hover text-white"
            onClick={handleRestore}
            disabled={restoreMutation.isPending || hasConflict}
          >
            {restoreMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restauration...
              </>
            ) : (
              "Restaurer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
