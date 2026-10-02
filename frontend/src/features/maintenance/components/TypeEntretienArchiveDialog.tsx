import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveTypeEntretien } from "../api/typesEntretien";
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
import { AlertTriangle, Loader2 } from "lucide-react";

interface TypeEntretienArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  typeEntretien: TypeEntretien | null;
}

export function TypeEntretienArchiveDialog({ isOpen, onClose, typeEntretien }: TypeEntretienArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: archiveTypeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["types-entretien"] });
      toast.success("Type d'entretien archivé avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'archivage.");
    },
  });

  const handleArchive = () => {
    if (typeEntretien) {
      archiveMutation.mutate(typeEntretien.id);
    }
  };

  if (!typeEntretien) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Archiver le type d'entretien
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir archiver le type d'entretien <strong>{typeEntretien.nom}</strong> ?
            <br /><br />
            Un type d'entretien archivé ne pourra plus être utilisé pour de nouvelles interventions.
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
