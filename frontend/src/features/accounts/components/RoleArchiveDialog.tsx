import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveRole } from "../api/roles";
import { Role } from "../types/employee";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoleArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export function RoleArchiveDialog({ isOpen, onClose, role }: RoleArchiveDialogProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => archiveRole(role!.id),
    onSuccess: () => {
      toast.success("Rôle archivé avec succès");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.detail || "Erreur lors de l'archivage du rôle";
      toast.error(errorMsg);
    },
  });

  if (!role) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir archiver ce rôle ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point d'archiver le rôle <strong>{role.nom}</strong>. Cette action ne supprimera pas le rôle définitivement mais il ne pourra plus être attribué à de nouveaux employés. 
            <br /><br />
            Attention : L'archivage sera refusé si des employés actifs possèdent encore ce rôle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending} onClick={onClose}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent closing immediately to show loading state
              archiveMutation.mutate();
            }}
            disabled={archiveMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {archiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archivage en cours...
              </>
            ) : (
              "Archiver le rôle"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
