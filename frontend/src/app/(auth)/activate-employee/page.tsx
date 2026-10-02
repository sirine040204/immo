"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { verifyActivationToken, activateEmployee } from "@/features/accounts/api/employees";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

const activateSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[a-z]/, "Doit contenir au moins une lettre minuscule.")
    .regex(/[A-Z]/, "Doit contenir au moins une lettre majuscule.")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre.")
    .regex(/[^a-zA-Z0-9]/, "Doit contenir au moins un caractère spécial."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ActivateFormValues = z.infer<typeof activateSchema>;

export default function ActivateEmployeePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate the token on mount
  const { data: verificationData, isLoading: isVerifying, isError: isVerificationError, error: verificationError } = useQuery({
    queryKey: ["verify-activation-token", token],
    queryFn: () => verifyActivationToken(token!),
    enabled: !!token,
    retry: false,
  });

  const form = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const activateMutation = useMutation({
    mutationFn: (data: ActivateFormValues) => activateEmployee({
      token: token!,
      mot_de_passe: data.password,
    }),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      if (error.response?.data) {
        Object.keys(error.response.data).forEach((key) => {
          if (key === "detail" || key === "non_field_errors") {
            form.setError("root.serverError", {
              type: "server",
              message: error.response.data[key][0] || error.response.data.detail,
            });
          } else {
            form.setError(key as any, {
              type: "server",
              message: error.response.data[key][0],
            });
          }
        });
      } else {
        form.setError("root.serverError", {
          type: "server",
          message: "Une erreur inattendue s'est produite lors de l'activation.",
        });
      }
    },
  });

  const onSubmit = (data: ActivateFormValues) => {
    activateMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="w-full sm:mx-auto sm:max-w-md">
        <Card className="w-full shadow-lg border-red-100 bg-red-50">
          <CardHeader className="text-center pb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-700">Lien invalide</CardTitle>
            <CardDescription className="text-red-600/80">
              Le lien d'activation est manquant ou incomplet.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-white text-slate-700 hover:bg-slate-100 border border-slate-200" onClick={() => router.push("/login")}>
              Retour à la connexion
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="w-full sm:mx-auto sm:max-w-md flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin mb-4" />
        <p className="text-slate-600">Vérification de votre lien d'activation...</p>
      </div>
    );
  }

  if (isVerificationError) {
    const errorMsg = (verificationError as any)?.response?.data?.detail || "Le lien d'activation est invalide ou a expiré.";
    return (
      <div className="w-full sm:mx-auto sm:max-w-md">
        <Card className="w-full shadow-lg border-red-100 bg-white">
          <CardHeader className="text-center pb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-slate-900">Activation impossible</CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              {errorMsg}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => router.push("/login")}>
              Retour à la connexion
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full sm:mx-auto sm:max-w-md">
        <Card className="w-full shadow-xl border-brand-green/15 bg-white animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-brand-green" />
            </div>
            <CardTitle className="text-2xl text-slate-900">Compte activé !</CardTitle>
            <CardDescription className="text-slate-500 mt-2 text-base">
              Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-brand-green hover:bg-brand-green-hover text-white shadow-sm h-11 text-base" onClick={() => router.push("/login")}>
              Se connecter
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full sm:mx-auto sm:max-w-md">
      <Card className="w-full shadow-xl bg-white animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-900">Activation du compte</CardTitle>
          <CardDescription className="text-slate-500">
            Bonjour <strong>{verificationData?.email}</strong>,<br/>
            Veuillez définir un mot de passe pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {form.formState.errors.root?.serverError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {form.formState.errors.root.serverError.message}
              </div>
            )}

            <div className="space-y-2 relative">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register("password")}
                  aria-invalid={!!form.formState.errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register("confirmPassword")}
                  aria-invalid={!!form.formState.errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white shadow-sm mt-2 h-11"
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activation en cours...
                </>
              ) : (
                "Activer mon compte"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
