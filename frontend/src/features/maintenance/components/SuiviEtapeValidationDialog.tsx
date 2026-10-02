"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { updateSuiviEtape } from "../api/suiviEtapes";
import { SuiviEtapeIntervention, SuiviEtapeStatut } from "../types/intervention";

const validationSchema = z.object({
  statut: z.enum(["VALIDEE", "NON_VALIDEE"]),
  commentaire: z.string().optional(),
}).refine((data) => {
  if (data.statut === "NON_VALIDEE") {
    return !!data.commentaire && data.commentaire.trim().length > 0;
  }
  return true;
}, {
  message: "Un commentaire est obligatoire lorsqu'une étape n'est pas validée.",
  path: ["commentaire"],
});

type ValidationFormValues = z.infer<typeof validationSchema>;

interface SuiviEtapeValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suiviEtape: SuiviEtapeIntervention | null;
}

export function SuiviEtapeValidationDialog({ isOpen, onClose, suiviEtape }: SuiviEtapeValidationDialogProps) {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      statut: "VALIDEE",
      commentaire: "",
    },
  });

  const selectedStatut = watch("statut");

  useEffect(() => {
    if (isOpen && suiviEtape) {
      reset({
        statut: (suiviEtape.statut === "A_VALIDER" ? "VALIDEE" : suiviEtape.statut) as any,
        commentaire: suiviEtape.commentaire || "",
      });
    }
  }, [isOpen, suiviEtape, reset]);

  const mutation = useMutation({
    mutationFn: (data: { statut: SuiviEtapeStatut; commentaire: string }) =>
      updateSuiviEtape({
        id: suiviEtape!.id,
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-etapes", suiviEtape?.intervention] });
      toast.success("Statut de l'étape mis à jour");
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.commentaire?.[0] ||
        "Erreur lors de la mise à jour"
      );
    },
  });

  const onSubmit = (data: ValidationFormValues) => {
    mutation.mutate({
      statut: data.statut,
      commentaire: data.commentaire || "",
    });
  };

  if (!suiviEtape) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Validation de l'étape : {suiviEtape.libelle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <Controller
              name="statut"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 border p-3 rounded-md bg-brand-green-light border-brand-green/20">
                    <input
                      type="radio"
                      id="validee"
                      name="statut"
                      value="VALIDEE"
                      checked={field.value === "VALIDEE"}
                      onChange={() => field.onChange("VALIDEE")}
                      className="h-4 w-4 border-slate-300 text-brand-green focus:ring-brand-green"
                    />
                    <Label htmlFor="validee" className="text-brand-green cursor-pointer font-medium">
                      Étape validée
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-md bg-red-50 border-red-200">
                    <input
                      type="radio"
                      id="non-validee"
                      name="statut"
                      value="NON_VALIDEE"
                      checked={field.value === "NON_VALIDEE"}
                      onChange={() => field.onChange("NON_VALIDEE")}
                      className="h-4 w-4 border-slate-300 text-red-600 focus:ring-red-600"
                    />
                    <Label htmlFor="non-validee" className="text-red-900 cursor-pointer font-medium">
                      Étape non validée
                    </Label>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Commentaire {selectedStatut === "NON_VALIDEE" && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              {...register("commentaire")}
              placeholder={selectedStatut === "NON_VALIDEE" ? "Raison du rejet (obligatoire)..." : "Observations (optionnel)..."}
              rows={4}
              className={errors.commentaire ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.commentaire && (
              <p className="text-sm text-red-500">{errors.commentaire.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
