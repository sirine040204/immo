import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Immobilisation } from "../types/immobilisation";
import { remettreEnServiceImmobilisation } from "../api/immobilisations";

interface ImmobilisationRemettreEnServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export const ImmobilisationRemettreEnServiceDialog: React.FC<ImmobilisationRemettreEnServiceDialogProps> = ({
  isOpen,
  onClose,
  immobilisation,
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => remettreEnServiceImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation remise en service avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la remise en service de l'immobilisation");
    },
  });

  if (!immobilisation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remettre en service l'immobilisation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir remettre en service l'immobilisation <strong>{immobilisation.code}</strong> ?
            Elle redeviendra active.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-brand-green hover:bg-brand-green-hover">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remettre en service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
