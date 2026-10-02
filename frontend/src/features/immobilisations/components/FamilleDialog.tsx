import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFamille, updateFamille } from "../api/familles";
import { Famille, CreateFamilleDTO } from "../types/famille";
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
import { Textarea } from "../../../shared/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const familleSchema = z.object({
  code: z.string().min(1, "Le code est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  icone: z.any().optional(),
  taux_amortissement: z
    .number()
    .min(0, "Le taux doit être au moins de 0")
    .max(100, "Le taux ne peut pas dépasser 100")
    .nullable()
    .optional(),
});

type FamilleFormValues = z.infer<typeof familleSchema>;

interface FamilleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  famille?: Famille | null;
}

export function FamilleDialog({ isOpen, onClose, famille }: FamilleDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!famille;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilleFormValues>({
    resolver: zodResolver(familleSchema),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      icone: "",
      taux_amortissement: null,
    },
  });

  useEffect(() => {
    if (isOpen && famille) {
      reset({
        code: famille.code,
        nom: famille.nom,
        description: famille.description || "",
        icone: undefined,
        taux_amortissement: famille.taux_amortissement ?? null,
      });
    } else if (isOpen && !famille) {
      reset({
        code: "",
        nom: "",
        description: "",
        icone: undefined,
        taux_amortissement: null,
      });
    }
  }, [isOpen, famille, reset]);

  const createMutation = useMutation({
    mutationFn: createFamille,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familles"] });
      toast.success("Famille créée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la création.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFamille,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familles"] });
      toast.success("Famille modifiée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la modification.");
    },
  });

  const onSubmit = (data: FamilleFormValues) => {
    let file = undefined;
    if (data.icone && data.icone.length > 0) {
      file = data.icone[0];
    }

    const payload: CreateFamilleDTO = {
      code: data.code,
      nom: data.nom,
      description: data.description || undefined,
      icone: file,
      taux_amortissement: data.taux_amortissement,
    };

    if (isEditing && famille) {
      updateMutation.mutate({ id: famille.id_famille, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la famille" : "Créer une nouvelle famille"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de cette famille ci-dessous."
              : "Remplissez les informations pour créer une nouvelle famille d'immobilisations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
              <Input id="code" placeholder="EX: MOB" {...register("code")} />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taux_amortissement">Taux d'amort. (%)</Label>
              <Input 
                id="taux_amortissement" 
                type="number" 
                step="0.01" 
                placeholder="Ex: 20" 
                {...register("taux_amortissement", { 
                  setValueAs: (v) => v === "" ? null : parseFloat(v) 
                })} 
              />
              {errors.taux_amortissement && <p className="text-xs text-red-500">{errors.taux_amortissement.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom de la famille <span className="text-red-500">*</span></Label>
            <Input id="nom" placeholder="Ex: Mobilier de bureau" {...register("nom")} />
            {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Description détaillée de cette famille..." 
              className="resize-none"
              {...register("description")} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icone">Icône (Photo) optionnel</Label>
            <Input 
              id="icone" 
              type="file"
              accept="image/*"
              {...register("icone")} 
            />
            {isEditing && famille?.icone && (
              <p className="text-xs text-slate-500 mt-1">Image actuelle: {typeof famille.icone === 'string' ? famille.icone.split('/').pop() : 'Image'}</p>
            )}
            {errors.icone && <p className="text-xs text-red-500">{errors.icone.message as string}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
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
