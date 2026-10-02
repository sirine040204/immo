import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAttribut, updateAttribut, createOption, fetchOptions } from "../api/attributs";
import { fetchFamilles } from "../api/familles";
import { AttributDynamique, CreateAttributDTO, TypeDonnee } from "../types/attribut";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AttributOptionsList } from "./AttributOptionsList";

// Helper to convert string to number, but empty to null
const numOrNull = (val: any) => {
  if (val === "" || val === null || val === undefined) return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

const attributSchema = z.object({
  famille: z.number().min(1, "La famille est obligatoire"),
  libelle: z.string().min(1, "Le libellé est obligatoire"),
  code: z.string().min(1, "Le code est obligatoire").regex(/^[A-Z0-9_]+$/, "Seules majuscules, chiffres et underscores"),
  type_donnee: z.nativeEnum(TypeDonnee),
  obligatoire: z.boolean(),
  valeur_defaut: z.string().optional(),
  placeholder: z.string().optional(),
  valeur_min: z.union([z.number(), z.string()]).nullable().optional(),
  valeur_max: z.union([z.number(), z.string()]).nullable().optional(),
  longueur_min: z.union([z.number(), z.string()]).nullable().optional(),
  longueur_max: z.union([z.number(), z.string()]).nullable().optional(),
  ordre_affichage: z.union([z.number(), z.string()]).nullable().optional(),
  isEditing: z.boolean().optional(),
  options: z.array(
    z.object({
      libelle: z.string().min(1, "Libellé requis"),
      code: z.string().min(1, "Code requis").regex(/^[A-Z0-9_]+$/, "Majuscules, chiffres, underscores"),
      ordre: z.coerce.number().min(1, "Doit être > 0")
    })
  ).optional(),
}).superRefine((data, ctx) => {
  const vMin = numOrNull(data.valeur_min);
  const vMax = numOrNull(data.valeur_max);
  if (vMin !== null && vMax !== null && vMin > vMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valeur min doit être <= Valeur max",
      path: ["valeur_min"],
    });
  }
  const lMin = numOrNull(data.longueur_min);
  const lMax = numOrNull(data.longueur_max);
  if (lMin !== null && lMax !== null && lMin > lMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Longueur min doit être <= Longueur max",
      path: ["longueur_min"],
    });
  }
  if (!data.isEditing && data.type_donnee === TypeDonnee.LISTE && (!data.options || data.options.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez ajouter au moins une option pour cette liste",
      path: ["options"],
    });
  }
});

type AttributFormValues = z.infer<typeof attributSchema>;

interface AttributDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attribut?: AttributDynamique | null;
  defaultFamilleId?: number;
}

export function AttributDialog({ isOpen, onClose, attribut, defaultFamilleId }: AttributDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!attribut;

  const { data: familles, isLoading: isFamillesLoading } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AttributFormValues>({
    // @ts-ignore
    resolver: zodResolver(attributSchema),
    defaultValues: {
      famille: defaultFamilleId || 0,
      libelle: "",
      code: "",
      type_donnee: TypeDonnee.TEXTE,
      obligatoire: false,
      valeur_defaut: "",
      placeholder: "",
      valeur_min: "",
      valeur_max: "",
      longueur_min: "",
      longueur_max: "",
      ordre_affichage: 0,
      isEditing: false,
      options: [],
    },
  });

  const watchType = watch("type_donnee");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  useEffect(() => {
    if (isOpen && attribut) {
      reset({
        famille: attribut.famille,
        libelle: attribut.libelle,
        code: attribut.code,
        type_donnee: attribut.type_donnee,
        obligatoire: attribut.obligatoire,
        valeur_defaut: attribut.valeur_defaut || "",
        placeholder: attribut.placeholder || "",
        valeur_min: attribut.valeur_min ?? "",
        valeur_max: attribut.valeur_max ?? "",
        longueur_min: attribut.longueur_min ?? "",
        longueur_max: attribut.longueur_max ?? "",
        ordre_affichage: attribut.ordre_affichage ?? 0,
        isEditing: true,
        options: [],
      });
    } else if (isOpen && !attribut) {
      reset({
        famille: defaultFamilleId || familles?.[0]?.id_famille || 0, // use defaultFamilleId if provided, else first available
        libelle: "",
        code: "",
        type_donnee: TypeDonnee.TEXTE,
        obligatoire: false,
        valeur_defaut: "",
        placeholder: "",
        valeur_min: "",
        valeur_max: "",
        longueur_min: "",
        longueur_max: "",
        ordre_affichage: 0,
        isEditing: false,
        options: [],
      });
    }
  }, [isOpen, attribut, reset, familles]);

  const createMutation = useMutation({
    mutationFn: createAttribut,
  });

  const updateMutation = useMutation({
    mutationFn: updateAttribut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributs"] });
      toast.success("Attribut dynamique modifié avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la modification");
    },
  });

  const { data: existingOptions } = useQuery({
    queryKey: ["options", attribut?.id_attribut],
    queryFn: () => fetchOptions(attribut!.id_attribut),
    enabled: isEditing && !!attribut && watchType === TypeDonnee.LISTE,
  });

  const onSubmit = async (data: AttributFormValues) => {
    // Nettoyer les champs inactifs
    let v_min = numOrNull(data.valeur_min);
    let v_max = numOrNull(data.valeur_max);
    let l_min = numOrNull(data.longueur_min);
    let l_max = numOrNull(data.longueur_max);

    if (data.type_donnee === TypeDonnee.TEXTE) {
      v_min = null; v_max = null;
    } else if (data.type_donnee === TypeDonnee.NOMBRE || data.type_donnee === TypeDonnee.DECIMAL) {
      l_min = null; l_max = null;
    } else {
      v_min = null; v_max = null; l_min = null; l_max = null;
    }

    if (isEditing && attribut) {
      if (data.type_donnee === TypeDonnee.LISTE) {
        // @ts-ignore - OptionAttribut is in types
        const existingOptions = queryClient.getQueryData<any[]>(["options", attribut.id_attribut]);
        if (existingOptions !== undefined && existingOptions.length === 0) {
          toast.error("Un attribut de type LISTE doit avoir au moins une option.");
          return;
        }
      }
      
      updateMutation.mutate({ 
        id: attribut.id_attribut, 
        data: {
          libelle: data.libelle,
          obligatoire: data.obligatoire,
          valeur_defaut: data.valeur_defaut || "",
          placeholder: data.placeholder || "",
          valeur_min: v_min,
          valeur_max: v_max,
          longueur_min: l_min,
          longueur_max: l_max,
          ordre_affichage: numOrNull(data.ordre_affichage) || 0,
        } 
      });
    } else {
      try {
        const newAttr = await createMutation.mutateAsync({
          famille: data.famille,
          libelle: data.libelle,
          code: data.code,
          type_donnee: data.type_donnee,
          obligatoire: data.obligatoire,
          valeur_defaut: data.valeur_defaut,
          placeholder: data.placeholder,
          valeur_min: v_min,
          valeur_max: v_max,
          longueur_min: l_min,
          longueur_max: l_max,
          ordre_affichage: numOrNull(data.ordre_affichage) || 0,
        });

        if (data.type_donnee === TypeDonnee.LISTE && data.options && data.options.length > 0) {
          try {
            await Promise.all(data.options.map(opt => createOption(newAttr.id_attribut, opt)));
          } catch (e) {
            toast.error("Attribut créé, mais erreur lors de la création de certaines options.");
          }
        }

        queryClient.invalidateQueries({ queryKey: ["attributs"] });
        toast.success("Attribut créé avec succès");
        onClose();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Erreur lors de la création.");
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isNumberType = watchType === TypeDonnee.NOMBRE || watchType === TypeDonnee.DECIMAL;
  const isTextType = watchType === TypeDonnee.TEXTE;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] min-h-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'attribut dynamique" : "Créer un attribut dynamique"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez la configuration de cet attribut. (La famille et le code sont verrouillés)"
              : "Créez un nouveau champ personnalisé pour vos immobilisations."}
          </DialogDescription>
        </DialogHeader>

        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Famille <span className="text-red-500">*</span></Label>
              <Select
                disabled={isEditing || isFamillesLoading}
                onValueChange={(v) => setValue("famille", parseInt(v || "0"))}
                value={watch("famille") ? watch("famille").toString() : ""}
              >
                <SelectTrigger className={isEditing ? "bg-slate-50" : ""}>
                  <SelectValue placeholder="Sélectionner une famille">
                    {watch("famille") ? familles?.find(f => f.id_famille === watch("famille"))?.nom : ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {familles?.map(f => (
                    <SelectItem key={f.id_famille} value={f.id_famille.toString()}>{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.famille && <p className="text-xs text-red-500">{errors.famille.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Code <span className="text-red-500">*</span></Label>
              <Input 
                {...register("code")} 
                placeholder="Ex: PUISSANCE" 
                disabled={isEditing} 
                className={isEditing ? "bg-slate-50" : ""}
                onChange={(e) => {
                  if(!isEditing) setValue("code", e.target.value.toUpperCase())
                }}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Libellé <span className="text-red-500">*</span></Label>
              <Input {...register("libelle")} placeholder="Ex: Puissance (Cheval)" />
              {errors.libelle && <p className="text-xs text-red-500">{errors.libelle.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type de donnée <span className="text-red-500">*</span></Label>
              <Select
                disabled={isEditing} // usually changing type breaks existing data
                onValueChange={(v) => setValue("type_donnee", v as TypeDonnee)}
                value={watchType}
              >
                <SelectTrigger className={isEditing ? "bg-slate-50" : ""}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TypeDonnee.TEXTE}>Texte</SelectItem>
                  <SelectItem value={TypeDonnee.NOMBRE}>Nombre entier</SelectItem>
                  <SelectItem value={TypeDonnee.DECIMAL}>Nombre décimal</SelectItem>
                  <SelectItem value={TypeDonnee.DATE}>Date</SelectItem>
                  <SelectItem value={TypeDonnee.BOOLEEN}>Booléen (Oui/Non)</SelectItem>
                  <SelectItem value={TypeDonnee.LISTE}>Liste de choix</SelectItem>
                </SelectContent>
              </Select>
              {errors.type_donnee && <p className="text-xs text-red-500">{errors.type_donnee.message as string}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input 
              type="checkbox"
              id="obligatoire" 
              checked={watch("obligatoire")} 
              onChange={(e) => setValue("obligatoire", e.target.checked)} 
              className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green cursor-pointer"
            />
            <Label htmlFor="obligatoire" className="cursor-pointer font-medium text-slate-700">Ce champ est obligatoire</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valeur par défaut</Label>
              <Input {...register("valeur_defaut")} placeholder="Ex: 0" />
            </div>
            <div className="space-y-2">
              <Label>Placeholder (Indication)</Label>
              <Input {...register("placeholder")} placeholder="Saisir la valeur..." />
            </div>
          </div>

          {/* Type specific configs */}
          {isNumberType && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-brand-green-light/50 rounded-lg border border-brand-green/15">
              <div className="space-y-2">
                <Label>Valeur min</Label>
                <Input type="number" step={watchType === TypeDonnee.DECIMAL ? "0.01" : "1"} {...register("valeur_min")} />
                {errors.valeur_min && <p className="text-xs text-red-500">{errors.valeur_min.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Valeur max</Label>
                <Input type="number" step={watchType === TypeDonnee.DECIMAL ? "0.01" : "1"} {...register("valeur_max")} />
                {errors.valeur_max && <p className="text-xs text-red-500">{errors.valeur_max.message as string}</p>}
              </div>
            </div>
          )}

          {isTextType && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="space-y-2">
                <Label>Longueur min (caractères)</Label>
                <Input type="number" min="0" {...register("longueur_min")} />
                {errors.longueur_min && <p className="text-xs text-red-500">{errors.longueur_min.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Longueur max (caractères)</Label>
                <Input type="number" min="0" {...register("longueur_max")} />
                {errors.longueur_max && <p className="text-xs text-red-500">{errors.longueur_max.message as string}</p>}
              </div>
            </div>
          )}

          {!isEditing && watchType === TypeDonnee.LISTE && (
            <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-orange-800">Options de la liste</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 border-orange-200 text-orange-700 hover:bg-orange-100"
                  onClick={() => append({ libelle: "", code: "", ordre: fields.length + 1 })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter option
                </Button>
              </div>
              
              {fields.length === 0 && (
                <p className="text-sm text-orange-600/70 italic text-center py-2">
                  Aucune option définie. Cliquez sur "Ajouter option".
                </p>
              )}
              
              {/* @ts-ignore - root message for array */}
              {errors.options?.message && (
                <p className="text-sm text-red-500 font-medium text-center">
                  {errors.options.message as string}
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input {...register(`options.${index}.libelle`)} placeholder="Libellé (ex: Bureau)" className="h-8 text-sm" />
                    {errors.options?.[index]?.libelle && <p className="text-[10px] text-red-500">{errors.options[index]?.libelle?.message}</p>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input {...register(`options.${index}.code`)} placeholder="Code (ex: BUREAU)" className="h-8 text-sm" onChange={(e) => setValue(`options.${index}.code`, e.target.value.toUpperCase())} />
                    {errors.options?.[index]?.code && <p className="text-[10px] text-red-500">{errors.options[index]?.code?.message}</p>}
                  </div>
                  <div className="w-20 space-y-1">
                    <Input type="number" {...register(`options.${index}.ordre`)} placeholder="Ordre" className="h-8 text-sm" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 w-1/2 pr-2">
            <Label>Ordre d'affichage</Label>
            <Input type="number" {...register("ordre_affichage")} />
          </div>

          {isEditing && watchType === TypeDonnee.LISTE && attribut && (
            <div className="pt-2 space-y-2">
              <AttributOptionsList attributId={attribut.id_attribut} />
              {existingOptions !== undefined && existingOptions.length === 0 && (
                <p className="text-sm text-red-500 font-medium text-center">
                  Veuillez ajouter au moins une option pour cette liste.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
