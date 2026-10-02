import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Eye, Building, Link2, Clock, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Document, DocumentStatut } from "../types/document";
import { FilePreviewDialog } from "./FilePreviewDialog";

interface DocumentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export function DocumentDetailsDialog({
  isOpen,
  onClose,
  document,
}: DocumentDetailsDialogProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!document) return null;

  const handleDownload = () => {
    if (document.fichier) {
      // Assuming document.fichier contains the relative URL like "/media/documents/..." 
      // If it's a full URL, we can just open it.
      let url = document.fichier;
      if (!url.startsWith('http')) {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
      }
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Détails du Document
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">{document.nom}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-xs">
                  {document.type_document_nom || "Type de document"}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    document.statut === DocumentStatut.ACTIF
                      ? "bg-brand-green-light text-brand-green border-brand-green/20"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }
                >
                  {document.statut === DocumentStatut.ACTIF ? "Actif" : "Archivé"}
                </Badge>
              </div>
            </div>
            
            {document.fichier && (
              <Button onClick={handleDownload} variant="outline" className="text-brand-green border-brand-green/20 hover:bg-brand-green-light">
                <Eye className="w-4 h-4 mr-2" />
                Aperçu du fichier
              </Button>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
            <p className="text-sm text-slate-900 bg-slate-50 rounded-lg p-3 border border-slate-100 min-h-[60px]">
              {document.description || <span className="text-slate-400 italic">Aucune description fournie</span>}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Liaison
              </h4>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {document.immobilisation_code ? (
                  `Immobilisation: ${document.immobilisation_code}`
                ) : (
                  "Document général de l'entreprise"
                )}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Dates
              </h4>
              <div className="text-sm text-slate-900 mt-1 space-y-1">
                {document.date_debut_validite && (
                  <div><span className="text-slate-500">Début validité :</span> {format(new Date(document.date_debut_validite), "dd MMM yyyy", { locale: fr })}</div>
                )}
                {document.date_fin_validite && (
                  <div><span className="text-slate-500">Fin validité :</span> {format(new Date(document.date_fin_validite), "dd MMM yyyy", { locale: fr })}</div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-1">Créé par</h4>
              <p className="text-sm font-medium text-slate-900">
                {document.ajoute_par_nom || "Système"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {format(new Date(document.date_ajout), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
      <FilePreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        fileUrl={previewUrl} 
        fileName={document.nom} 
      />
    </Dialog>
  );
}
