"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/features/accounts/api/auth";
import { LoginCredentials } from "@/features/accounts/types/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { useAuth } from "@/core/auth/AuthContext";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { AlertCircle, Eye, EyeOff, Fingerprint, Camera } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { startAuthentication } from '@simplewebauthn/browser';
import { apiClient } from "@/services/api/client";
import { AIFaceLoginModal } from '@/features/accounts/components/AIFaceLoginModal';

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  mot_de_passe: z.string().min(1, { message: "Le mot de passe est requis." }),
});

function LoginContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: authLogin } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isAIFaceModalOpen, setIsAIFaceModalOpen] = React.useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      mot_de_passe: "",
    },
  });

  const { mutate: performLogin, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Clear any old user data from cache before saving new tokens
      queryClient.clear();

      // Use the global AuthContext login to update React state smoothly
      authLogin(data);

      // Redirect to dashboard (or wherever the main app lives)
      router.push("/");
    },
    onError: (error: AxiosError<any>) => {
      if (error.response && error.response.data) {
        const data = error.response.data;
        const message = data.detail || data.message || (data.non_field_errors && data.non_field_errors[0]) || "Une erreur inattendue est survenue.";
        setErrorMsg(message);
      } else {
        setErrorMsg("Connexion au serveur impossible. Veuillez réessayer.");
      }
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post("/api/v1/accounts/google-login/", { token });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      authLogin(data);
      router.push("/");
    },
    onError: (error: AxiosError<any>) => {
      if (error.response && error.response.data) {
        const data = error.response.data;
        const message = data.detail || data.message || (data.non_field_errors && data.non_field_errors[0]) || "Échec de la connexion via Google.";
        setErrorMsg(message);
      } else {
        setErrorMsg("Connexion au serveur impossible. Veuillez réessayer.");
      }
    },
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleLoginMutation.mutate(tokenResponse.access_token);
    },
    onError: () => {
      setErrorMsg("La connexion Google a été annulée ou a échoué.");
    }
  });

  const passkeyLoginMutation = useMutation({
    mutationFn: async (payload: { email: string; data: any }) => {
      const response = await apiClient.post("/api/v1/accounts/webauthn/login/verify/", payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      authLogin(data);
      router.push("/");
    },
    onError: (error: AxiosError<any>) => {
      if (error.response && error.response.data) {
        const data = error.response.data;
        const message = data.error || data.detail || "Échec de l'authentification Face ID.";
        setErrorMsg(message);
      } else {
        setErrorMsg("Connexion au serveur impossible. Veuillez réessayer.");
      }
    },
  });

  const handlePasskeyLogin = async () => {
    const email = form.getValues('email');
    if (!email) {
      setErrorMsg("Veuillez entrer votre adresse email d'abord pour utiliser Face ID.");
      return;
    }

    try {
      setErrorMsg(null);
      const { data: options } = await apiClient.post('/api/v1/accounts/webauthn/login/options/', { email });

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: options });
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Opération annulée ou refusée.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Votre navigateur ou appareil ne supporte pas Face ID / Passkeys.');
        }
        throw error;
      }

      passkeyLoginMutation.mutate({ email, data: asseResp });

    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || error.message || "Erreur avec l'authentification biométrique.";
      setErrorMsg(message);
    }
  };

  const handleOpenAIFace = () => {
    const email = form.getValues('email');
    if (!email) {
      setErrorMsg("Veuillez entrer votre adresse email d'abord pour utiliser la caméra.");
      return;
    }
    setErrorMsg(null);
    setIsAIFaceModalOpen(true);
  };

  const onAIFaceSuccess = (data: any) => {
    setIsAIFaceModalOpen(false);
    queryClient.clear();
    authLogin(data);
    router.push("/");
  };

  const onSubmit = (values: LoginCredentials) => {
    setErrorMsg(null);
    performLogin(values);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">

      {/* Heading — outside the card */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
          Bienvenue
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connectez-vous pour accéder à votre espace entreprise.
        </p>
      </div>

      {/* White card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md px-10 py-8 space-y-5">

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-600">{errorMsg}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Adresse email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="companytest@example.com"
                        type="email"
                        autoComplete="email"
                        disabled={isPending}
                        className="pr-10 bg-gray-50 border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-[#3CB395] focus-visible:border-[#3CB395]"
                        {...field}
                      />
                      {/* User icon */}
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="mot_de_passe"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </FormLabel>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs text-[#1b4a3a] hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={isPending}
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

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-lg text-sm font-semibold tracking-wide text-white border-0"
              style={{ background: isPending ? "#2d6a55" : "#1b4a3a" }}
            >
              {isPending ? "Connexion en cours..." : "Se connecter"}
            </Button>

            <div className="relative mt-6 mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-medium">Ou continuer avec</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                type="button" 
                variant="outline" 
                disabled={googleLoginMutation.isPending}
                className="w-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-11 shadow-sm" 
                onClick={() => handleGoogleLogin()}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                {googleLoginMutation.isPending ? "Patientez..." : "Google"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={passkeyLoginMutation.isPending}
                  className="w-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-11 shadow-sm flex items-center justify-center gap-2" 
                  onClick={handlePasskeyLogin}
                  title="Clé de l'appareil (Windows Hello, Touch ID)"
                >
                  <Fingerprint className="h-5 w-5 text-brand-green" />
                  {passkeyLoginMutation.isPending ? "Patientez..." : "Appareil"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700 h-11 shadow-sm flex items-center justify-center gap-2" 
                  onClick={handleOpenAIFace}
                  title="Reconnaissance faciale via Webcam"
                >
                  <Camera className="h-5 w-5 text-brand-green" />
                  IA Caméra
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </div>

      {/* Register link — below the card */}
      <p className="mt-5 text-center text-sm text-gray-400">
        Vous n'avez pas de compte ?{" "}
        <Link
          href="/register"
          className="font-semibold underline underline-offset-2 text-gray-700 hover:text-[#1b4a3a] transition-colors"
        >
          Inscrire votre entreprise
        </Link>
      </p>

      <AIFaceLoginModal 
        email={form.getValues('email')} 
        isOpen={isAIFaceModalOpen} 
        onClose={() => setIsAIFaceModalOpen(false)} 
        onSuccess={onAIFaceSuccess} 
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId="730834995146-6l4enptglgieh4svnv3jkr82jg7ahuoi.apps.googleusercontent.com">
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
