import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createModeleEntretien, updateModeleEntretien } from "../api/modelesEntretien";
import { fetchTypesEntretien } from "../api/typesEntretien";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { ModeleEntretien, CreateModeleEntretienDTO, TypePlanification, UnitePeriodicite, UniteUsage } from "../types/modeleEntretien";
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
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Schema definition matching the backend constraints
const modeleEntretienSchema = z.object({
  famille: z.number().min(1, "La famille est obligatoire"),
  type_entretien: z.number().min(1, "Le type d'entretien est obligatoire"),
  code: z.string().min(1, "Le code est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  type_planification: z.enum(["TEMPS", "USAGE", "DATE_FIXE", "MANUELLE"] as const),
  
  // Conditional fields
  periodicite: z.number().nullable().optional(),
  unite_periodicite: z.enum(["JOURS", "SEMAINES", "MOIS", "ANNEES"] as const).nullable().optional(),
  seuil_usage: z.number().nullable().optional(),
  unite_usage: z.enum(["KM", "HEURES", "CYCLES"] as const).nullable().optional(),
  date_fixe: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type_planification === "TEMPS") {
    if (!data.periodicite || data.periodicite <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La périodicité est obligatoire et doit être > 0",
        path: ["periodicite"],
      });
    }
    if (!data.unite_periodicite) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'unité est obligatoire",
        path: ["unite_periodicite"],
      });
    }
  } else if (data.type_planification === "USAGE") {
    if (!data.seuil_usage || data.seuil_usage <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le seuil d'usage est obligatoire et doit être > 0",
        path: ["seuil_usage"],
      });
    }
    if (!data.unite_usage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'unité d'usage est obligatoire",
        path: ["unite_usage"],
      });
    }
  } else if (data.type_planification === "DATE_FIXE") {
    if (!data.date_fixe) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date fixe est obligatoire",
        path: ["date_fixe"],
      });
    } else {
      const selectedDate = new Date(data.date_fixe);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date de l'intervention ne peut pas être dans le passé",
          path: ["date_fixe"],
        });
      }
    }
  }
});

type ModeleEntretienFormValues = z.infer<typeof modeleEntretienSchema>;

interface ModeleEntretienDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modeleEntretien?: ModeleEntretien | null;
}

export function ModeleEntretienDialog({ isOpen, onClose, modeleEntretien }: ModeleEntretienDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!modeleEntretien;

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
    enabled: isOpen,
  });

  const { data: typesEntretien } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
    enabled: isOpen,
  });

  // Filter out active options for creation, but allow the currently selected one to show up if editing
  const activeFamilles = familles?.filter(f => f.statut === "ACTIVE" || (isEditing && f.id_famille === modeleEntretien.famille)) || [];
  const activeTypesEntretien = typesEntretien?.filter(t => t.statut === "ACTIF" || (isEditing && t.id === modeleEntretien.type_entretien)) || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ModeleEntretienFormValues>({
    resolver: zodResolver(modeleEntretienSchema),
    defaultValues: {
      famille: 0,
      type_entretien: 0,
      code: "",
      nom: "",
      description: "",
      type_planification: "MANUELLE",
      periodicite: null,
      unite_periodicite: null,
      seuil_usage: null,
      unite_usage: null,
      date_fixe: "",
    },
  });

  const selectedPlanification = watch("type_planification");
  const selectedFamille = watch("famille");
  const selectedTypeEntretien = watch("type_entretien");
  const selectedUnitePeriodicite = watch("unite_periodicite");
  const selectedUniteUsage = watch("unite_usage");

  useEffect(() => {
    if (isOpen && modeleEntretien) {
      reset({
        famille: modeleEntretien.famille,
        type_entretien: modeleEntretien.type_entretien,
        code: modeleEntretien.code,
        nom: modeleEntretien.nom,
        description: modeleEntretien.description || "",
        type_planification: modeleEntretien.type_planification,
        periodicite: modeleEntretien.periodicite || null,
        unite_periodicite: modeleEntretien.unite_periodicite || null,
        seuil_usage: modeleEntretien.seuil_usage || null,
        unite_usage: modeleEntretien.unite_usage || null,
        date_fixe: modeleEntretien.date_fixe || "",
      });
    } else if (isOpen && !modeleEntretien) {
      reset({
        famille: undefined as any,
        type_entretien: undefined as any,
        code: "",
        nom: "",
        description: "",
        type_planification: "MANUELLE",
        periodicite: null,
        unite_periodicite: null,
        seuil_usage: null,
        unite_usage: null,
        date_fixe: "",
      });
    }
  }, [isOpen, modeleEntretien, reset]);

  const createMutation = useMutation({
    mutationFn: createModeleEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeles-entretien"] });
      toast.success("Modèle d'entretien créé avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.code?.[0] || "Une erreur est survenue lors de la création.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateModeleEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeles-entretien"] });
      toast.success("Modèle d'entretien modifié avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.code?.[0] || "Une erreur est survenue lors de la modification.");
    },
  });

  const onSubmit = (data: ModeleEntretienFormValues) => {
    // Strip irrelevant fields based on planification type
    const payload: CreateModeleEntretienDTO = {
      famille: data.famille,
      type_entretien: data.type_entretien,
      code: data.code,
      nom: data.nom,
      description: data.description || undefined,
      type_planification: data.type_planification,
      periodicite: data.type_planification === "TEMPS" ? data.periodicite : null,
      unite_periodicite: data.type_planification === "TEMPS" ? data.unite_periodicite : null,
      seuil_usage: data.type_planification === "USAGE" ? data.seuil_usage : null,
      unite_usage: data.type_planification === "USAGE" ? data.unite_usage : null,
      date_fixe: data.type_planification === "DATE_FIXE" ? data.date_fixe : null,
    };

    if (isEditing && modeleEntretien) {
      updateMutation.mutate({ id: modeleEntretien.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le modèle d'entretien" : "Créer un nouveau modèle d'entretien"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de ce modèle d'entretien ci-dessous."
              : "Remplissez les informations pour configurer un modèle d'entretien."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
              <Input id="code" placeholder="EX: VIDANGE_MOTEUR" {...register("code")} />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
              <Input id="nom" placeholder="Ex: Vidange Moteur" {...register("nom")} />
              {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Famille d'Immobilisation <span className="text-red-500">*</span></Label>
              <Select key={`famille-${familles?.length || 0}`} value={selectedFamille ? selectedFamille.toString() : ""} onValueChange={(val) => setValue("famille", Number(val), { shouldValidate: true, shouldDirty: true })}>
                <SelectTrigger className={errors.famille ? "border-red-500" : ""}>
                  <span data-slot="select-value" className={selectedFamille ? "" : "text-muted-foreground"}>
                    {selectedFamille ? familles?.find(f => f.id_famille === selectedFamille)?.nom : "Sélectionnez une famille"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {activeFamilles.map(f => (
                    <SelectItem key={f.id_famille} value={f.id_famille.toString()}>{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.famille && <p className="text-xs text-red-500">{errors.famille.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type d'Entretien <span className="text-red-500">*</span></Label>
              <Select key={`type-${typesEntretien?.length || 0}`} value={selectedTypeEntretien ? selectedTypeEntretien.toString() : ""} onValueChange={(val) => setValue("type_entretien", Number(val), { shouldValidate: true, shouldDirty: true })}>
                <SelectTrigger className={errors.type_entretien ? "border-red-500" : ""}>
                  <span data-slot="select-value" className={selectedTypeEntretien ? "" : "text-muted-foreground"}>
                    {selectedTypeEntretien ? typesEntretien?.find(t => t.id === selectedTypeEntretien)?.nom : "Sélectionnez un type"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {activeTypesEntretien.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type_entretien && <p className="text-xs text-red-500">{errors.type_entretien.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Description détaillée de ce modèle d'entretien..." 
              className="resize-none"
              {...register("description")} 
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Planification</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de planification <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedPlanification} 
                  onValueChange={(val) => setValue("type_planification", val as TypePlanification, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type de planification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEMPS">Basée sur le Temps (Périodicité)</SelectItem>
                    <SelectItem value="USAGE">Basée sur l'Usage (Kilométrage/Heures)</SelectItem>
                    <SelectItem value="DATE_FIXE">Date Fixe</SelectItem>
                    <SelectItem value="MANUELLE">Manuelle (Déclenchement Ad-hoc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Fields Based on Planification Type */}
              {selectedPlanification === "TEMPS" && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <Label htmlFor="periodicite">Périodicité (Valeur) <span className="text-red-500">*</span></Label>
                    <Input 
                      id="periodicite" 
                      type="number" 
                      min="1"
                      placeholder="Ex: 6" 
                      {...register("periodicite", { 
                        setValueAs: (v) => v === "" ? null : parseInt(v, 10) 
                      })} 
                    />
                    {errors.periodicite && <p className="text-xs text-red-500">{errors.periodicite.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Unité <span className="text-red-500">*</span></Label>
                    <Select 
                      value={selectedUnitePeriodicite || ""} 
                      onValueChange={(val) => setValue("unite_periodicite", val as UnitePeriodicite, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger className={errors.unite_periodicite ? "border-red-500" : ""}>
                        <SelectValue placeholder="Choisir l'unité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JOURS">Jours</SelectItem>
                        <SelectItem value="SEMAINES">Semaines</SelectItem>
                        <SelectItem value="MOIS">Mois</SelectItem>
                        <SelectItem value="ANNEES">Années</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.unite_periodicite && <p className="text-xs text-red-500">{errors.unite_periodicite.message}</p>}
                  </div>
                </div>
              )}

              {selectedPlanification === "USAGE" && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <Label htmlFor="seuil_usage">Seuil d'usage <span className="text-red-500">*</span></Label>
                    <Input 
                      id="seuil_usage" 
                      type="number" 
                      min="1"
                      placeholder="Ex: 10000" 
                      {...register("seuil_usage", { 
                        setValueAs: (v) => v === "" ? null : parseInt(v, 10) 
                      })} 
                    />
                    {errors.seuil_usage && <p className="text-xs text-red-500">{errors.seuil_usage.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Unité d'usage <span className="text-red-500">*</span></Label>
                    <Select 
                      value={selectedUniteUsage || ""} 
                      onValueChange={(val) => setValue("unite_usage", val as UniteUsage, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger className={errors.unite_usage ? "border-red-500" : ""}>
                        <SelectValue placeholder="Choisir l'unité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KM">Kilomètres (km)</SelectItem>
                        <SelectItem value="HEURES">Heures (h)</SelectItem>
                        <SelectItem value="CYCLES">Cycles</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.unite_usage && <p className="text-xs text-red-500">{errors.unite_usage.message}</p>}
                  </div>
                </div>
              )}

              {selectedPlanification === "DATE_FIXE" && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="date_fixe">Date fixe de l'intervention <span className="text-red-500">*</span></Label>
                    <Input 
                      id="date_fixe" 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...register("date_fixe")} 
                    />
                    {errors.date_fixe && <p className="text-xs text-red-500">{errors.date_fixe.message}</p>}
                  </div>
                </div>
              )}

              {selectedPlanification === "MANUELLE" && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-500">
                  L'intervention basée sur ce modèle ne sera déclenchée que manuellement par un technicien ou un gestionnaire. Aucun paramètre supplémentaire n'est requis.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
