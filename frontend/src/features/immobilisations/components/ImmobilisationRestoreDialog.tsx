import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreImmobilisation } from "../api/immobilisations";
import { Immobilisation } from "../types/immobilisation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

interface ImmobilisationRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export function ImmobilisationRestoreDialog({ isOpen, onClose, immobilisation }: ImmobilisationRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: () => restoreImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation restaurée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la restauration.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-brand-green" />
            Restaurer l'immobilisation
          </DialogTitle>
          <DialogDescription className="pt-3">
            Êtes-vous sûr de vouloir restaurer l'immobilisation <strong>{immobilisation?.code}</strong> ?
            <br /><br />
            Elle redeviendra active et pourra être utilisée à nouveau dans les traitements de l'entreprise.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={restoreMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            className="bg-brand-green hover:bg-brand-green-hover text-white"
            onClick={() => restoreMutation.mutate()}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restauration...
              </>
            ) : (
              "Oui, restaurer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
