import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  createImmobilisation, 
  updateImmobilisation, 
  fetchValeursAttributs, 
  createValeurAttribut, 
  updateValeurAttribut 
} from "../api/immobilisations";
import { fetchFamilles } from "../api/familles";
import { fetchAttributs, fetchOptions } from "../api/attributs";
import { Immobilisation, ModeCalcul, MotifSortie } from "../types/immobilisation";
import { TypeDonnee, OptionAttribut } from "../types/attribut";
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
import { Textarea } from "../../../shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const EMPTY_ARRAY: any[] = [];

const immobilisationSchema = z.object({
  famille: z.coerce.number().min(1, "La famille est obligatoire"),
  code: z.string().min(1, "Le code est obligatoire"),
  designation: z.string().min(1, "La désignation est obligatoire"),
  description: z.string().optional(),
  date_acquisition: z.string().min(1, "La date d'acquisition est obligatoire"),
  valeur_brute: z.coerce.number().min(0.01, "La valeur brute doit être positive"),
  tva_recuperable: z.coerce.number().min(0, "La TVA ne peut pas être négative").optional(),
  numero_facture: z.string().optional(),
  taux_amortissement: z.preprocess((val) => val === "" ? null : val, z.coerce.number().min(0).max(100).optional().nullable()),
  mode_calcul: z.nativeEnum(ModeCalcul).optional(),
  amortissement_anterieur: z.coerce.number().min(0).optional(),
  numero_serie: z.string().optional(),
  date_mise_en_service: z.string().optional().nullable(),
  date_fin_garantie: z.string().optional().nullable(),
  etat_physique: z.string().optional(),
  date_cession: z.string().optional().nullable(),
  prix_cession: z.preprocess((val) => val === "" ? null : val, z.coerce.number().min(0).optional().nullable()),
  motif_sortie: z.nativeEnum(MotifSortie).optional().nullable(),
  date_derniere_maintenance: z.string().optional().nullable(),
  date_prochaine_maintenance: z.string().optional().nullable(),
  dynamic_fields: z.record(z.string(), z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.date_acquisition && data.date_mise_en_service) {
    if (new Date(data.date_mise_en_service) < new Date(data.date_acquisition)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de mise en service ne peut pas être antérieure à la date d'acquisition.",
        path: ["date_mise_en_service"],
      });
    }
  }

  if (data.date_mise_en_service) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(data.date_mise_en_service) > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de mise en service ne peut pas être dans le futur.",
        path: ["date_mise_en_service"],
      });
    }
  }

  if (data.date_mise_en_service && data.date_fin_garantie) {
    if (new Date(data.date_fin_garantie) < new Date(data.date_mise_en_service)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin de garantie ne peut pas être antérieure à la date de mise en service.",
        path: ["date_fin_garantie"],
      });
    }
  }

  if (data.date_derniere_maintenance && data.date_prochaine_maintenance) {
    if (new Date(data.date_derniere_maintenance) > new Date(data.date_prochaine_maintenance)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ne peut pas être postérieure à la prochaine.",
        path: ["date_derniere_maintenance"],
      });
    }
  }

});

type ImmobilisationFormValues = z.infer<typeof immobilisationSchema>;

interface ImmobilisationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null; // If null, we are creating
}

export function ImmobilisationFormDialog({ isOpen, onClose, immobilisation }: ImmobilisationFormDialogProps) {
  const queryClient = useQueryClient();
  const [optionsMap, setOptionsMap] = useState<Record<number, OptionAttribut[]>>({});

  const isEditMode = !!immobilisation;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<ImmobilisationFormValues>({
    // @ts-ignore
    resolver: zodResolver(immobilisationSchema),
    defaultValues: {
      dynamic_fields: {},
      mode_calcul: ModeCalcul.LINEAIRE,
      tva_recuperable: 0,
      amortissement_anterieur: 0,
      date_derniere_maintenance: "",
      date_prochaine_maintenance: "",
    }
  });

  const selectedFamille = watch("famille");

  // Fetch all Familles
  const { data: familles = EMPTY_ARRAY } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  // Fetch Attributs for the selected Famille
  const { data: attributs = EMPTY_ARRAY, isFetching: fetchingAttributs } = useQuery({
    queryKey: ["attributs", selectedFamille],
    queryFn: () => fetchAttributs(selectedFamille),
    enabled: !!selectedFamille,
  });

  // Fetch existing Valeurs for the immobilisation when editing
  const { data: existingValeurs = EMPTY_ARRAY, isFetching: fetchingValeurs } = useQuery({
    queryKey: ["valeurs-attributs", immobilisation?.id_immobilisation],
    queryFn: () => fetchValeursAttributs(immobilisation!.id_immobilisation),
    enabled: isEditMode,
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (isOpen && isEditMode && immobilisation && existingValeurs) {
      const dynFields: Record<string, any> = {};
      existingValeurs.forEach((v) => {
        if (v.option) {
          dynFields[v.attribut] = String(v.option);
        } else {
          if (v.valeur === "true") dynFields[v.attribut] = true;
          else if (v.valeur === "false") dynFields[v.attribut] = false;
          else dynFields[v.attribut] = v.valeur;
        }
      });

      reset({
        famille: immobilisation.famille,
        code: immobilisation.code,
        designation: immobilisation.designation,
        description: immobilisation.description || "",
        date_acquisition: immobilisation.date_acquisition,
        valeur_brute: Number(immobilisation.valeur_brute),
        tva_recuperable: Number(immobilisation.tva_recuperable || 0),
        numero_facture: immobilisation.numero_facture || "",
        taux_amortissement: immobilisation.taux_amortissement ? Number(immobilisation.taux_amortissement) : null,
        mode_calcul: immobilisation.mode_calcul,
        amortissement_anterieur: Number(immobilisation.amortissement_anterieur || 0),
        numero_serie: immobilisation.numero_serie || "",
        date_mise_en_service: immobilisation.date_mise_en_service || null,
        date_fin_garantie: immobilisation.date_fin_garantie || null,
        etat_physique: immobilisation.etat_physique || "",
        date_cession: immobilisation.date_cession || null,
        prix_cession: immobilisation.prix_cession ? Number(immobilisation.prix_cession) : null,
        motif_sortie: immobilisation.motif_sortie || null,
        date_derniere_maintenance: immobilisation.date_derniere_maintenance || "",
        date_prochaine_maintenance: immobilisation.date_prochaine_maintenance || "",
        dynamic_fields: dynFields,
      });
    } else if (isOpen && !isEditMode) {
      reset({
        dynamic_fields: {},
        mode_calcul: ModeCalcul.LINEAIRE,
        tva_recuperable: 0,
        amortissement_anterieur: 0,
        date_derniere_maintenance: "",
        date_prochaine_maintenance: "",
      });
    }
  }, [isOpen, isEditMode, immobilisation, existingValeurs, reset]);

  // Load options for LISTE attributes
  useEffect(() => {
    const loadOptions = async () => {
      const listAttributs = attributs.filter(a => a.type_donnee === TypeDonnee.LISTE);
      const newOptionsMap: Record<number, OptionAttribut[]> = {};
      
      for (const attr of listAttributs) {
        try {
          const opts = await fetchOptions(attr.id_attribut);
          newOptionsMap[attr.id_attribut] = opts;
        } catch (err) {
          console.error(`Failed to fetch options for attr ${attr.id_attribut}`, err);
        }
      }
      setOptionsMap(newOptionsMap);
    };

    if (attributs && attributs.length > 0) {
      loadOptions();
    }
  }, [attributs]);


  const saveMutation = useMutation({
    mutationFn: async (data: ImmobilisationFormValues) => {
      const { dynamic_fields, ...baseData } = data;
      const cleanedData = {
        ...baseData,
        date_mise_en_service: baseData.date_mise_en_service || null,
        date_fin_garantie: baseData.date_fin_garantie || null,
        date_cession: baseData.date_cession || null,
        date_derniere_maintenance: baseData.date_derniere_maintenance || null,
        date_prochaine_maintenance: baseData.date_prochaine_maintenance || null,
        motif_sortie: baseData.motif_sortie || "",
      };

      let immoId: number;

      // 1. Save Immobilisation
      if (isEditMode) {
        immoId = immobilisation!.id_immobilisation;
        await updateImmobilisation({ id: immoId, data: cleanedData as any });
      } else {
        const newImmo = await createImmobilisation(cleanedData as any);
        immoId = newImmo.id_immobilisation;
      }

      // 2. Save Dynamic Attributes
      if (dynamic_fields && attributs.length > 0) {
        const promises = attributs.map(async (attr) => {
          const rawValue = dynamic_fields[attr.id_attribut];
          if (rawValue === undefined || rawValue === null || rawValue === "") return;

          let valeurToSave: string | null = null;
          let optionToSave: number | null = null;

          if (attr.type_donnee === TypeDonnee.LISTE) {
            optionToSave = Number(rawValue);
          } else if (attr.type_donnee === TypeDonnee.BOOLEEN) {
            valeurToSave = rawValue ? "true" : "false";
          } else {
            valeurToSave = String(rawValue);
          }

          // Check if it already exists
          const existing = existingValeurs.find(v => v.attribut === attr.id_attribut);

          if (existing) {
            // Update
            if (existing.valeur !== valeurToSave || existing.option !== optionToSave) {
              await updateValeurAttribut({
                id: existing.id,
                data: {
                  valeur: valeurToSave,
                  option: optionToSave,
                }
              });
            }
          } else {
            // Create
            await createValeurAttribut({
              immobilisation: immoId,
              attribut: attr.id_attribut,
              valeur: valeurToSave,
              option: optionToSave,
            });
          }
        });

        await Promise.all(promises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      queryClient.invalidateQueries({ queryKey: ["valeurs-attributs"] });
      toast.success(isEditMode ? "Immobilisation modifiée avec succès" : "Immobilisation créée avec succès");
      onClose();
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData && typeof errorData === 'object' && !errorData.detail) {
        let hasFieldErrors = false;
        // Parse Django REST Framework field validation errors
        Object.keys(errorData).forEach((key) => {
          const messages = errorData[key];
          if (Array.isArray(messages) && messages.length > 0) {
            // Check if this field exists in our form schema
            if (key in immobilisationSchema.shape || key === "dynamic_fields") {
              // @ts-ignore - Dynamic fields or exact matches
              setError(key as any, { type: "server", message: messages[0] });
              hasFieldErrors = true;
            }
          }
        });
        
        if (hasFieldErrors) {
          toast.error("Veuillez corriger les erreurs dans le formulaire.");
          return;
        }
      }
      
      toast.error(errorData?.detail || `Une erreur est survenue lors de la ${isEditMode ? 'modification' : 'création'}.`);
    },
  });

  const onSubmit = (data: ImmobilisationFormValues) => {
    saveMutation.mutate(data);
  };

  const isLoading = saveMutation.isPending || fetchingAttributs || fetchingValeurs;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier l'immobilisation" : "Créer une immobilisation"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Modifiez les informations de l'immobilisation ${immobilisation?.code}.` : "Remplissez les informations pour ajouter une nouvelle immobilisation."}
          </DialogDescription>
        </DialogHeader>

        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
          
          {/* BASE INFO */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <Label htmlFor="famille">Famille <span className="text-red-500">*</span></Label>
                <Controller
                  name="famille"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(val) => field.onChange(Number(val))} 
                      value={field.value ? String(field.value) : ""}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className={errors.famille ? "border-red-500" : ""}>
                        <SelectValue placeholder="Sélectionnez une famille">
                          {field.value ? familles.find(f => f.id_famille === field.value)?.nom : ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {familles.map((f) => (
                          <SelectItem key={f.id_famille} value={String(f.id_famille)}>
                            {f.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.famille && <p className="text-xs text-red-500">{errors.famille.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="Code unique"
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Désignation <span className="text-red-500">*</span></Label>
                <Input
                  id="designation"
                  {...register("designation")}
                  placeholder="Nom de l'immobilisation"
                  className={errors.designation ? "border-red-500" : ""}
                />
                {errors.designation && <p className="text-xs text-red-500">{errors.designation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_acquisition">Date d'acquisition <span className="text-red-500">*</span></Label>
                <Input
                  id="date_acquisition"
                  type="date"
                  {...register("date_acquisition")}
                  className={errors.date_acquisition ? "border-red-500" : ""}
                />
                {errors.date_acquisition && <p className="text-xs text-red-500">{errors.date_acquisition.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valeur_brute">Valeur brute (MAD) <span className="text-red-500">*</span></Label>
                <Input
                  id="valeur_brute"
                  type="number"
                  step="0.01"
                  {...register("valeur_brute")}
                  className={errors.valeur_brute ? "border-red-500" : ""}
                />
                {errors.valeur_brute && <p className="text-xs text-red-500">{errors.valeur_brute.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Description détaillée (optionnelle)"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC INFO */}
          {selectedFamille && attributs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2 text-indigo-600">Attributs Dynamiques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attributs.map((attr) => {
                  const fieldName = `dynamic_fields.${attr.id_attribut}` as const;
                  const isRequired = attr.obligatoire;

                  return (
                    <div key={attr.id_attribut} className="space-y-2">
                      <Label>
                        {attr.libelle} {isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      
                      {attr.type_donnee === TypeDonnee.TEXTE && (
                        <Input
                          {...register(fieldName, { required: isRequired })}
                          placeholder={attr.placeholder || ""}
                          minLength={attr.longueur_min || undefined}
                          maxLength={attr.longueur_max || undefined}
                        />
                      )}

                      {attr.type_donnee === TypeDonnee.NOMBRE && (
                        <Input
                          type="number"
                          {...register(fieldName, { required: isRequired })}
                          placeholder={attr.placeholder || ""}
                          min={attr.valeur_min || undefined}
                          max={attr.valeur_max || undefined}
                        />
                      )}

                      {attr.type_donnee === TypeDonnee.DECIMAL && (
                        <Input
                          type="number"
                          step="0.01"
                          {...register(fieldName, { required: isRequired })}
                          placeholder={attr.placeholder || ""}
                          min={attr.valeur_min || undefined}
                          max={attr.valeur_max || undefined}
                        />
                      )}

                      {attr.type_donnee === TypeDonnee.DATE && (
                        <Input
                          type="date"
                          {...register(fieldName, { required: isRequired })}
                        />
                      )}

                      {attr.type_donnee === TypeDonnee.BOOLEEN && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Controller
                            name={fieldName}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                id={`check-${attr.id_attribut}`}
                                checked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                              />
                            )}
                          />
                          <label
                            htmlFor={`check-${attr.id_attribut}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Oui / Actif
                          </label>
                        </div>
                      )}

                      {attr.type_donnee === TypeDonnee.LISTE && (
                        <Controller
                          name={fieldName}
                          control={control}
                          rules={{ required: isRequired }}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ? String(field.value) : ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une option">
                                  {field.value ? optionsMap[attr.id_attribut]?.find(o => String(o.id) === String(field.value))?.libelle : ""}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {optionsMap[attr.id_attribut]?.map((opt) => (
                                  <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.libelle}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}

                      {/* @ts-ignore */}
                      {errors?.dynamic_fields?.[attr.id_attribut] && (
                        <p className="text-xs text-red-500">Ce champ est invalide ou obligatoire</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPTABILITE / OTHER DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informations Complémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tva_recuperable">TVA récupérable (MAD)</Label>
                <Input
                  id="tva_recuperable"
                  type="number"
                  step="0.01"
                  {...register("tva_recuperable")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_facture">Numéro de facture</Label>
                <Input id="numero_facture" {...register("numero_facture")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taux_amortissement">Taux d'amortissement (%)</Label>
                <Input
                  id="taux_amortissement"
                  type="number"
                  step="0.01"
                  {...register("taux_amortissement")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode_calcul">Mode de calcul</Label>
                <Controller
                  name="mode_calcul"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ModeCalcul.LINEAIRE}>Linéaire</SelectItem>
                        <SelectItem value={ModeCalcul.DEGRESSIF}>Dégressif</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_mise_en_service">Date mise en service</Label>
                <Input
                  id="date_mise_en_service"
                  type="date"
                  {...register("date_mise_en_service")}
                  className={errors.date_mise_en_service ? "border-red-500" : ""}
                />
                {errors.date_mise_en_service && <p className="text-xs text-red-500">{errors.date_mise_en_service.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_fin_garantie">Date fin garantie</Label>
                <Input
                  id="date_fin_garantie"
                  type="date"
                  {...register("date_fin_garantie")}
                  className={errors.date_fin_garantie ? "border-red-500" : ""}
                />
                {errors.date_fin_garantie && <p className="text-xs text-red-500">{errors.date_fin_garantie.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_derniere_maintenance">Dernière maintenance</Label>
                <Input
                  id="date_derniere_maintenance"
                  type="date"
                  {...register("date_derniere_maintenance")}
                  className={errors.date_derniere_maintenance ? "border-red-500" : ""}
                />
                {errors.date_derniere_maintenance && <p className="text-xs text-red-500">{errors.date_derniere_maintenance.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_prochaine_maintenance">Prochaine maintenance</Label>
                <Input
                  id="date_prochaine_maintenance"
                  type="date"
                  {...register("date_prochaine_maintenance")}
                  className={errors.date_prochaine_maintenance ? "border-red-500" : ""}
                />
                {errors.date_prochaine_maintenance && <p className="text-xs text-red-500">{errors.date_prochaine_maintenance.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_serie">Numéro de série</Label>
                <Input id="numero_serie" {...register("numero_serie")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="etat_physique">État physique</Label>
                <Input id="etat_physique" {...register("etat_physique")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-brand-green hover:bg-brand-green-hover text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                isEditMode ? "Enregistrer les modifications" : "Créer l'immobilisation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
