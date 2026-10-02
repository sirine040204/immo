import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreFamille } from "../api/familles";
import { Famille } from "../types/famille";
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

interface FamilleRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  famille: Famille | null;
}

export function FamilleRestoreDialog({ isOpen, onClose, famille }: FamilleRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: restoreFamille,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familles"] });
      toast.success("Famille restaurée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la restauration.");
    },
  });

  const handleRestore = () => {
    if (famille) {
      restoreMutation.mutate(famille.id_famille);
    }
  };

  if (!famille) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            <RotateCcw className="h-5 w-5" />
            Restaurer la famille
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer la famille <strong>{famille.nom}</strong> ?
            <br /><br />
            Elle sera à nouveau disponible pour de nouvelles immobilisations.
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
