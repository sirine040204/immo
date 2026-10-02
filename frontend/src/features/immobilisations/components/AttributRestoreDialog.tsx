import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreAttribut } from "../api/attributs";
import { AttributDynamique } from "../types/attribut";
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

interface AttributRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attribut: AttributDynamique | null;
}

export function AttributRestoreDialog({ isOpen, onClose, attribut }: AttributRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: restoreAttribut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributs"] });
      toast.success("Attribut restauré avec succès");
      onClose();
    },
    onError: () => {
      toast.error("Une erreur est survenue lors de la restauration de l'attribut.");
    },
  });

  const handleRestore = () => {
    if (attribut) {
      restoreMutation.mutate(attribut.id_attribut);
    }
  };

  if (!attribut) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-brand-green" />
            Restaurer l'attribut
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer l'attribut <strong>{attribut.libelle}</strong> ?
            Il sera de nouveau disponible pour la saisie de nouvelles immobilisations.
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
              "Restaurer l'attribut"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
