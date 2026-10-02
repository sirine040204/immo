import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Immobilisation, MotifSortie } from "../types/immobilisation";
import { reformerImmobilisation } from "../api/immobilisations";

const reformerSchema = z.object({
  date_cession: z.string().min(1, "La date de cession est obligatoire").refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }, "La date de cession ne peut pas être dans le futur"),
  prix_cession: z.any(),
  motif_sortie: z.enum([
    MotifSortie.VENTE,
    MotifSortie.MISE_AU_REBUT,
    MotifSortie.DESTRUCTION,
    MotifSortie.DON,
    MotifSortie.REMPLACEMENT,
    MotifSortie.AUTRE
  ], "Le motif de sortie est obligatoire"),
});

type ReformerFormValues = z.infer<typeof reformerSchema>;

interface ReformerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  immobilisation: Immobilisation | null;
}

export const ReformerDialog: React.FC<ReformerDialogProps> = ({ isOpen, onClose, immobilisation }) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReformerFormValues>({
    resolver: zodResolver(reformerSchema),
    defaultValues: {
      date_cession: "",
      prix_cession: null,
      motif_sortie: undefined as any,
    },
  });

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      reset({
        date_cession: "",
        prix_cession: null,
        motif_sortie: undefined as any,
      });
    }
  }, [isOpen, reset]);

  const reformerMutation = useMutation({
    mutationFn: (data: { date_cession: string; prix_cession: number | null; motif_sortie: string }) =>
      reformerImmobilisation({ 
        id: immobilisation!.id_immobilisation, 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immobilisations"] });
      toast.success("Immobilisation réformée avec succès");
      onClose();
    },
    onError: (error: any) => {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        const errorMessages = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) return value.join(', ');
            return String(value);
          })
          .join('\n');
        toast.error(errorMessages || "Erreur lors de la réforme de l'immobilisation");
      } else {
        toast.error("Erreur lors de la réforme de l'immobilisation");
      }
    },
  });

  const onSubmit = (data: ReformerFormValues) => {
    let parsedPrixCession = data.prix_cession;
    if (parsedPrixCession === "" || parsedPrixCession === undefined || parsedPrixCession === null) {
      parsedPrixCession = null;
    } else {
      parsedPrixCession = Number(parsedPrixCession);
    }
    
    reformerMutation.mutate({
      date_cession: data.date_cession,
      prix_cession: parsedPrixCession,
      motif_sortie: data.motif_sortie,
    });
  };

  if (!immobilisation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Réformer l'immobilisation</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de réformer l'immobilisation <strong>{immobilisation.code}</strong>.
            Veuillez fournir les informations de sortie obligatoires.
          </DialogDescription>
        </DialogHeader>

        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="date_cession">Date de cession <span className="text-red-500">*</span></Label>
            <Controller
              name="date_cession"
              control={control}
              render={({ field }) => (
                <Input type="date" {...field} max={new Date().toISOString().split('T')[0]} className={errors.date_cession ? "border-red-500" : ""} />
              )}
            />
            {errors.date_cession && <p className="text-sm text-red-500">{errors.date_cession.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prix_cession">Prix de cession</Label>
            <Controller
              name="prix_cession"
              control={control}
              render={({ field }) => (
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field} 
                  value={field.value ?? ""} 
                  className={errors.prix_cession ? "border-red-500" : ""} 
                />
              )}
            />
            {errors.prix_cession?.message && <p className="text-sm text-red-500">{String(errors.prix_cession.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif_sortie">Motif de sortie <span className="text-red-500">*</span></Label>
            <Controller
              name="motif_sortie"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                >
                  <SelectTrigger className={errors.motif_sortie ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionnez un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MotifSortie).map((motif) => (
                      <SelectItem key={motif} value={motif}>
                        {motif.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.motif_sortie && <p className="text-sm text-red-500 break-words whitespace-normal">{String(errors.motif_sortie.message)}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={reformerMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={reformerMutation.isPending}>
              {reformerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Réformer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
