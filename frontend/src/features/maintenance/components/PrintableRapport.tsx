import React, { forwardRef } from "react";
import { RapportIntervention } from "@/features/maintenance/types/rapportIntervention";

interface PrintableRapportProps {
  rapport: RapportIntervention;
  details: {
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
  entrepriseNom?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR");
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const getPriorityCachet = (priorite?: string) => {
  if (!priorite) return null;
  const p = priorite.toLowerCase();
  let color = "text-slate-400 border-slate-300";
  
  if (p.includes("urgent") || p.includes("haute") || p.includes("critique")) {
    color = "text-red-600 border-red-500/50 bg-red-50";
  } else if (p.includes("normal") || p.includes("moyenne")) {
    color = "text-emerald-600 border-emerald-500/50 bg-emerald-50";
  } else if (p.includes("faible") || p.includes("basse")) {
    color = "text-slate-500 border-slate-400/50 bg-slate-50";
  }

  return (
    <div className={`ml-4 px-3 py-1 border-2 rounded-md transform -rotate-3 shadow-sm ${color}`}>
      <span className="font-bold text-xs tracking-[0.2em] uppercase">{priorite}</span>
    </div>
  );
};

export const PrintableRapport = forwardRef<HTMLDivElement, PrintableRapportProps>(
  ({ rapport, details, entrepriseNom }, ref) => {
    
    // Generate professional reference format: Réf: RPT-YYYY-00ID
    const year = new Date(rapport.date_rapport || Date.now()).getFullYear();
    const formattedId = String(rapport.id).padStart(4, '0');
    const reference = `Réf: RPT-${year}-${formattedId}`;

    return (
      <div ref={ref} className="bg-white p-10 w-[850px] min-h-[1100px] text-slate-800 font-sans mx-auto flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-[1.5px] border-slate-400 pb-4 mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-[#0f172a] font-serif tracking-tight">Rapport d'Intervention</h1>
              {getPriorityCachet(details.priorite)}
            </div>
            <p className="text-sm font-medium mt-1 text-slate-400 uppercase tracking-wider">{entrepriseNom || "ENTREPRISE"}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#0f172a] text-lg font-serif">{reference}</p>
            <p className="text-sm text-slate-500 mt-1 font-serif">Date: {formatDate(rapport.date_rapport)}</p>
            <p className="text-sm text-slate-500 mt-1 font-serif">Créé par: {rapport.redige_par_nom || "Inconnu"}</p>
          </div>
        </div>

        {/* Top Section (Two Columns) */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          {/* Details */}
          <div className="bg-[#f8fafc] p-5 rounded-md border border-slate-200">
            <h2 className="text-xs font-bold text-[#334155] uppercase tracking-wider mb-5">Détails de l'intervention</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Immobilisation</p>
                <p className="text-sm font-bold text-slate-800">{details.immoName || "N/A"}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Motif</p>
                <p className="text-sm font-bold text-slate-800">{details.motif || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-800">{details.typeName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priorité</p>
                  <p className="text-sm font-bold text-slate-800 uppercase">{details.priorite || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Modèle appliqué</p>
                <p className="text-sm font-bold text-slate-800">{details.modeleName || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Traceability & Dates */}
          <div className="bg-[#f8fafc] p-5 rounded-md border border-slate-200">
            <h2 className="text-xs font-bold text-[#334155] uppercase tracking-wider mb-5">Traçabilité & Dates</h2>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date de demande</p>
                <p className="text-sm font-bold text-slate-800">{formatDateTime(details.dateDemande)}</p>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date prévue</p>
                <p className="text-sm font-bold text-slate-800">{formatDate(details.datePrevue)}</p>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date de début</p>
                <p className="text-sm font-bold text-slate-800">{formatDateTime(details.dateDebut)}</p>
              </div>
              <div className="flex justify-between items-center pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date de fin</p>
                <p className="text-sm font-bold text-slate-800">{formatDateTime(details.dateFin)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 flex-1">
          {/* Observations */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-[#0f172a] rounded-full"></div>
              <h2 className="text-lg font-bold text-[#0f172a] font-serif">Observations Initiales</h2>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-md border border-slate-100 min-h-[60px]">
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                {rapport.observations || "Aucune observation."}
              </p>
            </div>
          </div>

          {/* Travaux */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-[#0f172a] rounded-full"></div>
              <h2 className="text-lg font-bold text-[#0f172a] font-serif">Travaux Réalisés</h2>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-md border border-slate-100 min-h-[60px]">
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                {rapport.travaux_realises || "Aucun travail spécifié."}
              </p>
            </div>
          </div>

          {/* Recommandations */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-[#0f172a] rounded-full"></div>
              <h2 className="text-lg font-bold text-[#0f172a] font-serif">Recommandations</h2>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-md border border-slate-100 min-h-[60px]">
              <p className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                {rapport.recommandations || "Aucune recommandation."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center pt-8 pb-4">
          <p className="text-xs text-slate-400 font-serif">
            Document généré électroniquement par le système de gestion de maintenance.
          </p>
        </div>
      </div>
    );
  }
);

PrintableRapport.displayName = "PrintableRapport";
