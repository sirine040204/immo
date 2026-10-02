"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/api/client";

export function PermissionRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [missingPermission, setMissingPermission] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const handlePermissionMissing = (event: Event) => {
      const customEvent = event as CustomEvent<{ missing_permission_code: string }>;
      setMissingPermission(customEvent.detail.missing_permission_code);
      setIsOpen(true);
    };

    window.addEventListener("permission:missing", handlePermissionMissing);
    return () => {
      window.removeEventListener("permission:missing", handlePermissionMissing);
    };
  }, []);

  const handleRequestPermission = async () => {
    try {
      setIsRequesting(true);
      await apiClient.post("/api/v1/accounts/permissions/requests/", {
        permission_code: missingPermission,
      });
      toast.success("Demande de permission envoyée avec succès !");
      setIsOpen(false);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
        // Automatically close the modal if the request is redundant
        if (
          error.response.data.detail.includes("déjà") ||
          error.response.data.detail.includes("en cours")
        ) {
          setIsOpen(false);
          // If they already have it, reloading might help clear stale frontend state
          if (error.response.data.detail.includes("rafraîchir")) {
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      } else {
        toast.error("Erreur lors de la demande de permission.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">Accès Refusé</DialogTitle>
          <DialogDescription className="text-center pt-2 text-slate-600">
            Vous n'avez pas la permission d'effectuer cette action. <br />
            <span className="font-semibold text-slate-800 mt-2 block">
              Code requis : {missingPermission}
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
          <Button 
            className="w-full bg-brand-green hover:bg-brand-green-hover text-white" 
            onClick={handleRequestPermission}
            disabled={isRequesting}
          >
            {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Demander cette permission
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsOpen(false)}
            disabled={isRequesting}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
