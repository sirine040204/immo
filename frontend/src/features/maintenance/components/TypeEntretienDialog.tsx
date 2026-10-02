import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTypeEntretien, updateTypeEntretien } from "../api/typesEntretien";
import { TypeEntretien, CreateTypeEntretienDTO } from "../types/typeEntretien";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const typeEntretienSchema = z.object({
  code: z.string().min(1, "Le code est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
});

type TypeEntretienFormValues = z.infer<typeof typeEntretienSchema>;

interface TypeEntretienDialogProps {
  isOpen: boolean;
  onClose: () => void;
  typeEntretien?: TypeEntretien | null;
}

export function TypeEntretienDialog({ isOpen, onClose, typeEntretien }: TypeEntretienDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!typeEntretien;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TypeEntretienFormValues>({
    resolver: zodResolver(typeEntretienSchema),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen && typeEntretien) {
      reset({
        code: typeEntretien.code,
        nom: typeEntretien.nom,
        description: typeEntretien.description || "",
      });
    } else if (isOpen && !typeEntretien) {
      reset({
        code: "",
        nom: "",
        description: "",
      });
    }
  }, [isOpen, typeEntretien, reset]);

  const createMutation = useMutation({
    mutationFn: createTypeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["types-entretien"] });
      toast.success("Type d'entretien créé avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.code?.[0] || "Une erreur est survenue lors de la création.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTypeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["types-entretien"] });
      toast.success("Type d'entretien modifié avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.code?.[0] || "Une erreur est survenue lors de la modification.");
    },
  });

  const onSubmit = (data: TypeEntretienFormValues) => {
    const payload: CreateTypeEntretienDTO = {
      code: data.code,
      nom: data.nom,
      description: data.description || undefined,
    };

    if (isEditing && typeEntretien) {
      updateMutation.mutate({ id: typeEntretien.id, data: payload });
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
            {isEditing ? "Modifier le type d'entretien" : "Créer un nouveau type d'entretien"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de ce type d'entretien ci-dessous."
              : "Remplissez les informations pour créer un nouveau type d'entretien."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
            <Input id="code" placeholder="EX: PREV" {...register("code")} />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
            <Input id="nom" placeholder="Ex: Préventif" {...register("nom")} />
            {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Description détaillée de ce type d'entretien..." 
              className="resize-none"
              {...register("description")} 
            />
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
