"use client";

import React, { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchFamille } from "@/features/immobilisations/api/familles";
import { ArrowLeft, Box, CheckCircle2, AlertTriangle, FileText, Settings, Key, Info, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import { LucideIcon } from "lucide-react";
import { Settings2 } from "lucide-react";
import { FamilleAttributsList } from "../../../../../features/immobilisations/components/FamilleAttributsList";
// Helper to dynamically render a photo or a fallback icon
const renderIcon = (iconeUrl?: any) => {
  if (!iconeUrl || typeof iconeUrl !== "string") {
    return <Box className="w-12 h-12 text-slate-400" />;
  }

  // If the backend doesn't return absolute URL, prepend the backend host
  const fullUrl = iconeUrl.startsWith("http") ? iconeUrl : `http://localhost:8000${iconeUrl}`;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-40 h-40 relative rounded-lg overflow-hidden border border-slate-200 mb-3 flex items-center justify-center bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fullUrl}
          alt="Icône"
          className="object-contain w-full h-full p-2"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-slate-400 text-xs text-center p-4">Image non trouvée</div>';
          }}
        />
      </div>
      <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 truncate max-w-full" title={iconeUrl}>
        {iconeUrl.split('/').pop()}
      </span>
    </div>
  );
};

export default function FamilleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [showAttributes, setShowAttributes] = React.useState(false);

  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const familleId = parseInt(unwrappedParams.id, 10);

  const { data: famille, isLoading, isError, refetch } = useQuery({
    queryKey: ["famille", familleId],
    queryFn: () => fetchFamille(familleId),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des détails de la famille...</div>;
  }

  if (isError || !famille) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/immobilisations/familles")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux familles
        </Button>
        <div className="p-6 flex flex-col items-center gap-4">
          <ErrorMessage
            title="Erreur de chargement"
            message="Impossible de charger les détails de cette famille. Elle n'existe peut-être plus."
          />
          <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header section with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/immobilisations/familles")}
            className="rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{famille.nom}</h1>
              <Badge variant="outline" className={famille.statut === "ACTIVE" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                {famille.statut === "ACTIVE" ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Archivée</span>
                )}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Key className="w-3.5 h-3.5" /> Code: <span className="font-medium text-slate-700">{famille.code}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/immobilisations/familles/attribut-dynamique?action=create&familleId=${familleId}`)}
          className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un attribut
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-green" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Nom de la famille</p>
                <p className="text-base text-slate-900 font-medium">{famille.nom}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Code</p>
                <p className="text-base text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded w-fit">{famille.code}</p>
              </div>
            </div>

            <div className="space-y-1 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2 min-h-[100px]">
                {famille.description ? (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{famille.description}</p>
                ) : (
                  <p className="text-slate-400 italic">Aucune description fournie pour cette famille.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Configuration Card */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-green" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                {renderIcon(famille.icone)}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-500">Taux d'amortissement</p>
                  <p className="text-xs text-slate-400 mt-0.5">Appliqué par défaut</p>
                </div>
                <div className="text-xl font-semibold text-brand-green bg-brand-green-light px-3 py-1 rounded-md border border-brand-green/15">
                  {famille.taux_amortissement !== null ? `${famille.taux_amortissement}%` : "N/A"}
                </div>
              </div>



            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center">
        {!showAttributes ? (
          <div className="text-center w-full bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Attributs Dynamiques</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Affichez, modifiez ou configurez les champs personnalisés spécifiques à cette famille d'immobilisation.
            </p>
            <Button 
              onClick={() => setShowAttributes(true)}
              className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm transition-all rounded-md px-6 py-5"
            >
              <Settings2 className="w-5 h-5 mr-2" />
              Afficher les attributs dynamiques
            </Button>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Gestion des attributs</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowAttributes(false)}
                className="text-slate-600 hover:text-slate-900 border-slate-200"
              >
                Masquer
              </Button>
            </div>
            <FamilleAttributsList familleId={familleId} />
          </div>
        )}
      </div>
    </div>
  );
}
