import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveOption } from "../api/attributs";
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
import { AlertTriangle, Loader2 } from "lucide-react";

interface OptionArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attributId: number;
  option: OptionAttribut | null;
}

export function OptionArchiveDialog({ isOpen, onClose, attributId, option }: OptionArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => archiveOption(attributId, option!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options", attributId] });
      toast.success("Option archivée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de l'archivage de l'option.");
    },
  });

  if (!option) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Archiver l'option
          </DialogTitle>
          <DialogDescription className="py-4">
            Êtes-vous sûr de vouloir archiver l'option <strong>{option.libelle}</strong> ? 
            Elle ne sera plus disponible pour les nouvelles immobilisations, mais restera visible sur les éléments existants.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={archiveMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => archiveMutation.mutate()} 
            disabled={archiveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
          >
            {archiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oui, archiver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
