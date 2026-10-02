"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyProfile, updateCompanyProfile } from "../api/companies";
import { CompanyProfileUpdate } from "../types/company";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Building, Mail, Phone, MapPin, Globe, AlignLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { containsProfanity, isImageNSFW } from "@/shared/utils/moderation";

const AddressMapPicker = dynamic(
  () => import("./AddressMapPicker"),
  { ssr: false, loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-md border border-slate-200"></div> }
);

const companyProfileSchema = z.object({
  nom_entreprise: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  forme_juridique: z.string().optional(),
  secteur_activite: z.string().optional(),
  email_notifications: z.string().email("Email invalide").optional().or(z.literal("")),
  numero_telephone: z.string().optional(),
  adresse: z.string().optional(),
  site_web: z.string().url("URL invalide").optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  devise: z.string().optional(),
  langue: z.string().optional(),
  delai_rappel_maintenance_defaut: z.coerce.number().min(0).optional(),
  delai_rappel_document_defaut: z.coerce.number().min(0).optional(),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CompanyProfileForm({ onCancel, onSuccess }: CompanyProfileFormProps) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["companyProfile"],
    queryFn: getCompanyProfile,
  });

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema) as any,
    defaultValues: {
      nom_entreprise: "",
      forme_juridique: "",
      secteur_activite: "",
      email_notifications: "",
      numero_telephone: "",
      adresse: "",
      site_web: "",
      description: "",
      devise: "TND",
      langue: "FR",
      delai_rappel_maintenance_defaut: 7,
      delai_rappel_document_defaut: 30,
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        nom_entreprise: profile.nom_entreprise || "",
        forme_juridique: profile.forme_juridique || "",
        secteur_activite: profile.secteur_activite || "",
        email_notifications: profile.email_notifications || "",
        numero_telephone: profile.numero_telephone || "",
        adresse: profile.adresse || "",
        site_web: profile.site_web || "",
        logo: profile.logo || "",
        description: profile.description || "",
        devise: profile.devise || "TND",
        langue: profile.langue || "FR",
        delai_rappel_maintenance_defaut: profile.delai_rappel_maintenance_defaut ?? 7,
        delai_rappel_document_defaut: profile.delai_rappel_document_defaut ?? 30,
      });
    }
  }, [profile, form]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: CompanyProfileUpdate) => updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error(error);
      alert("Une erreur est survenue lors de la mise à jour.");
    },
  });

  const [imageStatus, setImageStatus] = React.useState<"checking" | "safe" | "bad" | null>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageStatus("checking");
      const isBad = await isImageNSFW(file);
      if (isBad) {
        setImageStatus("bad");
        e.target.value = ""; // clear the input
        return;
      }
      setImageStatus("safe");
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("logo", reader.result as string, {
          shouldValidate: true,
          shouldDirty: true,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setImageStatus(null);
    }
  };

  const onSubmit = (data: CompanyProfileFormValues) => {
    if (data.description && containsProfanity(data.description)) {
      toast.error("Votre description contient un langage inapproprié.");
      return;
    }

    // Only send fields that are allowed to be updated.
    // Replace empty strings with undefined/null or leave as is based on backend expectation.
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
      {/* Informations Générales */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Building className="h-5 w-5 text-brand-green" />
          <h2 className="text-lg font-semibold text-slate-900">Informations Générales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nom_entreprise">Nom de l'entreprise *</Label>
            <Input id="nom_entreprise" {...form.register("nom_entreprise")} />
            {form.formState.errors.nom_entreprise && (
              <p className="text-sm text-red-500">{form.formState.errors.nom_entreprise.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="forme_juridique">Forme Juridique</Label>
            <Input id="forme_juridique" {...form.register("forme_juridique")} placeholder="ex: SARL, SUARL" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secteur_activite">Secteur d'activité</Label>
            <Input id="secteur_activite" {...form.register("secteur_activite")} placeholder="ex: Informatique, Transport" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                <AlignLeft className="h-4 w-4 text-slate-400" />
              </div>
              <textarea
                id="description"
                {...form.register("description")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Brève description de vos activités..."
              />
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Logo de l'entreprise (Optionnel)</Label>
            <div className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${imageStatus === 'bad' ? 'border-red-400 bg-red-50/50' :
                imageStatus === 'safe' ? 'border-brand-green/50 bg-brand-green/5' :
                  'border-slate-200 hover:border-brand-green hover:bg-slate-50'
              }`}>
              <input
                id="logo"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleLogoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {form.watch("logo") && imageStatus !== "bad" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img src={form.watch("logo")} alt="Logo Preview" className="h-24 w-auto max-w-[200px] object-contain rounded-xl shadow-sm border border-slate-200 bg-white p-2" />
                    {imageStatus === "safe" && (
                      <div className="absolute -bottom-2 -right-2 bg-brand-green text-white rounded-full border-2 border-white p-0.5 shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Cliquez ou glissez pour modifier le logo</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-slate-400 group-hover:text-brand-green transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 mb-1">Cliquez pour uploader ou glissez le logo ici</p>
                    <p className="text-xs text-slate-500">PNG, JPG, JPEG ou SVG (Max. 5Mo)</p>
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
                <svg className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                Image rejetée : Contenu inapproprié détecté. Veuillez choisir une autre image.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <MapPin className="h-5 w-5 text-brand-green" />
          <h2 className="text-lg font-semibold text-slate-900">Coordonnées</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="adresse">Adresse complète</Label>
            <Input id="adresse" {...form.register("adresse")} placeholder="123 rue de la Paix..." />
            <div className="mt-4 pt-2">
              <Label className="mb-2 block text-slate-500">Ou sélectionnez l'adresse sur la carte :</Label>
              <AddressMapPicker
                searchValue={form.watch("adresse")}
                onAddressSelect={(addr) => form.setValue("adresse", addr, { shouldValidate: true, shouldDirty: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_notifications">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <Input id="email_notifications" {...form.register("email_notifications")} className="pl-10" />
            </div>
            {form.formState.errors.email_notifications && (
              <p className="text-sm text-red-500">{form.formState.errors.email_notifications.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_telephone">Numéro de téléphone</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <Input id="numero_telephone" {...form.register("numero_telephone")} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_web">Site Web</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-slate-400" />
              </div>
              <Input id="site_web" {...form.register("site_web")} className="pl-10" placeholder="https://..." />
            </div>
            {form.formState.errors.site_web && (
              <p className="text-sm text-red-500">{form.formState.errors.site_web.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="devise">Devise par défaut</Label>
            <Input id="devise" {...form.register("devise")} placeholder="TND, EUR, USD..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="langue">Langue par défaut</Label>
            <Input id="langue" {...form.register("langue")} placeholder="FR, EN, AR..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delai_rappel_maintenance_defaut">Rappel maintenance (jours)</Label>
            <Input id="delai_rappel_maintenance_defaut" type="number" {...form.register("delai_rappel_maintenance_defaut")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delai_rappel_document_defaut">Rappel document (jours)</Label>
            <Input id="delai_rappel_document_defaut" type="number" {...form.register("delai_rappel_document_defaut")} />
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
