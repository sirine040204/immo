import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreTypeEntretien } from "../api/typesEntretien";
import { TypeEntretien } from "../types/typeEntretien";
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
import { RotateCcw, Loader2 } from "lucide-react";

interface TypeEntretienRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  typeEntretien: TypeEntretien | null;
}

export function TypeEntretienRestoreDialog({ isOpen, onClose, typeEntretien }: TypeEntretienRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: restoreTypeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["types-entretien"] });
      toast.success("Type d'entretien restauré avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la restauration.");
    },
  });

  const handleRestore = () => {
    if (typeEntretien) {
      restoreMutation.mutate(typeEntretien.id);
    }
  };

  if (!typeEntretien) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            <RotateCcw className="h-5 w-5" />
            Restaurer le type d'entretien
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir restaurer le type d'entretien <strong>{typeEntretien.nom}</strong> ?
            <br /><br />
            Il sera à nouveau disponible pour de nouvelles interventions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
            Annuler
          </Button>
          <Button 
            className="bg-brand-green hover:bg-brand-green-hover text-white"
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restauration...
              </>
            ) : (
              "Restaurer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
