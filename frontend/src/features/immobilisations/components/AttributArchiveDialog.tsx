import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveAttribut } from "../api/attributs";
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
import { Archive, Loader2 } from "lucide-react";

interface AttributArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attribut: AttributDynamique | null;
}

export function AttributArchiveDialog({ isOpen, onClose, attribut }: AttributArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: archiveAttribut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributs"] });
      toast.success("Attribut archivé avec succès");
      onClose();
    },
    onError: () => {
      toast.error("Une erreur est survenue lors de l'archivage de l'attribut.");
    },
  });

  const handleArchive = () => {
    if (attribut) {
      archiveMutation.mutate(attribut.id_attribut);
    }
  };

  if (!attribut) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-red-500" />
            Archiver l'attribut
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir archiver l'attribut <strong>{attribut.libelle}</strong> ?
            Cet attribut ne sera plus disponible pour les nouvelles saisies, mais les anciennes valeurs seront conservées.
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
              "Archiver l'attribut"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
