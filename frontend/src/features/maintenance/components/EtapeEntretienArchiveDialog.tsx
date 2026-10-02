import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveEtapeEntretien } from "../api/etapesEntretien";
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
import { AlertTriangle, Loader2 } from "lucide-react";

interface EtapeEntretienArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  etape: EtapeEntretien | null;
}

export function EtapeEntretienArchiveDialog({ isOpen, onClose, etape }: EtapeEntretienArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: archiveEtapeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapes-entretien"] });
      toast.success("Étape d'entretien archivée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'archivage.");
    },
  });

  const handleArchive = () => {
    if (etape) {
      archiveMutation.mutate(etape.id);
    }
  };

  if (!etape) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Archiver l'étape
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir archiver l'étape <strong>{etape.libelle}</strong> ?
            <br /><br />
            Une étape archivée ne sera plus ajoutée aux futures interventions de ce modèle.
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
