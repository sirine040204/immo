"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { createSuiviEtape } from "../api/suiviEtapes";
import { CreateSuiviEtapeDTO } from "../types/intervention";

const getSuiviEtapeSchema = (existingOrders: number[]) => z.object({
  libelle: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  ordre: z.number().min(1, "L'ordre doit être un nombre positif").refine((val) => !existingOrders.includes(val), {
    message: "Cet ordre est déjà utilisé pour une autre étape.",
  }),
  obligatoire: z.boolean().optional(),
});

type SuiviEtapeFormValues = {
  libelle: string;
  description?: string;
  ordre: number;
  obligatoire?: boolean;
};

interface SuiviEtapeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interventionId: number;
  existingOrders: number[];
}

export function SuiviEtapeDialog({ isOpen, onClose, interventionId, existingOrders }: SuiviEtapeDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SuiviEtapeFormValues>({
    resolver: zodResolver(getSuiviEtapeSchema(existingOrders)),
    defaultValues: {
      libelle: "",
      description: "",
      ordre: 1,
      obligatoire: false,
    },
  });

  const obligatoire = watch("obligatoire");

  useEffect(() => {
    if (isOpen) {
      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;
      reset({
        libelle: "",
        description: "",
        ordre: nextOrder,
        obligatoire: false,
      });
    }
  }, [isOpen, reset, existingOrders]);

  const mutation = useMutation({
    mutationFn: (data: CreateSuiviEtapeDTO) => createSuiviEtape(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-etapes", interventionId] });
      toast.success("Étape ajoutée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.intervention?.[0] ||
        "Erreur lors de l'ajout de l'étape"
      );
    },
  });

  const onSubmit = (data: SuiviEtapeFormValues) => {
    mutation.mutate({
      intervention: interventionId,
      libelle: data.libelle,
      description: data.description || "",
      ordre: data.ordre,
      obligatoire: data.obligatoire || false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une étape manuelle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Libellé <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("libelle")}
              placeholder="Ex: Remplacement du filtre..."
            />
            {errors.libelle && (
              <p className="text-sm text-red-500">{errors.libelle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Instructions supplémentaires..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Ordre d'exécution <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              {...register("ordre", { valueAsNumber: true })}
              min={1}
            />
            {errors.ordre && (
              <p className="text-sm text-red-500">{errors.ordre.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="obligatoire"
              checked={obligatoire}
              onChange={(e) => setValue("obligatoire", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
            />
            <label
              htmlFor="obligatoire"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Étape obligatoire
            </label>
          </div>

          <DialogFooter className="pt-4">
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
              className="bg-brand-green hover:bg-brand-green-hover text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
