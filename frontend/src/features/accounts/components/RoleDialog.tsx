import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRole, updateRole } from "../api/roles";
import { Role } from "../types/employee";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { toast } from "sonner";

const roleSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
}

export function RoleDialog({ isOpen, onClose, role }: RoleDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      nom: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (role) {
        form.reset({
          nom: role.nom,
          description: role.description || "",
        });
      } else {
        form.reset({
          nom: "",
          description: "",
        });
      }
    }
  }, [isOpen, role, form]);

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      toast.success("Rôle créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de la création du rôle");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormValues) => updateRole({ id: role!.id, data }),
    onSuccess: () => {
      toast.success("Rôle modifié avec succès");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de la modification du rôle");
    },
  });

  const onSubmit = (values: RoleFormValues) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le rôle" : "Créer un nouveau rôle"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de ce rôle ci-dessous."
              : "Remplissez les informations pour créer un nouveau rôle."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du rôle</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnelle)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Description du rôle..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="bg-brand-green hover:bg-brand-green-hover">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Enregistrer" : "Créer le rôle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
