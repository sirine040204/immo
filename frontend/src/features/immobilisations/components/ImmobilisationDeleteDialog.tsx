import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteImmobilisation } from "../api/immobilisations";
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
import { Loader2, Trash2 } from "lucide-react";

interface ImmobilisationDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export function ImmobilisationDeleteDialog({ isOpen, onClose, immobilisation }: ImmobilisationDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation supprimée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Impossible de supprimer cette immobilisation car elle est liée à d'autres éléments.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Supprimer l'immobilisation
          </DialogTitle>
          <DialogDescription className="pt-3">
            Êtes-vous sûr de vouloir supprimer définitivement l'immobilisation <strong>{immobilisation?.code}</strong> ?
            <br /><br />
            Cette action est <strong>irréversible</strong>. Toutes les données associées seront perdues.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Oui, supprimer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
