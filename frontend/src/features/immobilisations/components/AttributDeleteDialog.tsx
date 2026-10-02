import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAttribut } from "../api/attributs";
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
import { Trash2, Loader2 } from "lucide-react";

interface AttributDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attribut: AttributDynamique | null;
}

export function AttributDeleteDialog({ isOpen, onClose, attribut }: AttributDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteAttribut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributs"] });
      toast.success("Attribut supprimé définitivement");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la suppression de l'attribut.");
    },
  });

  const handleDelete = () => {
    if (attribut) {
      deleteMutation.mutate(attribut.id_attribut);
    }
  };

  if (!attribut) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Suppression définitive
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement l'attribut <strong>{attribut.libelle}</strong> ?
            <br /><br />
            Cette action est irréversible. Toutes les données qui utilisaient cet attribut (s'il y en a) perdront la définition de ce champ.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
