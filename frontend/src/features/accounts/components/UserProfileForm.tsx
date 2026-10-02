"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "../api/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { User, Phone } from "lucide-react";
import { isImageNSFW } from "@/shared/utils/moderation";
import { toast } from "sonner";

const userProfileSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  photo: z.string().optional().or(z.literal("")),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

interface UserProfileFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function UserProfileForm({ onCancel, onSuccess }: UserProfileFormProps) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema) as any,
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      photo: "",
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        email: profile.email || "",
        telephone: profile.telephone || "",
        photo: profile.photo || "",
      });
    }
  }, [profile, form]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: UserProfileFormValues) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error(error);
      alert(error.response?.data?.email?.[0] || "Une erreur est survenue lors de la mise à jour.");
    },
  });

  const [imageStatus, setImageStatus] = React.useState<"checking" | "safe" | "bad" | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageStatus("checking");
      const isBad = await isImageNSFW(file);
      if (isBad) {
        setImageStatus("bad");
        e.target.value = ""; // Clear the input
        return;
      }
      setImageStatus("safe");

      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("photo", reader.result as string, {
          shouldValidate: true,
          shouldDirty: true,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setImageStatus(null);
    }
  };

  const onSubmit = (data: UserProfileFormValues) => {
    updateProfile(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Informations Personnelles */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <User className="h-5 w-5 text-brand-green" />
          <h2 className="text-lg font-semibold text-slate-900">Informations Personnelles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" {...form.register("nom")} />
            {form.formState.errors.nom && (
              <p className="text-sm text-red-500">{form.formState.errors.nom.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prenom">Prénom *</Label>
            <Input id="prenom" {...form.register("prenom")} />
            {form.formState.errors.prenom && (
              <p className="text-sm text-red-500">{form.formState.errors.prenom.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
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

          <div className="space-y-3 md:col-span-2">
            <Label>Photo de profil (Optionnel)</Label>
            <div className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                imageStatus === 'bad' ? 'border-red-400 bg-red-50/50' :
                imageStatus === 'safe' ? 'border-brand-green/50 bg-brand-green/5' :
                'border-slate-200 hover:border-brand-green hover:bg-slate-50'
            }`}>
              <input
                id="photo"
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {form.watch("photo") && imageStatus !== "bad" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img src={form.watch("photo")} alt="Preview" className="h-24 w-24 object-cover rounded-full border-4 border-white shadow-lg" />
                    {imageStatus === "safe" && (
                      <div className="absolute -bottom-1 -right-1 bg-brand-green text-white rounded-full border-2 border-white p-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Cliquez ou glissez pour modifier</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-slate-400 group-hover:text-brand-green transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 mb-1">Cliquez pour uploader ou glissez l'image ici</p>
                    <p className="text-xs text-slate-500">PNG, JPG ou JPEG (Max. 5Mo)</p>
                  </div>
                </div>
              )}

              {/* Status overlays */}
              {imageStatus === "checking" && (
                <div className="absolute inset-0 backdrop-blur-[2px] bg-white/70 rounded-2xl flex flex-col items-center justify-center z-20">
                   <div className="h-8 w-8 rounded-full border-4 border-brand-green border-t-transparent animate-spin mb-3"></div>
                   <p className="text-brand-green font-semibold text-sm animate-pulse">Analyse de sécurité par l'IA...</p>
                </div>
              )}
            </div>
            {imageStatus === "bad" && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Photo rejetée : Contenu inapproprié détecté. Veuillez choisir une autre image.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending || imageStatus === "checking"}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || imageStatus === "bad" || imageStatus === "checking"} className="bg-brand-green hover:bg-brand-green-hover text-white">
          {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
