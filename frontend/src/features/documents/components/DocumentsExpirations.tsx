"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDocumentsExpiration } from "@/features/documents/api/documents";
import { AlertTriangle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DocumentExpirationItem } from "@/features/documents/types/document";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function DocumentsExpirations() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["documentsExpiration"],
    queryFn: fetchDocumentsExpiration,
  });

  const renderDocumentRow = (doc: DocumentExpirationItem, isExpired: boolean) => (
    <TableRow 
      key={doc.id} 
      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/documents/documents?highlightId=${doc.id}`)}
    >
      <TableCell className="font-medium text-slate-900">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          {doc.nom}
        </div>
      </TableCell>
      <TableCell className="text-slate-600">
        {doc.date_fin_validite ? format(new Date(doc.date_fin_validite), "dd MMMM yyyy", { locale: fr }) : "N/A"}
      </TableCell>
      <TableCell className="text-right">
        {isExpired ? (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Expiré depuis {-1 * (doc.jours_restants || 0)} jour(s)
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Expire dans {doc.jours_restants} jour(s)
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Une erreur est survenue lors du chargement des alertes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
      {/* Section Expirés */}
      <Card className="border-red-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-red-900 text-lg">Documents Expirés</CardTitle>
                <CardDescription className="text-red-700/70">
                  Action immédiate requise
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-red-600 hover:bg-red-700">
              {data?.nombre_expired || 0} document(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data?.expired && data.expired.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Nom du document</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date d'expiration</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expired.map(doc => renderDocumentRow(doc, true))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Aucun document expiré.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Bientôt Expirés */}
      <Card className="border-orange-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-orange-50/50 border-b border-orange-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-orange-900 text-lg">Expiration Proche</CardTitle>
                <CardDescription className="text-orange-700/70">
                  Expire dans les 30 prochains jours
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {data?.nombre_expires_soon || 0} document(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data?.expires_soon && data.expires_soon.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Nom du document</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date d'expiration</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expires_soon.map(doc => renderDocumentRow(doc, false))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Aucun document n'expire prochainement.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
