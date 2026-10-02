import React from "react";
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
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

import { TypeDocument } from "../types/type-document";
import { createTypeDocument, updateTypeDocument } from "../api/types-document";

const typeDocumentSchema = z.object({
  code: z.string().min(1, "Le code est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  a_echeance: z.boolean(),
});

type TypeDocumentFormValues = z.infer<typeof typeDocumentSchema>;

interface TypeDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeDocument?: TypeDocument | null;
}

export function TypeDocumentDialog({
  open,
  onOpenChange,
  typeDocument,
}: TypeDocumentDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!typeDocument;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TypeDocumentFormValues>({
    resolver: zodResolver(typeDocumentSchema),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      a_echeance: false,
    },
  });

  const aEcheance = watch("a_echeance");

  React.useEffect(() => {
    if (open) {
      if (typeDocument) {
        reset({
          code: typeDocument.code,
          nom: typeDocument.nom,
          description: typeDocument.description || "",
          a_echeance: typeDocument.a_echeance,
        });
      } else {
        reset({
          code: "",
          nom: "",
          description: "",
          a_echeance: false,
        });
      }
    }
  }, [open, typeDocument, reset]);

  const mutation = useMutation({
    mutationFn: (data: TypeDocumentFormValues) =>
      isEditing
        ? updateTypeDocument({ id: typeDocument.id_type_document, data })
        : createTypeDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["type-documents"] });
      toast.success(
        isEditing
          ? "Type de document modifié avec succès"
          : "Type de document créé avec succès"
      );
      onOpenChange(false);
    },
    onError: (error: any) => {
      const codeError = error.response?.data?.code?.[0];
      const nomError = error.response?.data?.nom?.[0];
      const detailError = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0];

      if (codeError) {
        setError("code", { type: "server", message: codeError });
      }
      if (nomError) {
        setError("nom", { type: "server", message: nomError });
      }
      
      if (!codeError && !nomError) {
        toast.error(detailError || "Une erreur est survenue");
      }
    },
  });

  const onSubmit = (data: TypeDocumentFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le type de document" : "Nouveau type de document"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="Ex: FACTURE"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom <span className="text-destructive">*</span></Label>
            <Input
              id="nom"
              {...register("nom")}
              placeholder="Ex: Facture fournisseur"
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description optionnelle..."
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="a_echeance"
              checked={aEcheance}
              onChange={(e) => setValue("a_echeance", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <Label
              htmlFor="a_echeance"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Document à échéance
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Enregistrement..."
                : isEditing
                ? "Modifier"
                : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
