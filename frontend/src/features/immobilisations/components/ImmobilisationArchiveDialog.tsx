import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveImmobilisation } from "../api/immobilisations";
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
import { Loader2, Archive } from "lucide-react";

interface ImmobilisationArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export function ImmobilisationArchiveDialog({ isOpen, onClose, immobilisation }: ImmobilisationArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => archiveImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation archivée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'archivage.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-500" />
            Archiver l'immobilisation
          </DialogTitle>
          <DialogDescription className="pt-3">
            Êtes-vous sûr de vouloir archiver l'immobilisation <strong>{immobilisation?.code}</strong> ?
            <br /><br />
            Une fois archivée, cette immobilisation ne sera plus modifiable ni utilisable dans les nouveaux traitements. 
            Elle restera cependant conservée dans l'historique de l'entreprise.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={archiveMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archivage en cours...
              </>
            ) : (
              "Oui, archiver"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
