import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInterventionStatut, updateIntervention } from "../api/interventions";
import { Intervention, StatutIntervention } from "../types/intervention";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface InterventionStatutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: Intervention | null;
  targetStatut: StatutIntervention | null;
}

export function InterventionStatutDialog({ isOpen, onClose, intervention, targetStatut }: InterventionStatutDialogProps) {
  const queryClient = useQueryClient();
  const [datePrevue, setDatePrevue] = useState<string>("");

  const isPlanifier = targetStatut === "PLANIFIEE";
  const needsDatePrevue = isPlanifier && (!intervention?.date_prevue);

  const updateStatutMutation = useMutation({
    mutationFn: updateInterventionStatut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      queryClient.invalidateQueries({ queryKey: ["intervention", intervention?.id] });
      toast.success(`Le statut a été mis à jour avec succès.`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.statut?.[0] || error.response?.data?.detail || "Une erreur est survenue lors de la mise à jour du statut.");
    },
  });

  const updateInterventionMutation = useMutation({
    mutationFn: updateIntervention,
    onSuccess: () => {
      // Once date is updated, proceed to update status
      if (intervention && targetStatut) {
        updateStatutMutation.mutate({ id: intervention.id, data: { statut: targetStatut } });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Une erreur est survenue lors de l'enregistrement de la date prévue.");
    },
  });

  const handleConfirm = () => {
    if (!intervention || !targetStatut) return;

    if (needsDatePrevue) {
      if (!datePrevue) {
        toast.error("La date prévue est requise pour planifier l'intervention.");
        return;
      }
      // First update the date, then the mutation onSuccess will trigger the status update
      updateInterventionMutation.mutate({ 
        id: intervention.id, 
        data: { date_prevue: datePrevue } 
      });
    } else {
      updateStatutMutation.mutate({ id: intervention.id, data: { statut: targetStatut } });
    }
  };

  const isPending = updateStatutMutation.isPending || updateInterventionMutation.isPending;
  const today = format(new Date(), 'yyyy-MM-dd');

  if (!intervention || !targetStatut) return null;

  const getActionName = (statut: StatutIntervention) => {
    switch (statut) {
      case "PLANIFIEE": return "Planifier";
      case "EN_COURS": return "Démarrer";
      case "TERMINEE": return "Terminer";
      case "ANNULEE": return "Annuler";
      default: return statut;
    }
  };

  const actionName = getActionName(targetStatut);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="line-clamp-1" title={intervention.intervention_nom || `Intervention #${intervention.id}`}>
            {actionName} : {intervention.intervention_nom || `Intervention #${intervention.id}`}
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir {actionName.toLowerCase()} cette intervention ?
          </DialogDescription>
        </DialogHeader>

        {needsDatePrevue && (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold block mb-1">Date prévue manquante</span>
                Pour passer au statut <strong>Planifiée</strong>, vous devez obligatoirement définir une date prévue.
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Date prévue <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  min={today}
                  className="pl-9"
                  value={datePrevue}
                  onChange={(e) => setDatePrevue(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className={needsDatePrevue ? "mt-2" : "mt-6"}>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Fermer
          </Button>
          <Button 
            className="bg-brand-green hover:bg-brand-green-hover text-white"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
