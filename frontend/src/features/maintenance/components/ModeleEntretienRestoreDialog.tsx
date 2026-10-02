import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreModeleEntretien } from "../api/modelesEntretien";
import { ModeleEntretien } from "../types/modeleEntretien";
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
import { RotateCcw, Loader2 } from "lucide-react";

interface ModeleEntretienRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modeleEntretien: ModeleEntretien | null;
}

export function ModeleEntretienRestoreDialog({ isOpen, onClose, modeleEntretien }: ModeleEntretienRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: restoreModeleEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeles-entretien"] });
      toast.success("Modèle d'entretien restauré avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la restauration.");
    },
  });

  const handleRestore = () => {
    if (modeleEntretien) {
      restoreMutation.mutate(modeleEntretien.id);
    }
  };

  if (!modeleEntretien) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            <RotateCcw className="h-5 w-5" />
            Restaurer le modèle d'entretien
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer le modèle d'entretien <strong>{modeleEntretien.nom}</strong> ?
            <br /><br />
            Il sera à nouveau disponible pour de nouvelles interventions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
            Annuler
          </Button>
          <Button 
            className="bg-brand-green hover:bg-brand-green-hover text-white"
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
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
