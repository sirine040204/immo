import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRelevesUsage, deleteReleveUsage } from "../api/releves";
import { AttributDynamique, OptionAttribut } from "../types/attribut";
import { Immobilisation } from "../types/immobilisation";
import { Famille } from "../types/famille";
import { History, Trash2, Clock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { PrintableHistorique } from "./PrintableHistorique";
import { toPng } from 'html-to-image';
import jsPDF from "jspdf";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FastAverageColor } from "fast-average-color";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface HistoriqueTimelineProps {
  immobilisationId: number;
  attributs: AttributDynamique[] | undefined;
  optionsMap: Record<number, OptionAttribut[]>;
  immobilisation?: Immobilisation;
  famille?: Famille;
}

export function HistoriqueTimeline({ immobilisationId, attributs, optionsMap, immobilisation, famille }: HistoriqueTimelineProps) {
  const queryClient = useQueryClient();
  const entrepriseNom = immobilisation?.entreprise_nom || "Entreprise Inconnue";

  const [releveToDelete, setReleveToDelete] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [themePalette, setThemePalette] = useState<{ primary: string, dark: string, light: string } | null>(null);
  const printableRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (famille?.icone) {
      const url = famille.icone.startsWith('http') ? famille.icone : `http://localhost:8000${famille.icone}`;
      const fac = new FastAverageColor();
      fac.getColorAsync(url, { algorithm: 'dominant', crossOrigin: 'anonymous' })
        .then(color => {
          const [r, g, b] = color.value;
          setThemePalette({
            primary: `rgb(${r}, ${g}, ${b})`,
            dark: `rgb(${Math.max(0, r - 80)}, ${Math.max(0, g - 80)}, ${Math.max(0, b - 80)})`,
            light: `rgba(${r}, ${g}, ${b}, 0.1)`
          });
        })
        .catch(e => console.error("Could not extract color from logo:", e));
    }
  }, [famille?.icone]);

  const handlePrint = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);

    // Temporarily remove cross-origin stylesheets that cause SecurityError
    const problematicLinks: { node: Element; parent: ParentNode | null; nextSibling: ChildNode | null }[] = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        // Accessing cssRules will throw a SecurityError if the stylesheet is cross-origin
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
      // Small timeout to allow React to render any pending state changes and DOM updates
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
      pdf.save(`Historique_${immobilisation?.code || immobilisationId}.pdf`);
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

  const { data: releves, isLoading } = useQuery({
    queryKey: ["releves-usage", immobilisationId],
    queryFn: () => fetchRelevesUsage(immobilisationId),
    enabled: !!immobilisationId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReleveUsage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releves-usage", immobilisationId] });
      toast.success("Enregistrement historique supprimé.");
      setReleveToDelete(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'enregistrement.");
    }
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm mt-8">
        <CardContent className="p-12 text-center text-slate-500 animate-pulse">
          Chargement de l'historique...
        </CardContent>
      </Card>
    );
  }

  if (!releves || releves.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm mt-8">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Historique d'usage
          </CardTitle>
          <CardDescription>
            Trace de l'évolution des attributs dynamiques
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Aucun historique disponible.</p>
          <p className="text-sm text-slate-400 mt-1">Les modifications des attributs dynamiques apparaîtront ici.</p>
        </CardContent>
      </Card>
    );
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Helper to get attribute label
  const getAttributLabel = (attrId: number) => {
    return attributs?.find(a => a.id_attribut === attrId)?.libelle || `Attribut #${attrId}`;
  };

  // Helper to get option label
  const getOptionLabel = (attrId: number, optId: number) => {
    return optionsMap[attrId]?.find(o => o.id === optId)?.libelle || `Option #${optId}`;
  };

  return (
    <>
      <Card id="historique" className="border-slate-200 shadow-sm mt-8 overflow-hidden scroll-mt-24">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Historique d'usage
            </CardTitle>
            <CardDescription className="mt-1">
              Trace de l'évolution des attributs dynamiques
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0"
          >
            {isGeneratingPdf ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                Génération...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </span>
            )}
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="relative border-l border-slate-200 ml-3 md:ml-4 py-2 space-y-8">
            {releves.map((releve, index) => {
              const attrLabel = getAttributLabel(releve.attribut);
              const valueDisplay = releve.option
                ? getOptionLabel(releve.attribut, releve.option)
                : (releve.valeur || "Vide");

              return (
                <div key={releve.id} className="relative pl-6 md:pl-8 group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white shadow-sm" />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">{attrLabel}</span>
                        <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                          Modifié
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-1">
                        Nouvelle valeur : <span className="font-medium text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{valueDisplay}</span>
                      </p>

                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDate(releve.date_releve)}
                      </div>
                    </div>

                    {/* Delete Button - appears on hover on desktop, always visible on mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-start"
                      onClick={() => setReleveToDelete(releve.id)}
                      title="Supprimer cet enregistrement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Delete Confirmation Dialog */}
        <Dialog open={releveToDelete !== null} onOpenChange={() => setReleveToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Supprimer l'historique
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cet enregistrement historique ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex sm:justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReleveToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate(releveToDelete!)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Hidden container for PDF Generation */}
      <div className="fixed top-[200vh] left-0 pointer-events-none opacity-0">
        <PrintableHistorique
          ref={printableRef}
          releves={releves}
          attributs={attributs}
          optionsMap={optionsMap}
          familleNom={famille?.nom || "Famille Inconnue"}
          familleIcone={famille?.icone}
          codeImmobilisation={immobilisation?.code || "N/A"}
          designationImmobilisation={immobilisation?.designation || "N/A"}
          entrepriseNom={entrepriseNom}
          themePalette={themePalette}
        />
      </div>
    </>
  );
}
