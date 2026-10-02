import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOption, updateOption } from "../api/attributs";
import { OptionAttribut } from "../types/attribut";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const optionSchema = z.object({
  libelle: z.string().min(1, "Le libellé est obligatoire"),
  code: z.string().min(1, "Le code est obligatoire").regex(/^[A-Z0-9_]+$/, "Seules majuscules, chiffres et underscores"),
  ordre: z.coerce.number().min(1, "L'ordre doit être un nombre positif"),
});

type OptionFormValues = z.infer<typeof optionSchema>;

interface OptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attributId: number;
  option?: OptionAttribut | null;
}

export function OptionDialog({ isOpen, onClose, attributId, option }: OptionDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!option;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OptionFormValues>({
    // @ts-ignore
    resolver: zodResolver(optionSchema),
    defaultValues: {
      libelle: "",
      code: "",
      ordre: 1,
    },
  });

  useEffect(() => {
    if (isOpen && option) {
      reset({
        libelle: option.libelle,
        code: option.code,
        ordre: option.ordre,
      });
    } else if (isOpen && !option) {
      reset({
        libelle: "",
        code: "",
        ordre: 1, // Will be overridden if we have the list, but 1 is a good default
      });
    }
  }, [isOpen, option, reset]);

  const createMutation = useMutation({
    mutationFn: (data: OptionFormValues) => createOption(attributId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options", attributId] });
      toast.success("Option créée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la création de l'option.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: OptionFormValues) => updateOption({ attributId, optionId: option!.id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options", attributId] });
      toast.success("Option modifiée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la modification de l'option.");
    },
  });

  const onSubmit = (data: OptionFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'option" : "Créer une option"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de cette option."
              : "Ajoutez une nouvelle option à la liste de choix."}
          </DialogDescription>
        </DialogHeader>
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Libellé <span className="text-red-500">*</span></Label>
            <Input {...register("libelle")} placeholder="Ex: Bureau" />
            {errors.libelle && <p className="text-xs text-red-500">{errors.libelle.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Code <span className="text-red-500">*</span></Label>
            <Input 
              {...register("code")} 
              placeholder="Ex: BUREAU"
              disabled={isEditing}
              className={isEditing ? "bg-slate-50" : ""}
              onChange={(e) => {
                if(!isEditing) setValue("code", e.target.value.toUpperCase());
              }}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Ordre d'affichage <span className="text-red-500">*</span></Label>
            <Input type="number" {...register("ordre")} min="1" />
            {errors.ordre && <p className="text-xs text-red-500">{errors.ordre.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
