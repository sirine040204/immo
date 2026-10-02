import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../api/auth";
import { Button } from "@/shared/components/ui/button";
import { User, Mail, Phone, Building, ShieldCheck, Edit2, CheckCircle, ImageIcon } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface UserProfileDisplayProps {
  onEditClick: () => void;
  onChangePasswordClick: () => void;
}

export function UserProfileDisplay({ onEditClick, onChangePasswordClick }: UserProfileDisplayProps) {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
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
        Une erreur est survenue lors de la récupération des données du profil.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Modification Banner */}
      <div className="bg-brand-green-light/50 rounded-lg p-6 border border-brand-green/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-brand-green font-semibold text-lg">Informations du Profil</h3>
          <p className="text-brand-green/80 text-sm mt-1">
            Consultez ou mettez à jour vos informations personnelles.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={onChangePasswordClick} 
            className="w-full sm:w-auto border-brand-green/20 text-brand-green hover:bg-brand-green-light"
          >
            Changer le mot de passe
          </Button>
          <Button 
            onClick={onEditClick} 
            className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-hover text-white gap-2 shadow-sm"
          >
            <Edit2 className="h-4 w-4" />
            Modifier les informations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations Personnelles */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-brand-green" />
                <h2 className="font-semibold text-slate-800">Informations Personnelles</h2>
              </div>
              {profile.photo ? (
                <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                  <img src={profile.photo} alt="Photo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Nom</p>
                <p className="font-medium text-slate-900">{profile.nom}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Prénom</p>
                <p className="font-medium text-slate-900">{profile.prenom}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {profile.email}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Téléphone</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {profile.telephone || "Non spécifié"}
                </div>
              </div>
            </div>
          </div>

          {/* Rôle et Entreprise */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
              <Building className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-slate-800">Entreprise et Rôle</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Entreprise</p>
                <p className="text-slate-900 font-medium">{profile.entreprise_nom || "Non spécifiée"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Rôle</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  {profile.is_company_admin ? "Administrateur" : (profile.role_nom || "Employé")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Status) */}
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
              {profile.is_company_admin && (
                 <div className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-green bg-brand-green-light px-3 py-2 rounded-md border border-brand-green/15">
                    <ShieldCheck className="h-4 w-4" />
                    Compte Administrateur
                 </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
