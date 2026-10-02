"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchAttribut, fetchOptions } from "@/features/immobilisations/api/attributs";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { TypeDonnee } from "@/features/immobilisations/types/attribut";
import { ArrowLeft, Settings2, Info, CheckCircle2, List, Settings, LayoutList } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const getTypeLabel = (type: TypeDonnee) => {
  const map: Record<string, string> = {
    TEXTE: "Texte",
    NOMBRE: "Nombre Entier",
    DECIMAL: "Nombre Décimal",
    DATE: "Date",
    BOOLEEN: "Booléen (Oui/Non)",
    LISTE: "Liste de Choix",
  };
  return map[type] || type;
};

export default function AttributDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const attributId = parseInt(unwrappedParams.id, 10);

  const { data: attribut, isLoading: isAttributLoading, isError: isAttributError } = useQuery({
    queryKey: ["attribut", attributId],
    queryFn: () => fetchAttribut(attributId),
  });

  const { data: familles, isLoading: isFamillesLoading } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const { data: options, isLoading: isOptionsLoading } = useQuery({
    queryKey: ["attribut-options", attributId],
    queryFn: () => fetchOptions(attributId),
    enabled: !!attribut && attribut.type_donnee === TypeDonnee.LISTE,
  });

  const isLoading = isAttributLoading || isFamillesLoading;

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des détails de l'attribut...</div>;
  }

  if (isAttributError || !attribut) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/immobilisations/familles/attribut-dynamique")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux attributs
        </Button>
        <div className="p-6 flex flex-col items-center gap-4">
          <ErrorMessage
            title="Attribut non trouvé"
            message="L'attribut demandé n'existe pas ou vous n'y avez pas accès."
          />
        </div>
      </div>
    );
  }

  const famille = familles?.find((f) => f.id_famille === attribut.famille);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/immobilisations/familles/attribut-dynamique")} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              {attribut.libelle}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Détails et configuration de l'attribut dynamique
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={attribut.statut === "ACTIVE" ? "default" : "secondary"} className={attribut.statut === "ACTIVE" ? "bg-brand-green-light text-brand-green hover:bg-brand-green-light" : ""}>
            {attribut.statut === "ACTIVE" ? "Actif" : "Archivé"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-green" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-y-4">
              <div className="text-sm text-slate-500">Famille associée</div>
              <div className="text-sm font-medium">{famille?.nom || "Inconnue"}</div>

              <div className="text-sm text-slate-500">Code</div>
              <div className="text-sm font-medium font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded w-fit">{attribut.code}</div>

              <div className="text-sm text-slate-500">Type de donnée</div>
              <div className="text-sm font-medium">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {getTypeLabel(attribut.type_donnee)}
                </Badge>
              </div>

              <div className="text-sm text-slate-500">Ordre d'affichage</div>
              <div className="text-sm font-medium">{attribut.ordre_affichage}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-brand-green" />
              Configuration et Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-y-4">
              <div className="text-sm text-slate-500">Obligatoire</div>
              <div className="text-sm font-medium">
                {attribut.obligatoire ? (
                  <span className="flex items-center text-amber-700">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-amber-600" /> Oui
                  </span>
                ) : "Non"}
              </div>

              <div className="text-sm text-slate-500">Valeur par défaut</div>
              <div className="text-sm font-medium">{attribut.valeur_defaut || "-"}</div>

              <div className="text-sm text-slate-500">Texte d'aide (Placeholder)</div>
              <div className="text-sm font-medium">{attribut.placeholder || "-"}</div>

              {attribut.type_donnee === TypeDonnee.TEXTE && (
                <>
                  <div className="text-sm text-slate-500">Longueur minimum</div>
                  <div className="text-sm font-medium">{attribut.longueur_min !== null ? attribut.longueur_min : "-"}</div>
                  <div className="text-sm text-slate-500">Longueur maximum</div>
                  <div className="text-sm font-medium">{attribut.longueur_max !== null ? attribut.longueur_max : "-"}</div>
                </>
              )}

              {(attribut.type_donnee === TypeDonnee.NOMBRE || attribut.type_donnee === TypeDonnee.DECIMAL) && (
                <>
                  <div className="text-sm text-slate-500">Valeur minimum</div>
                  <div className="text-sm font-medium">{attribut.valeur_min !== null ? attribut.valeur_min : "-"}</div>
                  <div className="text-sm text-slate-500">Valeur maximum</div>
                  <div className="text-sm font-medium">{attribut.valeur_max !== null ? attribut.valeur_max : "-"}</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {attribut.type_donnee === TypeDonnee.LISTE && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="w-5 h-5 text-brand-green" />
              Options de la Liste
            </CardTitle>
            <CardDescription>
              Valeurs possibles pour cet attribut de type Liste.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isOptionsLoading ? (
              <div className="p-6 text-center text-slate-500 animate-pulse">Chargement des options...</div>
            ) : options && options.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-16 text-center">Ordre</TableHead>
                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Libellé</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-32">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).map((opt) => (
                    <TableRow key={opt.id}>
                      <TableCell className="text-center font-medium text-slate-500">{opt.ordre}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit inline-block mt-3 mb-2">{opt.code}</TableCell>
                      <TableCell className="font-medium text-slate-900">{opt.libelle}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={opt.statut === "ACTIVE" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {opt.statut === "ACTIVE" ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Aucune option n'est configurée pour cette liste.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
