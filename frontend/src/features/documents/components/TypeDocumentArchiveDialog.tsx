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
import { archiveTypeDocument } from "../api/types-document";
import { Archive } from "lucide-react";

interface TypeDocumentArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeDocument: TypeDocument | null;
}

export function TypeDocumentArchiveDialog({
  open,
  onOpenChange,
  typeDocument,
}: TypeDocumentArchiveDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => archiveTypeDocument(typeDocument!.id_type_document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["type-documents"] });
      toast.success("Type de document archivé avec succès");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Erreur lors de l'archivage du type de document"
      );
    },
  });

  if (!typeDocument) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
            <Archive className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">Archiver le type de document</DialogTitle>
          <DialogDescription className="text-center">
            Êtes-vous sûr de vouloir archiver le type de document{" "}
            <span className="font-semibold text-foreground">
              {typeDocument.code} - {typeDocument.nom}
            </span>{" "}
            ? Il ne sera plus possible de le modifier tant qu'il est archivé.
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
            variant="default"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Archivage..." : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
