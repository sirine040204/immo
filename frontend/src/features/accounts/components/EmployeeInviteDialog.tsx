import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteEmployee } from "../api/employees";
import { Role } from "../types/employee";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Loader2 } from "lucide-react";

const inviteSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  email: z.string().email("Adresse email invalide"),
  role: z.string().min(1, "Veuillez sélectionner un rôle"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface EmployeeInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

export function EmployeeInviteDialog({ isOpen, onClose, roles }: EmployeeInviteDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      role: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormValues) => inviteEmployee({
      ...data,
      role: parseInt(data.role, 10),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.detail || 
        error.response?.data?.non_field_errors?.[0] || 
        "Une erreur est survenue lors de l'invitation."
      );
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((key) => {
          if (key !== "detail" && key !== "non_field_errors") {
            form.setError(key as any, {
              type: "server",
              message: error.response.data[key][0],
            });
          }
        });
      }
    },
  });

  const onSubmit = (data: InviteFormValues) => {
    setServerError(null);
    inviteMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setServerError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inviter un employé</DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour permettre à un employé de rejoindre votre entreprise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {serverError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Jean"
                {...form.register("prenom")}
                aria-invalid={!!form.formState.errors.prenom}
              />
              {form.formState.errors.prenom && (
                <p className="text-sm text-red-500">{form.formState.errors.prenom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Dupont"
                {...form.register("nom")}
                aria-invalid={!!form.formState.errors.nom}
              />
              {form.formState.errors.nom && (
                <p className="text-sm text-red-500">{form.formState.errors.nom.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jean.dupont@entreprise.com"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select 
              value={form.watch("role")} 
              onValueChange={(val) => form.setValue("role", val || "", { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!form.formState.errors.role}>
                <SelectValue placeholder="Sélectionner un rôle">
                  {form.watch("role") 
                    ? roles.find(r => r.id.toString() === form.watch("role"))?.nom 
                    : "Sélectionner un rôle"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending} className="bg-brand-green hover:bg-brand-green-hover">
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer l'invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
