import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

import { Document } from "../types/document";
import { archiveDocument } from "../api/documents";

interface DocumentArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

export function DocumentArchiveDialog({
  open,
  onOpenChange,
  document,
}: DocumentArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => archiveDocument(document!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document archivé avec succès.");
      onOpenChange(false);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Une erreur est survenue lors de l'archivage.";
      toast.error(errorMessage);
    },
  });

  const handleArchive = () => {
    archiveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Archive className="h-5 w-5" />
            Archiver le document
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-2">
            Êtes-vous sûr de vouloir archiver le document 
            <span className="font-semibold text-slate-900 mx-1">
              {document?.nom}
            </span> ?
            <br /><br />
            Il ne sera plus considéré comme actif mais restera consultable dans l'historique.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={archiveMutation.isPending}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </Button>
          <Button
            variant="default"
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? "Archivage..." : "Confirmer l'archivage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
