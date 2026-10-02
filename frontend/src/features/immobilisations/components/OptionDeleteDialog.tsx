import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOption } from "../api/attributs";
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
import { AlertCircle, Loader2 } from "lucide-react";

interface OptionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attributId: number;
  option: OptionAttribut | null;
  totalOptions: number;
}

export function OptionDeleteDialog({ isOpen, onClose, attributId, option, totalOptions }: OptionDeleteDialogProps) {
  const queryClient = useQueryClient();

  const isLastOption = totalOptions <= 1;

  const deleteMutation = useMutation({
    mutationFn: () => deleteOption(attributId, option!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options", attributId] });
      toast.success("Option supprimée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression de l'option.");
    },
  });

  if (!option) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Supprimer l'option
          </DialogTitle>
          <DialogDescription className="py-4 text-slate-700">
            Êtes-vous sûr de vouloir supprimer définitivement l'option <strong>{option.libelle}</strong> ? 
            Cette action est irréversible.
            
            {isLastOption && (
              <span className="mt-3 block text-red-600 font-medium text-sm">
                Attention : Il s'agit de la dernière option. Si vous la supprimez, vous devrez en ajouter une nouvelle avant de pouvoir enregistrer les modifications de l'attribut.
              </span>
            )}
            
            {option.statut === "ACTIVE" && (
              <span className="mt-3 block text-amber-600 font-medium text-sm">
                Attention : Seules les options archivées peuvent être supprimées.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteMutation.mutate()} 
            disabled={deleteMutation.isPending || option.statut === "ACTIVE"}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:opacity-50"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oui, supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
