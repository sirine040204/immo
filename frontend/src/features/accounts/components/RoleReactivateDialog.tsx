import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reactivateRole } from "../api/roles";
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

interface RoleReactivateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export function RoleReactivateDialog({ isOpen, onClose, role }: RoleReactivateDialogProps) {
  const queryClient = useQueryClient();

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateRole(role!.id),
    onSuccess: () => {
      toast.success("Rôle réactivé avec succès");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.detail || "Erreur lors de la réactivation du rôle";
      toast.error(errorMsg);
    },
  });

  if (!role) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir réactiver ce rôle ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de réactiver le rôle <strong>{role.nom}</strong>. Il redeviendra disponible pour être attribué à de nouveaux employés de votre entreprise.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reactivateMutation.isPending} onClick={onClose}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              reactivateMutation.mutate();
            }}
            disabled={reactivateMutation.isPending}
            className="bg-brand-green hover:bg-brand-green-hover focus:ring-brand-green"
          >
            {reactivateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réactivation...
              </>
            ) : (
              "Réactiver le rôle"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
