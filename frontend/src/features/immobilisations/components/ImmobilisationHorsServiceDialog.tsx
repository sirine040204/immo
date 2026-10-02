import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Immobilisation } from "../types/immobilisation";
import { mettreHorsServiceImmobilisation } from "../api/immobilisations";

interface ImmobilisationHorsServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export const ImmobilisationHorsServiceDialog: React.FC<ImmobilisationHorsServiceDialogProps> = ({
  isOpen,
  onClose,
  immobilisation,
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => mettreHorsServiceImmobilisation(immobilisation!.id_immobilisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation mise hors service avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la mise hors service de l'immobilisation");
    },
  });

  if (!immobilisation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre hors service l'immobilisation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir mettre hors service l'immobilisation <strong>{immobilisation.code}</strong> ?
            Elle ne sera plus considérée comme active.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-yellow-600 hover:bg-yellow-700">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre hors service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
