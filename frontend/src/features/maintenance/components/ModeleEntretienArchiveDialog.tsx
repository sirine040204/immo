import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveModeleEntretien } from "../api/modelesEntretien";
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
import { AlertTriangle, Loader2 } from "lucide-react";

interface ModeleEntretienArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modeleEntretien: ModeleEntretien | null;
}

export function ModeleEntretienArchiveDialog({ isOpen, onClose, modeleEntretien }: ModeleEntretienArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: archiveModeleEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeles-entretien"] });
      toast.success("Modèle d'entretien archivé avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'archivage.");
    },
  });

  const handleArchive = () => {
    if (modeleEntretien) {
      archiveMutation.mutate(modeleEntretien.id);
    }
  };

  if (!modeleEntretien) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Archiver le modèle d'entretien
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir archiver le modèle d'entretien <strong>{modeleEntretien.nom}</strong> ?
            <br /><br />
            Un modèle d'entretien archivé ne pourra plus être utilisé pour de nouvelles interventions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={archiveMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archivage...
              </>
            ) : (
              "Archiver"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
