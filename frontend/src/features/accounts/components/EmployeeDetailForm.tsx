"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEmployee } from "../api/employees";
import { Employee, EmployeeUpdate, Role } from "../types/employee";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { User, Phone, ShieldCheck } from "lucide-react";

const employeeSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  telephone: z.string().optional().nullable(),
  role: z.coerce.number().optional().nullable(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeDetailFormProps {
  employee: Employee;
  roles: Role[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function EmployeeDetailForm({ employee, roles, onCancel, onSuccess }: EmployeeDetailFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      nom: employee.nom || "",
      prenom: employee.prenom || "",
      telephone: employee.telephone || "",
      role: employee.role,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmployeeUpdate) => updateEmployee({ id: employee.id_utilisateur, payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", String(employee.id_utilisateur)] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error(error);
      alert("Une erreur est survenue lors de la mise à jour.");
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <User className="h-5 w-5 text-brand-green" />
        <h2 className="text-lg font-semibold text-slate-900">Modifier l'employé</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom *</Label>
          <Input id="prenom" {...form.register("prenom")} />
          {form.formState.errors.prenom && (
            <p className="text-sm text-red-500">{form.formState.errors.prenom.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input id="nom" {...form.register("nom")} />
          {form.formState.errors.nom && (
            <p className="text-sm text-red-500">{form.formState.errors.nom.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telephone">Numéro de téléphone</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
            <Input id="telephone" {...form.register("telephone")} className="pl-10" />
          </div>
          {form.formState.errors.telephone && (
            <p className="text-sm text-red-500">{form.formState.errors.telephone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle assigné</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>
            <select
              id="role"
              {...form.register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sélectionnez un rôle</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nom}
                </option>
              ))}
            </select>
          </div>
          {form.formState.errors.role && (
            <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending} className="bg-brand-green hover:bg-brand-green-hover text-white">
          {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
