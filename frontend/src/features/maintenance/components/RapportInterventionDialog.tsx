import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRapportIntervention, updateRapportIntervention, deleteRapportIntervention } from "@/features/maintenance/api/rapportsInterventions";
import { RapportIntervention } from "@/features/maintenance/types/rapportIntervention";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { Save, Trash2, X, Download } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { PrintableRapport } from "./PrintableRapport";

const rapportSchema = z.object({
  observations: z.string().optional(),
  travaux_realises: z.string().min(1, "Les travaux réalisés sont obligatoires."),
  recommandations: z.string().optional(),
});

type RapportFormData = z.infer<typeof rapportSchema>;

interface RapportInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interventionId: number;
  rapport?: RapportIntervention;
  interventionDetails?: {
    immoName: string;
    typeName: string;
    modeleName?: string;
    motif?: string;
    priorite?: string;
    dateDemande?: string;
    datePrevue?: string;
    dateDebut?: string;
    dateFin?: string;
  };
}

export function RapportInterventionDialog({
  isOpen,
  onClose,
  interventionId,
  rapport,
  interventionDetails,
}: RapportInterventionDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!rapport;

  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RapportFormData>({
    resolver: zodResolver(rapportSchema),
    defaultValues: {
      observations: "",
      travaux_realises: "",
      recommandations: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (rapport) {
        reset({
          observations: rapport.observations || "",
          travaux_realises: rapport.travaux_realises || "",
          recommandations: rapport.recommandations || "",
        });
      } else {
        reset({
          observations: "",
          travaux_realises: "",
          recommandations: "",
        });
      }
    }
  }, [isOpen, rapport, reset]);

  const createMutation = useMutation({
    mutationFn: createRapportIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rapports-interventions"] });
      toast.success("Rapport d'intervention créé avec succès");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || error.response?.data?.intervention || "Erreur lors de la création du rapport");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRapportIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rapports-interventions"] });
      toast.success("Rapport d'intervention mis à jour");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la mise à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRapportIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rapports-interventions"] });
      toast.success("Rapport d'intervention supprimé");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de la suppression");
    },
  });

  const onSubmit = (data: RapportFormData) => {
    if (isEditing && rapport) {
      updateMutation.mutate({ id: rapport.id, data });
    } else {
      createMutation.mutate({
        intervention: interventionId,
        ...data,
      });
    }
  };

  const handleDelete = () => {
    if (rapport && window.confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
      deleteMutation.mutate(rapport.id);
    }
  };

  const handlePrint = async () => {
    if (!printableRef.current || !rapport) return;
    setIsGeneratingPdf(true);

    // Temporarily remove cross-origin stylesheets that cause SecurityError
    const problematicLinks: { node: Element; parent: ParentNode | null; nextSibling: ChildNode | null }[] = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const _ = sheet.cssRules;
      } catch (e) {
        if (sheet.ownerNode && sheet.ownerNode instanceof Element) {
          problematicLinks.push({
            node: sheet.ownerNode,
            parent: sheet.ownerNode.parentNode,
            nextSibling: sheet.ownerNode.nextSibling,
          });
          sheet.ownerNode.parentNode?.removeChild(sheet.ownerNode);
        }
      }
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const imgData = await toPng(printableRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save(`Rapport_Intervention_${interventionId}.pdf`);
      toast.success("PDF téléchargé avec succès !");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      setIsGeneratingPdf(false);
      
      // Restore removed stylesheets
      problematicLinks.forEach(({ node, parent, nextSibling }) => {
        if (parent) {
          parent.insertBefore(node, nextSibling);
        }
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || isSubmitting;

  // Can delete if user is company admin
  const canDelete = isEditing && user?.is_company_admin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Rapport d'intervention" : "Créer le rapport d'intervention"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-3 rounded-md text-sm text-slate-600 mb-4 justify-between items-center">
              <div>
                <div><span className="font-semibold text-slate-700">Créé le :</span> {new Date(rapport.date_rapport).toLocaleString()}</div>
                <div><span className="font-semibold text-slate-700">Créé par :</span> {rapport.redige_par_nom || "Inconnu"}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={handlePrint}
                disabled={isGeneratingPdf}
              >
                <Download className="w-4 h-4 mr-2 text-slate-500" />
                {isGeneratingPdf ? "Génération..." : "Télécharger PDF"}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              placeholder="Constatations initiales, état de l'équipement..."
              {...register("observations")}
              className="min-h-[80px]"
            />
            {errors.observations && (
              <p className="text-sm text-red-600">{errors.observations.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="travaux_realises">Travaux réalisés <span className="text-red-500">*</span></Label>
            <Textarea
              id="travaux_realises"
              placeholder="Description détaillée des actions effectuées..."
              {...register("travaux_realises")}
              className="min-h-[120px]"
            />
            {errors.travaux_realises && (
              <p className="text-sm text-red-600">{errors.travaux_realises.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommandations">Recommandations </Label>
            <Textarea
              id="recommandations"
              placeholder="Conseils d'utilisation, prochaines vérifications..."
              {...register("recommandations")}
              className="min-h-[80px]"
            />
            {errors.recommandations && (
              <p className="text-sm text-red-600">{errors.recommandations.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-between items-center sm:justify-between w-full">
            <div>
              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-brand-green hover:bg-brand-green-hover text-white">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Enregistrer" : "Créer le rapport"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Hidden container for PDF Generation */}
      {rapport && interventionDetails && (
        <div className="fixed top-[200vh] left-0 pointer-events-none opacity-0">
          <PrintableRapport
            ref={printableRef}
            rapport={rapport}
            details={interventionDetails}
            entrepriseNom={rapport.entreprise_nom}
          />
        </div>
      )}
    </Dialog>
  );
}
