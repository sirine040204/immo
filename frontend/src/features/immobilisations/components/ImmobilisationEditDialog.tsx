import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateImmobilisation } from "../api/immobilisations";
import { Immobilisation, ModeCalcul, MotifSortie } from "../types/immobilisation";
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

const immobilisationSchema = z.object({
  code: z.string().min(1, "Le code est obligatoire"),
  designation: z.string().min(1, "La désignation est obligatoire"),
  description: z.string().optional(),
  date_acquisition: z.string().min(1, "La date d'acquisition est obligatoire"),
  valeur_brute: z.coerce.number().min(0.01, "La valeur brute doit être positive"),
  tva_recuperable: z.coerce.number().min(0, "La TVA ne peut pas être négative").optional(),
  numero_facture: z.string().optional(),
  taux_amortissement: z.coerce.number().min(0).max(100).optional().nullable(),
  mode_calcul: z.nativeEnum(ModeCalcul).optional(),
  amortissement_anterieur: z.coerce.number().min(0).optional(),
  numero_serie: z.string().optional(),
  date_mise_en_service: z.string().optional().nullable(),
  date_fin_garantie: z.string().optional().nullable(),
  etat_physique: z.string().optional(),
  date_cession: z.string().optional().nullable(),
  prix_cession: z.coerce.number().min(0).optional().nullable(),
  motif_sortie: z.nativeEnum(MotifSortie).optional().nullable(),
});

type ImmobilisationFormValues = z.infer<typeof immobilisationSchema>;

interface ImmobilisationEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export function ImmobilisationEditDialog({ isOpen, onClose, immobilisation }: ImmobilisationEditDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ImmobilisationFormValues>({
    // @ts-ignore - mismatch between zod and hook-form types for coerce
    resolver: zodResolver(immobilisationSchema),
  });

  useEffect(() => {
    if (isOpen && immobilisation) {
      reset({
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
      });
    }
  }, [isOpen, immobilisation, reset]);

  const updateMutation = useMutation({
    mutationFn: updateImmobilisation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation modifiée avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la modification.");
    },
  });

  const onSubmit = (data: ImmobilisationFormValues) => {
    if (!immobilisation) return;

    // Clean up empty strings to undefined or null for API payload
    const cleanedData = {
      ...data,
      date_mise_en_service: data.date_mise_en_service || undefined,
      date_fin_garantie: data.date_fin_garantie || undefined,
      date_cession: data.date_cession || undefined,
    };

    updateMutation.mutate({
      id: immobilisation.id_immobilisation,
      data: cleanedData as any,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'immobilisation</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'immobilisation {immobilisation?.code}.
          </DialogDescription>
        </DialogHeader>

        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Description détaillée (optionnelle)"
                rows={3}
              />
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

            <div className="space-y-2">
              <Label htmlFor="tva_recuperable">TVA récupérable (MAD)</Label>
              <Input
                id="tva_recuperable"
                type="number"
                step="0.01"
                {...register("tva_recuperable")}
              />
              {errors.tva_recuperable && <p className="text-xs text-red-500">{errors.tva_recuperable.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taux_amortissement">Taux d'amortissement (%)</Label>
              <Input
                id="taux_amortissement"
                type="number"
                step="0.01"
                {...register("taux_amortissement")}
              />
              {errors.taux_amortissement && <p className="text-xs text-red-500">{errors.taux_amortissement.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode_calcul">Mode de calcul</Label>
              <Select 
                onValueChange={(val) => setValue("mode_calcul", val as ModeCalcul)}
                defaultValue={immobilisation?.mode_calcul || ModeCalcul.LINEAIRE}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ModeCalcul.LINEAIRE}>Linéaire</SelectItem>
                  <SelectItem value={ModeCalcul.DEGRESSIF}>Dégressif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_serie">Numéro de série</Label>
              <Input id="numero_serie" {...register("numero_serie")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etat_physique">État physique</Label>
              <Input id="etat_physique" {...register("etat_physique")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix_cession">Prix de cession (MAD)</Label>
              <Input 
                id="prix_cession" 
                type="number" 
                step="0.01" 
                {...register("prix_cession")} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amortissement_anterieur">Amortissement antérieur (MAD)</Label>
              <Input 
                id="amortissement_anterieur" 
                type="number" 
                step="0.01" 
                {...register("amortissement_anterieur")} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-brand-green hover:bg-brand-green-hover text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
