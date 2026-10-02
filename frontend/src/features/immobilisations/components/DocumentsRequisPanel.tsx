import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDocumentsRequis } from "../api/immobilisations";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, XCircle, FileText, Upload } from "lucide-react";
import { DocumentFormDialog } from "@/features/documents/components/DocumentFormDialog";

interface DocumentsRequisPanelProps {
  immobilisationId: number;
}

export function DocumentsRequisPanel({ immobilisationId }: DocumentsRequisPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["documents-requis", immobilisationId],
    queryFn: () => fetchDocumentsRequis(immobilisationId),
    enabled: !!immobilisationId,
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm animate-pulse">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg">Documents Attendus</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-10 bg-slate-200 rounded w-full mb-2"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.documents_requis.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg">Documents Attendus</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-slate-500">Aucun document n'est attendu pour cette famille d'immobilisation.</p>
        </CardContent>
      </Card>
    );
  }

  const handleUploadClick = (typeId: number) => {
    setSelectedTypeId(typeId);
    setIsFormOpen(true);
  };

  const hasMissingObligatoire = data.documents_requis.some((dr: any) => dr.obligatoire && !dr.present);

  return (
    <>
      <Card className={`border-slate-200 shadow-sm ${hasMissingObligatoire ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-brand-green'}`}>
        <CardHeader className={`${hasMissingObligatoire ? 'bg-red-50 border-b border-red-100' : 'bg-brand-green-light border-b border-brand-green/20'}`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg ${hasMissingObligatoire ? 'text-red-800' : 'text-brand-green'}`}>
              Documents Attendus
            </CardTitle>
            <Badge variant="outline" className={hasMissingObligatoire ? "bg-red-100 text-red-700" : "bg-brand-green-light0 text-brand-green-hover"}>
              {data.nombre_documents_presents} / {data.nombre_documents_requis} {hasMissingObligatoire && "manquant(s)"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-slate-100">
            {data.documents_requis.map((req: any) => (
              <div key={req.id_type_document} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  {req.present ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" />
                  ) : req.obligatoire ? (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{req.nom_type_document}</span>
                      {req.obligatoire ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] h-5 px-1.5">Obligatoire</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] h-5 px-1.5">Optionnel</Badge>
                      )}
                    </div>
                    {req.present && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {req.documents.length} document(s) trouvé(s)
                      </p>
                    )}
                  </div>
                </div>

                {!req.present && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleUploadClick(req.id_type_document)}
                    className={req.obligatoire ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" : "border-slate-200 hover:bg-slate-100"}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                )}
                {req.present && req.documents.length > 0 && req.documents[0].fichier && (
                  <a href={req.documents[0].fichier} target="_blank" rel="noreferrer" className="text-sm text-brand-green hover:underline flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Consulter
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <DocumentFormDialog
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTypeId(undefined);
          }}
          initialImmobilisation={immobilisationId}
          initialTypeDocument={selectedTypeId}
        />
      )}
    </>
  );
}
