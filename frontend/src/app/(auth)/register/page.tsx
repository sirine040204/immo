"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Clock, Building2, User, Eye, EyeOff } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { registerCompany } from "@/features/accounts/api/auth";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";

const registerSchema = z.object({
  // Admin Info
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  mot_de_passe: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[a-z]/, "Doit contenir au moins une lettre minuscule.")
    .regex(/[A-Z]/, "Doit contenir au moins une lettre majuscule.")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre.")
    .regex(/[^a-zA-Z0-9]/, "Doit contenir au moins un caractère spécial."),
  photo: z.string().optional().or(z.literal("")),
  
  // Company Info
  nom_entreprise: z.string().min(2, "Le nom de l'entreprise est requis"),
  numero_fiscal: z.string().min(2, "Le numéro fiscal est requis"),
  forme_juridique: z.string().min(2, "La forme juridique est requise"),
  secteur_activite: z.string().min(2, "Le secteur d'activité est requis"),
  email_notifications: z.string().email("Email de notifications invalide"),
  numero_telephone: z.string().min(8, "Le numéro de téléphone est requis"),
  adresse: z.string().optional(),
  documents_justificatifs: z.string().min(1, "Le document justificatif est requis"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      mot_de_passe: "",
      photo: "",
      nom_entreprise: "",
      numero_fiscal: "",
      forme_juridique: "",
      secteur_activite: "",
      email_notifications: "",
      numero_telephone: "",
      adresse: "",
      documents_justificatifs: "",
    },
    mode: "onTouched"
  });

  const mutation = useMutation({
    mutationFn: registerCompany,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onNextStep = async () => {
    const isStep1Valid = await form.trigger(["nom", "prenom", "email", "mot_de_passe"]);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = (data: RegisterFormValues) => {
    mutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("documents_justificatifs", reader.result as string, {
          shouldValidate: true,
          shouldDirty: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("photo", reader.result as string, {
          shouldValidate: true,
          shouldDirty: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto mt-8">
        <EmptyState
          icon={Clock}
          title="Inscription envoyée !"
          description="Votre demande d'inscription est actuellement EN ATTENTE. Un Super Administrateur doit valider votre compte avant que vous puissiez accéder à l'application. Vous recevrez une notification prochainement."
          className="bg-white shadow-sm rounded-2xl"
        />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold underline underline-offset-2 text-gray-700 hover:text-[#1b4a3a] transition-colors"
          >
            Retour à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">

      {/* Heading — outside the card */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
          Créer votre espace entreprise
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 ? "Étape 1 sur 2 : Informations Administrateur" : "Étape 2 sur 2 : Informations Entreprise"}
        </p>
      </div>

      {/* White card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md px-10 py-8">

        {/* Progress stepper */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm"
            style={{ background: step >= 1 ? "#1b4a3a" : "#f3f4f6", color: step >= 1 ? "#fff" : "#9ca3af" }}
          >
            <User className="h-4 w-4" />
          </div>
          <div
            className="w-16 h-0.5 mx-2 rounded"
            style={{ background: step >= 2 ? "#1b4a3a" : "#e5e7eb" }}
          />
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm"
            style={{ background: step >= 2 ? "#1b4a3a" : "#f3f4f6", color: step >= 2 ? "#fff" : "#9ca3af" }}
          >
            <Building2 className="h-4 w-4" />
          </div>
        </div>

        {mutation.isError && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <ErrorMessage
              message={
                (mutation.error as any)?.response?.data?.email?.[0] ||
                (mutation.error as any)?.response?.data?.detail ||
                "Une erreur est survenue lors de l'inscription."
              }
              className="text-xs text-red-600"
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* STEP 1 */}
            <div className={step === 1 ? "block space-y-4" : "hidden"}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Prénom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jean"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Dupont"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Adresse e-mail professionnelle</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jean.dupont@entreprise.com"
                        type="email"
                        className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mot_de_passe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="pr-10 bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
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
                name="photo"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Photo de profil (Optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => { handlePhotoChange(e); }}
                        className="bg-gray-50 border-gray-200 rounded-lg text-sm focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={onNextStep}
                className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0 mt-2"
                style={{ background: "#1b4a3a" }}
              >
                Continuer
              </Button>
            </div>

            {/* STEP 2 */}
            <div className={step === 2 ? "block space-y-4" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Corp"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_fiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Numéro fiscal (Matricule)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567M"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="forme_juridique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Forme juridique</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SARL, SUARL, SA..."
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secteur_activite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Secteur d'activité</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Informatique, Industrie..."
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Téléphone de l'entreprise</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+216 71 000 000"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_notifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Email pour les notifications</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@entreprise.com"
                          type="email"
                          className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Adresse (Optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Rue de l'innovation"
                        className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents_justificatifs"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Document justificatif (Kbis, RNE, etc.)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => { handleFileChange(e); }}
                        className="bg-gray-50 border-gray-200 rounded-lg text-sm focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-11 rounded-lg text-sm font-semibold border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-2/3 h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0"
                  style={{ background: mutation.isPending ? "#2d6a55" : "#1b4a3a" }}
                >
                  {mutation.isPending ? "Inscription en cours..." : "S'inscrire"}
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </div>

      {/* Login link — below the card */}
      <p className="mt-5 text-center text-sm text-gray-400">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 text-gray-700 hover:text-[#1b4a3a] transition-colors"
        >
          Connectez-vous
        </Link>
      </p>

    </div>
  );
}
