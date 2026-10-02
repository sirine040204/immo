"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { confirmPasswordReset } from "@/features/accounts/api/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

const resetSchema = z.object({
  mot_de_passe: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[a-z]/, "Doit contenir au moins une lettre minuscule.")
    .regex(/[A-Z]/, "Doit contenir au moins une lettre majuscule.")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre.")
    .regex(/[^a-zA-Z0-9]/, "Doit contenir au moins un caractère spécial."),
  confirmation: z.string().min(8, "La confirmation est requise."),
}).refine((data) => data.mot_de_passe === data.confirmation, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmation"],
});

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { mot_de_passe: "", confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.non_field_errors?.[0] || "Lien magique expiré ou invalide. Veuillez recommencer.");
    },
  });

  const onSubmit = (values: z.infer<typeof resetSchema>) => {
    if (!token) {
      setErrorMsg("Le lien est invalide. Token manquant.");
      return;
    }
    mutation.mutate({ token, mot_de_passe: values.mot_de_passe });
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-4 mt-8">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-red-700 mb-2">Lien invalide</h2>
          <p className="text-sm text-red-600 mb-6">Le token de réinitialisation est introuvable. Veuillez cliquer sur le lien reçu par email ou refaire une demande.</p>
          <Link href="/forgot-password">
            <Button variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
              Refaire une demande
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto px-4 mt-8">
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
          <h2 className="text-lg font-bold text-green-700 mb-2">Mot de passe réinitialisé !</h2>
          <p className="text-sm text-green-600 mb-6">Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion dans quelques secondes.</p>
          <Link href="/login">
            <Button className="bg-green-600 text-white hover:bg-green-700">
              Se connecter maintenant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Veuillez choisir un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md px-10 py-8 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-600">{errorMsg}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="mot_de_passe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        disabled={mutation.isPending}
                        className="pr-10 bg-gray-50 border-gray-200 rounded-lg text-sm focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Confirmez le mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showConfirm ? "text" : "password"}
                        disabled={mutation.isPending}
                        className="pr-10 bg-gray-50 border-gray-200 rounded-lg text-sm focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0"
              style={{ background: mutation.isPending ? "#2d6a55" : "#1b4a3a" }}
            >
              {mutation.isPending ? "Mise à jour..." : "Enregistrer le mot de passe"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function ResetPasswordWrapper() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <ResetPasswordPage />
    </React.Suspense>
  );
}
