import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateImmobilisation } from "../api/immobilisations";
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
import { Loader2, CheckCircle2 } from "lucide-react";

interface ImmobilisationActivateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export function ImmobilisationActivateDialog({ isOpen, onClose, immobilisation }: ImmobilisationActivateDialogProps) {
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: () => activateImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation activée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'activation.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Activer l'immobilisation
          </DialogTitle>
          <DialogDescription className="pt-3">
            Êtes-vous sûr de vouloir activer l'immobilisation <strong>{immobilisation?.code}</strong> ?
            <br /><br />
            Elle passera du statut "Créée" au statut "Active" et commencera à être prise en compte dans les calculs d'amortissement et autres traitements.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={activateMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => activateMutation.mutate()}
            disabled={activateMutation.isPending}
          >
            {activateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activation en cours...
              </>
            ) : (
              "Oui, activer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
