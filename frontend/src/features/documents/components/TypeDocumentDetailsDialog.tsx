import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { TypeDocument } from "../types/type-document";

interface TypeDocumentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  typeDocument: TypeDocument | null;
}

export function TypeDocumentDetailsDialog({
  isOpen,
  onClose,
  typeDocument,
}: TypeDocumentDetailsDialogProps) {
  if (!typeDocument) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Détails du Type de Document
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">{typeDocument.nom}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-xs">
                  {typeDocument.code}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    typeDocument.statut === "ACTIF"
                      ? "bg-brand-green-light text-brand-green border-brand-green/20"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }
                >
                  {typeDocument.statut === "ACTIF" ? "Actif" : "Archivé"}
                </Badge>
                {typeDocument.a_echeance && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Avec échéance
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
            <p className="text-sm text-slate-900 bg-slate-50 rounded-lg p-3 border border-slate-100 min-h-[80px]">
              {typeDocument.description || <span className="text-slate-400 italic">Aucune description fournie</span>}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
