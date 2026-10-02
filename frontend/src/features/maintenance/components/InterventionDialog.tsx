import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIntervention, updateIntervention } from "../api/interventions";
import { fetchModelesEntretien } from "../api/modelesEntretien";
import { fetchTypesEntretien } from "../api/typesEntretien";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { Intervention, CreateInterventionDTO, UpdateInterventionDTO } from "../types/intervention";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { toast } from "sonner";
import { Loader2, AlertCircle, Search, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";

const interventionSchema = z.object({
  immobilisation: z.number().min(1, "L'immobilisation est obligatoire"),
  type_entretien: z.number().min(1, "Le type d'entretien est obligatoire"),
  modele_entretien: z.number().nullable(),
  date_prevue: z.string().nullable().optional(),
  priorite: z.enum(["FAIBLE", "NORMALE", "HAUTE", "URGENTE"]),
  motif: z.string().optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface InterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  intervention?: Intervention | null;
  isCorrectiveMode?: boolean;
  initialImmobilisationId?: number;
}

export function InterventionDialog({ isOpen, onClose, intervention, isCorrectiveMode, initialImmobilisationId }: InterventionDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!intervention;
  const isEditableModele = !isEditing || intervention.statut === "BROUILLON";

  const [immoPopoverOpen, setImmoPopoverOpen] = useState(false);
  const [immoSearchQuery, setImmoSearchQuery] = useState("");

  const { data: modeles } = useQuery({ queryKey: ["modeles-entretien"], queryFn: fetchModelesEntretien, enabled: isOpen });
  const { data: types } = useQuery({ queryKey: ["types-entretien"], queryFn: fetchTypesEntretien, enabled: isOpen });
  const { data: immobilisations } = useQuery({ queryKey: ["immobilisations"], queryFn: fetchImmobilisations, enabled: isOpen });

  const correctiveTypes = types?.filter(t => t.code.toUpperCase() === "CORRECTIF") || [];
  const nonCorrectiveTypes = types?.filter(t => t.code.toUpperCase() !== "CORRECTIF") || [];

  const activeImmobilisations = immobilisations?.filter(i => i.statut === "ACTIVE" || (isEditing && i.id_immobilisation === intervention.immobilisation)) || [];
  
  const filteredImmos = activeImmobilisations.filter(i => 
    i.code.toLowerCase().includes(immoSearchQuery.toLowerCase()) || 
    i.designation.toLowerCase().includes(immoSearchQuery.toLowerCase())
  );

  const activeModeles = modeles?.filter(m => m.statut === "ACTIF" || (isEditing && m.id === intervention.modele_entretien)) || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<InterventionFormValues>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      immobilisation: 0,
      type_entretien: 0,
      modele_entretien: null,
      date_prevue: null,
      priorite: "NORMALE",
      motif: "",
    },
  });

  const selectedImmobilisationId = watch("immobilisation");
  const selectedImmo = activeImmobilisations.find(i => i.id_immobilisation === selectedImmobilisationId);

  // Filter modeles by family and type
  const selectedTypeId = watch("type_entretien");
  const filteredModeles = activeModeles.filter(m => {
    if (!selectedImmo) return false;
    return m.famille === selectedImmo.famille && m.type_entretien === selectedTypeId;
  });

  useEffect(() => {
    if (isOpen) {
      if (intervention) {
        reset({
          immobilisation: intervention.immobilisation,
          type_entretien: intervention.type_entretien,
          modele_entretien: intervention.modele_entretien,
          date_prevue: intervention.date_prevue || null,
          priorite: intervention.priorite,
          motif: intervention.motif || "",
        });
      } else {
        reset({
          immobilisation: initialImmobilisationId || 0,
          type_entretien: isCorrectiveMode && correctiveTypes.length > 0 ? correctiveTypes[0].id : 0,
          modele_entretien: null,
          date_prevue: null,
          priorite: "NORMALE",
          motif: "",
        });
      }
    }
  }, [isOpen, intervention, isCorrectiveMode, reset, correctiveTypes.length, initialImmobilisationId]);

  const createMutation = useMutation({
    mutationFn: createIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast.success("Intervention créée avec succès (Brouillon)");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.modele_entretien?.[0] || "Une erreur est survenue lors de la création.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      queryClient.invalidateQueries({ queryKey: ["intervention", intervention?.id] });
      toast.success("Intervention modifiée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.modele_entretien?.[0] || "Une erreur est survenue lors de la modification.");
    },
  });

  const onSubmit = (data: InterventionFormValues) => {
    if (!isCorrectiveMode && !data.modele_entretien && (!isEditing || isEditableModele)) {
      toast.error("Le modèle d'entretien est obligatoire pour cette intervention.");
      return;
    }

    const payload: any = {
      immobilisation: data.immobilisation,
      type_entretien: data.type_entretien,
      priorite: data.priorite,
      motif: data.motif || "",
    };

    if (data.date_prevue) {
      payload.date_prevue = data.date_prevue;
    } else {
      payload.date_prevue = null;
    }

    if (isEditableModele) {
      payload.modele_entretien = isCorrectiveMode ? null : data.modele_entretien;
    }

    if (isEditing && intervention) {
      updateMutation.mutate({ id: intervention.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'intervention" : isCorrectiveMode ? "Nouvelle Intervention Corrective" : "Nouvelle Intervention (Standard)"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de cette intervention."
              : isCorrectiveMode
                ? "Créez une intervention corrective immédiate (sans modèle d'entretien)."
                : "Planifiez une intervention préventive ou récurrente basée sur un modèle."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Immobilisation <span className="text-red-500">*</span></Label>
            <Controller
              control={control}
              name="immobilisation"
              render={({ field }) => (
                <Popover open={immoPopoverOpen} onOpenChange={setImmoPopoverOpen}>
                  <PopoverTrigger
                    disabled={isEditing}
                    className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.immobilisation ? "border-red-500" : ""}`}
                  >
                    <span className={field.value ? "line-clamp-1 text-left" : "text-slate-500 font-normal"}>
                      {field.value ? activeImmobilisations.find(i => i.id_immobilisation === field.value)?.designation : "Sélectionnez une immobilisation"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-full sm:w-[552px] p-0" align="start">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Rechercher une immobilisation..."
                        value={immoSearchQuery}
                        onChange={(e) => setImmoSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                      {filteredImmos.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-500">Aucune immobilisation trouvée.</div>
                      ) : (
                        filteredImmos.map(i => (
                          <div
                            key={i.id_immobilisation}
                            className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 cursor-pointer ${field.value === i.id_immobilisation ? 'bg-slate-50 font-medium' : ''}`}
                            onClick={() => {
                              field.onChange(i.id_immobilisation);
                              setImmoSearchQuery("");
                              setImmoPopoverOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${field.value === i.id_immobilisation ? "opacity-100" : "opacity-0"}`} />
                            {i.code} - {i.designation}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.immobilisation && <p className="text-xs text-red-500">{errors.immobilisation.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type d'entretien <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="type_entretien"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                      setValue("modele_entretien", null);
                    }}
                    disabled={isCorrectiveMode || isEditing}
                  >
                    <SelectTrigger className={errors.type_entretien ? "border-red-500" : ""}>
                      <span className={field.value ? "line-clamp-1 text-left" : "text-muted-foreground"}>
                        {field.value ? types?.find(t => t.id === field.value)?.nom : "Sélectionnez un type"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(isCorrectiveMode ? correctiveTypes : nonCorrectiveTypes).map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type_entretien && <p className="text-xs text-red-500">{errors.type_entretien.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Priorité <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="priorite"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <span>
                        {field.value === "FAIBLE" ? "Faible" : 
                         field.value === "NORMALE" ? "Normale" : 
                         field.value === "HAUTE" ? "Haute" : "Urgente"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAIBLE">Faible</SelectItem>
                      <SelectItem value="NORMALE">Normale</SelectItem>
                      <SelectItem value="HAUTE">Haute</SelectItem>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {!isCorrectiveMode && (
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <Label>Modèle d'entretien <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="modele_entretien"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={!isEditableModele || !selectedImmobilisationId || !selectedTypeId}
                  >
                    <SelectTrigger className={errors.modele_entretien ? "border-red-500 bg-white" : "bg-white"}>
                      <span className={field.value ? "line-clamp-1 text-left" : "text-muted-foreground"}>
                        {field.value ? modeles?.find(m => m.id === field.value)?.nom : "Sélectionnez un modèle"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModeles.length > 0 ? (
                        filteredModeles.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.code} - {m.nom}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-slate-500">Aucun modèle compatible trouvé pour cette famille et ce type.</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.modele_entretien && <p className="text-xs text-red-500">{errors.modele_entretien.message}</p>}
              {!isEditableModele && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Le modèle ne peut plus être modifié car l'intervention n'est plus à l'état de brouillon.
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Date prévue</Label>
            <Input 
              type="date" 
              min={isEditing && intervention?.date_prevue && intervention.date_prevue < today ? intervention.date_prevue : today}
              {...register("date_prevue")} 
            />
            <p className="text-xs text-slate-500">Requis ultérieurement pour planifier l'intervention.</p>
          </div>

          <div className="space-y-2">
            <Label>Motif / Remarques</Label>
            <Textarea 
              placeholder="Précisez le motif de cette intervention..." 
              className="resize-none h-20"
              {...register("motif")} 
            />
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
