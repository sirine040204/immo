import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFamille } from "../api/familles";
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
import { Trash2, Loader2 } from "lucide-react";

interface FamilleDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  famille: Famille | null;
}

export function FamilleDeleteDialog({ isOpen, onClose, famille }: FamilleDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFamille,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familles"] });
      toast.success("Famille supprimée définitivement");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la suppression.");
    },
  });

  const handleDelete = () => {
    if (famille) {
      deleteMutation.mutate(famille.id_famille);
    }
  };

  if (!famille) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Suppression définitive
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement la famille <strong>{famille.nom}</strong> ?
            <br /><br />
            Cette action est irréversible. Toutes les données associées seront perdues.
            Note: La suppression n'est possible que si la famille n'est référencée nulle part.
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
