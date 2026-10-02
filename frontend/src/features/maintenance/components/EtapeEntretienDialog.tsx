import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEtapeEntretien, updateEtapeEntretien } from "../api/etapesEntretien";
import { fetchModelesEntretien } from "../api/modelesEntretien";
import { EtapeEntretien, CreateEtapeEntretienDTO } from "../types/etapeEntretien";
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
} from "@/shared/components/ui/select";

import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

const etapeEntretienSchema = z.object({
  modele_entretien: z.number().min(1, "Le modèle d'entretien est obligatoire"),
  libelle: z.string().min(1, "Le libellé est obligatoire"),
  description: z.string().optional(),
  ordre: z.number().min(1, "L'ordre doit être supérieur à 0"),
  obligatoire: z.boolean(),
});

type EtapeEntretienFormValues = z.infer<typeof etapeEntretienSchema>;

interface EtapeEntretienDialogProps {
  isOpen: boolean;
  onClose: () => void;
  etapeEntretien?: EtapeEntretien | null;
  defaultModeleId?: number | null;
  allEtapes: EtapeEntretien[];
}

export function EtapeEntretienDialog({ isOpen, onClose, etapeEntretien, defaultModeleId, allEtapes }: EtapeEntretienDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!etapeEntretien;

  const { data: modeles } = useQuery({
    queryKey: ["modeles-entretien"],
    queryFn: fetchModelesEntretien,
    enabled: isOpen,
  });

  const activeModeles = modeles?.filter(m => m.statut === "ACTIF" || (isEditing && m.id === etapeEntretien.modele_entretien)) || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EtapeEntretienFormValues>({
    resolver: zodResolver(etapeEntretienSchema),
    defaultValues: {
      modele_entretien: 0,
      libelle: "",
      description: "",
      ordre: 1,
      obligatoire: true,
    },
  });

  const selectedModele = watch("modele_entretien");
  const currentOrdre = watch("ordre");
  const isObligatoire = watch("obligatoire");

  const hasConflict = allEtapes.some(
    e =>
      e.modele_entretien === selectedModele &&
      e.ordre === currentOrdre &&
      e.statut === "ACTIF" &&
      (!etapeEntretien || e.id !== etapeEntretien.id)
  );

  useEffect(() => {
    if (isOpen && etapeEntretien) {
      reset({
        modele_entretien: etapeEntretien.modele_entretien,
        libelle: etapeEntretien.libelle,
        description: etapeEntretien.description || "",
        ordre: etapeEntretien.ordre,
        obligatoire: etapeEntretien.obligatoire,
      });
    } else if (isOpen && !etapeEntretien) {
      reset({
        modele_entretien: defaultModeleId || 0,
        libelle: "",
        description: "",
        ordre: 1,
        obligatoire: true,
      });
    }
  }, [isOpen, etapeEntretien, defaultModeleId, reset]);

  const createMutation = useMutation({
    mutationFn: createEtapeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapes-entretien"] });
      toast.success("Étape d'entretien créée avec succès");
      onClose();
    },
    onError: (error: any) => {
      const data = error.response?.data || {};
      const detail = data.detail || data.code?.[0] || data.non_field_errors?.[0];

      if (data.ordre && Array.isArray(data.ordre)) {
        toast.error("Une étape active avec ce numéro d'ordre existe déjà pour ce modèle d'entretien.");
      } else {
        toast.error(detail || "Une erreur est survenue lors de la création.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEtapeEntretien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapes-entretien"] });
      toast.success("Étape d'entretien modifiée avec succès");
      onClose();
    },
    onError: (error: any) => {
      const data = error.response?.data || {};
      const detail = data.detail || data.code?.[0] || data.non_field_errors?.[0];

      if (data.ordre && Array.isArray(data.ordre)) {
        toast.error("Une étape active avec ce numéro d'ordre existe déjà pour ce modèle d'entretien.");
      } else {
        toast.error(detail || "Une erreur est survenue lors de la modification.");
      }
    },
  });

  const onSubmit = (data: EtapeEntretienFormValues) => {
    const payload: CreateEtapeEntretienDTO = {
      ...data,
      description: data.description || undefined,
    };

    if (isEditing && etapeEntretien) {
      updateMutation.mutate({ id: etapeEntretien.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'étape d'entretien" : "Ajouter une étape d'entretien"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de cette étape."
              : "Créez une nouvelle étape pour un modèle d'entretien spécifique."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Modèle d'entretien <span className="text-red-500">*</span></Label>
            <Select
              key={`modele-${modeles?.length || 0}`}
              value={selectedModele ? selectedModele.toString() : ""}
              onValueChange={(val) => setValue("modele_entretien", Number(val), { shouldValidate: true, shouldDirty: true })}
            >
              <SelectTrigger className={errors.modele_entretien ? "border-red-500" : ""}>
                <span data-slot="select-value" className={selectedModele ? "line-clamp-1 text-left" : "text-muted-foreground"}>
                  {selectedModele ? modeles?.find(m => m.id === selectedModele)?.nom : "Sélectionnez un modèle"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {activeModeles.map(m => (
                  <SelectItem key={m.id} value={m.id.toString()}>{m.nom} ({m.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.modele_entretien && <p className="text-xs text-red-500">{errors.modele_entretien.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé de l'étape <span className="text-red-500">*</span></Label>
            <Input id="libelle" placeholder="Ex: Vérification de la pression des pneus" {...register("libelle")} />
            {errors.libelle && <p className="text-xs text-red-500">{errors.libelle.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description et instructions</Label>
            <Textarea
              id="description"
              placeholder="Instructions détaillées pour le technicien..."
              className="resize-none h-24"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-2">
              <Label htmlFor="ordre">Ordre d'exécution <span className="text-red-500">*</span></Label>
              <Input
                id="ordre"
                type="number"
                min="1"
                className="max-w-[120px]"
                {...register("ordre", {
                  setValueAs: (v) => v === "" ? 0 : parseInt(v, 10)
                })}
              />
              {errors.ordre && <p className="text-xs text-red-500">{errors.ordre.message}</p>}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Label htmlFor="obligatoire" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="obligatoire"
                  className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                  checked={isObligatoire}
                  onChange={(e) => setValue("obligatoire", e.target.checked, { shouldValidate: true, shouldDirty: true })}
                />
                Étape obligatoire
              </Label>
              <p className="text-xs text-slate-500 ml-11">
                Le technicien devra valider cette étape pour clôturer l'intervention.
              </p>
            </div>
          </div>

          {hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                Impossible d'utiliser cet ordre car une autre étape <strong>active</strong> utilise déjà l'ordre {currentOrdre} pour ce modèle. Veuillez choisir un autre numéro d'ordre.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white" disabled={isPending || hasConflict}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
