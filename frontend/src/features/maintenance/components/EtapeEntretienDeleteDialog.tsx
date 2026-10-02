import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEtapeEntretien } from "../api/etapesEntretien";
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
import { Trash2, Loader2, AlertCircle } from "lucide-react";

interface EtapeEntretienDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  etape: EtapeEntretien | null;
  onArchiveRequest?: (etape: EtapeEntretien) => void;
}

export function EtapeEntretienDeleteDialog({ isOpen, onClose, etape, onArchiveRequest }: EtapeEntretienDeleteDialogProps) {
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteEtapeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapes-entretien"] });
      toast.success("Étape d'entretien supprimée avec succès");
      setDeleteError(null);
      onClose();
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      
      if (status === 500 || status === 400 || (detail && detail.toLowerCase().includes("protect"))) {
        setDeleteError("Cette étape ne peut pas être supprimée car elle est déjà utilisée (ex: dans le suivi d'une intervention).");
      } else {
        toast.error(detail || "Une erreur est survenue lors de la suppression.");
      }
    },
  });

  const handleDelete = () => {
    if (etape) {
      setDeleteError(null);
      deleteMutation.mutate(etape.id);
    }
  };

  const handleClose = () => {
    setDeleteError(null);
    onClose();
  };

  if (!etape) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Supprimer l'étape
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement l'étape <strong>{etape.libelle}</strong> ?
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
              <strong>Suggestion :</strong> Archiver cette étape si elle n'est plus pertinente.
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
                onArchiveRequest(etape);
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
