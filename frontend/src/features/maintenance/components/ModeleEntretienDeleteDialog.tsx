import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteModeleEntretien } from "../api/modelesEntretien";
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
import { Trash2, Loader2, AlertCircle } from "lucide-react";

interface ModeleEntretienDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modeleEntretien: ModeleEntretien | null;
  onArchiveRequest?: (modeleEntretien: ModeleEntretien) => void;
}

export function ModeleEntretienDeleteDialog({ isOpen, onClose, modeleEntretien, onArchiveRequest }: ModeleEntretienDeleteDialogProps) {
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteModeleEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeles-entretien"] });
      toast.success("Modèle d'entretien supprimé avec succès");
      setDeleteError(null);
      onClose();
    },
    onError: (error: any) => {
      // Check for ProtectedError / Used entity error
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      
      if (status === 500 || status === 400 || (detail && detail.toLowerCase().includes("protect"))) {
        setDeleteError("Ce modèle d'entretien ne peut pas être supprimé car il est utilisé (ex: dans des interventions).");
      } else {
        toast.error(detail || "Une erreur est survenue lors de la suppression.");
      }
    },
  });

  const handleDelete = () => {
    if (modeleEntretien) {
      setDeleteError(null);
      deleteMutation.mutate(modeleEntretien.id);
    }
  };

  const handleClose = () => {
    setDeleteError(null);
    onClose();
  };

  if (!modeleEntretien) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Supprimer le modèle d'entretien
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement le modèle d'entretien <strong>{modeleEntretien.nom}</strong> ?
            <br /><br />
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Impossible de supprimer
            </div>
            <div className="text-sm text-red-800">
              {deleteError}
              <br />
              <br />
              <strong>Suggestion :</strong> Archiver ce modèle d'entretien s'il n'est plus pertinent.
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-2">
          {deleteError && onArchiveRequest ? (
            <Button 
              variant="outline" 
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => {
                handleClose();
                onArchiveRequest(modeleEntretien);
              }}
            >
              Archiver plutôt
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleClose} disabled={deleteMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending || !!deleteError}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
