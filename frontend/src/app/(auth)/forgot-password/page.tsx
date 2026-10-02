"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset, verifyPasswordResetOTP } from "@/features/accounts/api/auth";
import { useRouter } from "next/navigation";
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
import { AlertCircle, KeyRound, MailCheck } from "lucide-react";
import { ErrorMessage } from "@/shared/components/ErrorMessage";

const emailSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
  method: z.enum(["OTP", "LINK"]),
});

const otpSchema = z.object({
  otp_code: z.string().length(6, "Le code doit contenir 6 chiffres."),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"EMAIL" | "OTP" | "LINK_SENT">("EMAIL");
  const [userEmail, setUserEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email form
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", method: "OTP" },
  });

  // OTP form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp_code: "" },
  });

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data, variables) => {
      setUserEmail(variables.email);
      setStep(variables.method === "OTP" ? "OTP" : "LINK_SENT");
      setErrorMsg(null);
    },
    onError: (error, variables) => {
      // Pour des raisons de sécurité, on passe à l'étape suivante même si l'email n'existe pas
      setUserEmail(variables.email);
      setStep(variables.method === "OTP" ? "OTP" : "LINK_SENT");
      setErrorMsg(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyPasswordResetOTP,
    onSuccess: (data) => {
      router.push(`/reset-password?token=${data.token}`);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.non_field_errors?.[0] || "Code de vérification invalide ou expiré.");
    },
  });

  const onEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    requestMutation.mutate(values);
  };

  const onOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    verifyMutation.mutate({ email: userEmail, otp_code: values.otp_code });
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
          Réinitialisation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {step === "EMAIL" && "Choisissez une méthode et entrez votre email."}
          {step === "OTP" && "Vérifiez votre boîte mail et entrez le code à 6 chiffres."}
          {step === "LINK_SENT" && "Vérifiez votre boîte mail."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md px-10 py-8 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-600">{errorMsg}</p>
          </div>
        )}

        {step === "EMAIL" && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">

              <FormField
                control={emailForm.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-medium text-gray-700">Méthode de réinitialisation</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${field.value === "OTP" ? "border-brand-green bg-brand-green/5 text-brand-green" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                          <input type="radio" className="hidden" {...field} value="OTP" checked={field.value === "OTP"} onChange={(e) => field.onChange(e.target.value)} />
                          <KeyRound className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium">Code</span>
                        </label>
                        <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${field.value === "LINK" ? "border-brand-green bg-brand-green/5 text-brand-green" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                          <input type="radio" className="hidden" {...field} value="LINK" checked={field.value === "LINK"} onChange={(e) => field.onChange(e.target.value)} />
                          <MailCheck className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium">Lien Magique</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Adresse email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jean.dupont@entreprise.com"
                        type="email"
                        disabled={requestMutation.isPending}
                        className="bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0"
                style={{ background: requestMutation.isPending ? "#2d6a55" : "#1b4a3a" }}
              >
                {requestMutation.isPending ? "Envoi en cours..." : "Continuer"}
              </Button>
            </form>
          </Form>
        )}

        {step === "OTP" && (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">

              <div className="bg-brand-green-light/50 border border-brand-green/20 rounded-lg p-4 flex gap-3 text-sm text-brand-green">
                <MailCheck className="w-5 h-5 shrink-0" />
                <p>Un email a été envoyé à <b>{userEmail}</b> contenant votre code de vérification.</p>
              </div>

              <FormField
                control={otpForm.control}
                name="otp_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Code de vérification (6 chiffres)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        type="text"
                        maxLength={6}
                        disabled={verifyMutation.isPending}
                        className="tracking-widest text-center text-lg bg-gray-50 border-gray-200 rounded-lg focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={verifyMutation.isPending}
                className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0"
                style={{ background: verifyMutation.isPending ? "#2d6a55" : "#1b4a3a" }}
              >
                {verifyMutation.isPending ? "Vérification..." : "Vérifier le code"}
              </Button>
            </form>
          </Form>
        )}

        {step === "LINK_SENT" && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-brand-green-light/50 border border-brand-green/20 rounded-full flex items-center justify-center mb-2">
              <MailCheck className="w-6 h-6 text-brand-green" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">Email envoyé</h3>
            <p className="text-sm text-gray-600">
              Si l'adresse <b>{userEmail}</b> existe, vous allez recevoir un lien magique de réinitialisation d'ici quelques instants.
            </p>
            <p className="text-sm text-gray-600">
              Cliquez sur ce lien pour choisir un nouveau mot de passe.
            </p>
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-sm text-gray-400">
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 text-gray-700 hover:text-[#1b4a3a] transition-colors"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
