import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

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
import { restoreDocument } from "../api/documents";

interface DocumentRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

export function DocumentRestoreDialog({
  open,
  onOpenChange,
  document,
}: DocumentRestoreDialogProps) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: () => restoreDocument(document!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document restauré avec succès.");
      onOpenChange(false);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Une erreur est survenue lors de la restauration.";
      toast.error(errorMessage);
    },
  });

  const handleRestore = () => {
    restoreMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            <RotateCcw className="h-5 w-5" />
            Restaurer le document
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-2">
            Êtes-vous sûr de vouloir restaurer le document 
            <span className="font-semibold text-slate-900 mx-1">
              {document?.nom}
            </span> ?
            <br /><br />
            Il redeviendra actif dans le système.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restoreMutation.isPending}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </Button>
          <Button
            variant="default"
            className="bg-brand-green text-white hover:bg-brand-green-hover"
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? "Restauration..." : "Confirmer la restauration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
