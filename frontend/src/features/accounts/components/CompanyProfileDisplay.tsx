import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompanyProfile } from "../api/companies";
import { Button } from "@/shared/components/ui/button";
import { Building, Mail, Phone, MapPin, Globe, AlignLeft, Calendar, FileText, CheckCircle, Edit2, FileCheck, ImageIcon } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface CompanyProfileDisplayProps {
  onEditClick: () => void;
}

export function CompanyProfileDisplay({ onEditClick }: CompanyProfileDisplayProps) {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["companyProfile"],
    queryFn: getCompanyProfile,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-100">
        Une erreur est survenue lors de la récupération des données de l'entreprise.
      </div>
    );
  }

  // Format date
  const dateCreation = new Date(profile.date_creation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Modification Banner */}
      <div className="bg-brand-green-light/50 rounded-lg p-6 border border-brand-green/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-brand-green font-semibold text-lg">Informations de l'entreprise</h3>
          <p className="text-brand-green/80 text-sm mt-1">
            Consultez les informations de votre entreprise ou mettez à jour votre profil.
          </p>
        </div>
        <Button onClick={onEditClick} className="bg-brand-green hover:bg-brand-green-hover text-white gap-2 shrink-0 shadow-sm">
          <Edit2 className="h-4 w-4" />
          Modifier les informations
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations Générales */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-brand-green" />
                <h2 className="font-semibold text-slate-800">Informations Générales</h2>
              </div>
              {profile.logo ? (
                <div className="h-10 w-10 rounded-md border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-md border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400" title="Aucun logo">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Nom de l'entreprise</p>
                <p className="font-medium text-slate-900">{profile.nom_entreprise}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Numéro Fiscal (Matricule)</p>
                <p className="font-medium text-slate-900">{profile.numero_fiscal}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Forme Juridique</p>
                <p className="text-slate-900">{profile.forme_juridique || "Non spécifiée"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Secteur d'activité</p>
                <p className="text-slate-900">{profile.secteur_activite || "Non spécifié"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
                <p className="text-slate-900 text-sm leading-relaxed">
                  {profile.description || "Aucune description fournie."}
                </p>
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-slate-800">Coordonnées</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-slate-500 mb-1">Adresse complète</p>
                <p className="text-slate-900">{profile.adresse || "Non spécifiée"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {profile.email_notifications || "Non spécifié"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Numéro de téléphone</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {profile.numero_telephone || "Non spécifié"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Site Web</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Globe className="h-4 w-4 text-slate-400" />
                  {profile.site_web ? (
                    <a href={profile.site_web} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
                      {profile.site_web}
                    </a>
                  ) : (
                    "Non spécifié"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Status & Config) */}
        <div className="space-y-6">

          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-slate-800">Statut du Compte</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Statut Actuel</p>
                <StatusBadge status={profile.statut} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Inscrit le</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {dateCreation}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-slate-800">Documents</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Document justificatif (Kbis, RNE)</p>
                {profile.documents_justificatifs ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-green bg-brand-green-light px-3 py-2 rounded-md border border-brand-green/15">
                    <CheckCircle className="h-4 w-4" />
                    Document fourni
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                    Aucun document fourni
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-slate-800">Configuration</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <p className="text-sm text-slate-500">Devise</p>
                <p className="font-medium text-slate-900">{profile.devise}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <p className="text-sm text-slate-500">Langue</p>
                <p className="font-medium text-slate-900">{profile.langue}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <p className="text-sm text-slate-500">Rappel maintenance</p>
                <p className="font-medium text-slate-900">{profile.delai_rappel_maintenance_defaut} jours</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Rappel document</p>
                <p className="font-medium text-slate-900">{profile.delai_rappel_document_defaut} jours</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
