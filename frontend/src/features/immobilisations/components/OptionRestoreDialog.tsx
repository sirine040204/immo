import { useMutation, useQueryClient } from "@tanstack/react-query";
import { restoreOption } from "../api/attributs";
import { OptionAttribut } from "../types/attribut";
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

interface OptionRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attributId: number;
  option: OptionAttribut | null;
}

export function OptionRestoreDialog({ isOpen, onClose, attributId, option }: OptionRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: () => restoreOption(attributId, option!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options", attributId] });
      toast.success("Option restaurée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la restauration de l'option.");
    },
  });

  if (!option) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <RotateCcw className="h-5 w-5" />
            Restaurer l'option
          </DialogTitle>
          <DialogDescription className="py-4">
            Êtes-vous sûr de vouloir restaurer l'option <strong>{option.libelle}</strong> ? 
            Elle sera de nouveau disponible pour les nouvelles immobilisations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={restoreMutation.isPending}>
            Annuler
          </Button>
          <Button 
            onClick={() => restoreMutation.mutate()} 
            disabled={restoreMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600"
          >
            {restoreMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oui, restaurer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
