"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchModeleEntretien } from "@/features/maintenance/api/modelesEntretien";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { fetchTypesEntretien } from "@/features/maintenance/api/typesEntretien";
import { ArrowLeft, Settings, Calendar, Clock, Activity, Settings2, Info } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import { ModeleEntretien, TypePlanification } from "@/features/maintenance/types/modeleEntretien";

export default function ModeleEntretienDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modeleId = Number(params.id);

  const { data: modele, isLoading: isLoadingModele, isError } = useQuery({
    queryKey: ["modele-entretien", modeleId],
    queryFn: () => fetchModeleEntretien(modeleId),
    enabled: !!modeleId,
  });

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const { data: typesEntretien } = useQuery({
    queryKey: ["types-entretien"],
    queryFn: fetchTypesEntretien,
  });

  if (isLoadingModele) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des informations...</div>;
  }

  if (isError || !modele) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12">
        <ErrorMessage
          title="Erreur de chargement"
          message="Impossible de trouver ce modèle d'entretien."
        />
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => router.push('/entretiens/configuration/modeles')}>
            Retour aux modèles
          </Button>
        </div>
      </div>
    );
  }

  const familleName = familles?.find(f => f.id_famille === modele.famille)?.nom || `Famille #${modele.famille}`;
  const typeName = typesEntretien?.find(t => t.id === modele.type_entretien)?.nom || `Type #${modele.type_entretien}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/entretiens/configuration/modeles')}
          className="text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {modele.nom}
            <Badge variant="outline" className={modele.statut === "ACTIF" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
              {modele.statut === "ACTIF" ? "Actif" : "Archivé"}
            </Badge>
          </h1>
          <p className="text-slate-500 mt-1">Code: {modele.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Famille d'immobilisation</div>
              <div className="text-slate-900">{familleName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Type d'entretien</div>
              <div className="text-slate-900">{typeName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-1">Description</div>
              <div className="text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-100 text-sm">
                {modele.description || <span className="italic text-slate-400">Aucune description</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-green" />
              Configuration de Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-green-light rounded-lg text-brand-green">
                {modele.type_planification === "TEMPS" && <Clock className="w-6 h-6" />}
                {modele.type_planification === "USAGE" && <Activity className="w-6 h-6" />}
                {modele.type_planification === "DATE_FIXE" && <Calendar className="w-6 h-6" />}
                {modele.type_planification === "MANUELLE" && <Settings2 className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Type de Planification</div>
                <div className="text-lg font-semibold text-slate-900">
                  {modele.type_planification === "TEMPS" && "Basée sur le Temps"}
                  {modele.type_planification === "USAGE" && "Basée sur l'Usage"}
                  {modele.type_planification === "DATE_FIXE" && "Date Fixe"}
                  {modele.type_planification === "MANUELLE" && "Manuelle (Déclenchement Ad-hoc)"}
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              {modele.type_planification === "TEMPS" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Périodicité</span>
                    <span className="font-medium">{modele.periodicite}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Unité de temps</span>
                    <span className="font-medium capitalize">{modele.unite_periodicite?.toLowerCase()}</span>
                  </div>
                  <div className="mt-4 text-sm text-brand-green bg-brand-green-light p-3 rounded text-center border border-brand-green/15">
                    Cet entretien doit être réalisé tous les {modele.periodicite} {modele.unite_periodicite?.toLowerCase()}
                  </div>
                </>
              )}

              {modele.type_planification === "USAGE" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Seuil d'usage</span>
                    <span className="font-medium">{modele.seuil_usage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Unité d'usage</span>
                    <span className="font-medium">{modele.unite_usage}</span>
                  </div>
                  <div className="mt-4 text-sm text-brand-green bg-brand-green-light p-3 rounded text-center border border-brand-green/15">
                    Cet entretien doit être réalisé tous les {modele.seuil_usage} {modele.unite_usage?.toLowerCase()}
                  </div>
                </>
              )}

              {modele.type_planification === "DATE_FIXE" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Date fixée</span>
                    <span className="font-medium">{new Date(modele.date_fixe!).toLocaleDateString()}</span>
                  </div>
                </>
              )}

              {modele.type_planification === "MANUELLE" && (
                <div className="text-sm text-slate-500 text-center py-2">
                  L'intervention basée sur ce modèle ne sera déclenchée que manuellement. Aucun paramètre supplémentaire.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
