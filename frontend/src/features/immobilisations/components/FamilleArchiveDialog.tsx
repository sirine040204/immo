import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveFamille } from "../api/familles";
import { Famille } from "../types/famille";
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

interface FamilleArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  famille: Famille | null;
}

export function FamilleArchiveDialog({ isOpen, onClose, famille }: FamilleArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: archiveFamille,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familles"] });
      toast.success("Famille archivée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'archivage.");
    },
  });

  const handleArchive = () => {
    if (famille) {
      archiveMutation.mutate(famille.id_famille);
    }
  };

  if (!famille) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Archiver la famille
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir archiver la famille <strong>{famille.nom}</strong> ?
            <br /><br />
            Une famille archivée ne pourra plus être utilisée pour de nouvelles immobilisations.
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
