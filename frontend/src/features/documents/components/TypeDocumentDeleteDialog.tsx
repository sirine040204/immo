import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { TypeDocument } from "../types/type-document";
import { deleteTypeDocument } from "../api/types-document";
import { Trash2 } from "lucide-react";

interface TypeDocumentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeDocument: TypeDocument | null;
}

export function TypeDocumentDeleteDialog({
  open,
  onOpenChange,
  typeDocument,
}: TypeDocumentDeleteDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteTypeDocument(typeDocument!.id_type_document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["type-documents"] });
      toast.success("Type de document supprimé avec succès");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Erreur lors de la suppression du type de document"
      );
    },
  });

  if (!typeDocument) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Supprimer définitivement</DialogTitle>
          <DialogDescription className="text-center">
            Êtes-vous sûr de vouloir supprimer définitivement le type de document{" "}
            <span className="font-semibold text-foreground">
              {typeDocument.code} - {typeDocument.nom}
            </span>{" "}
            ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-2 sm:justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
