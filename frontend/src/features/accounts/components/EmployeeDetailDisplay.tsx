import React from "react";
import { Employee } from "../types/employee";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { User, Mail, Phone, Calendar, Clock, ShieldCheck, Edit2, UserMinus, UserCheck, Loader2, Activity } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface EmployeeDetailDisplayProps {
  employee: Employee;
  onEditClick: () => void;
  onDeactivateClick?: () => void;
  onReactivateClick?: () => void;
  isMutating?: boolean;
}

export function EmployeeDetailDisplay({ 
  employee, 
  onEditClick,
  onDeactivateClick,
  onReactivateClick,
  isMutating = false
}: EmployeeDetailDisplayProps) {
  const dateCreation = new Date(employee.date_creation).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  
  const lastLogin = employee.derniere_connexion 
    ? new Date(employee.derniere_connexion).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "Jamais connecté";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center text-2xl font-bold shadow-inner">
              {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{employee.prenom} {employee.nom}</h2>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="h-4 w-4 text-brand-green" />
                <span className="text-sm font-medium text-slate-600">{employee.role_nom || "Aucun rôle"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {employee.statut === "ACTIVE" ? (
              <Button 
                onClick={onDeactivateClick} 
                disabled={isMutating}
                variant="destructive" 
                className="gap-2 shadow-sm w-full sm:w-auto"
              >
                {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Désactiver
              </Button>
            ) : employee.statut === "DESACTIVE" ? (
              <Button 
                onClick={onReactivateClick} 
                disabled={isMutating}
                variant="outline" 
                className="gap-2 shadow-sm text-brand-green border-brand-green/20 hover:bg-brand-green-light w-full sm:w-auto"
              >
                {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Réactiver
              </Button>
            ) : null}

            <Button onClick={onEditClick} disabled={employee.statut === "DESACTIVE" || isMutating} className="bg-brand-green hover:bg-brand-green-hover text-white gap-2 shadow-sm w-full sm:w-auto">
              <Edit2 className="h-4 w-4" />
              Modifier le profil
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Adresse email</p>
                    <p className="text-sm font-medium">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Numéro de téléphone</p>
                    <p className="text-sm font-medium">{employee.telephone || "Non renseigné"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informations système</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Statut du compte</p>
                    <div className="mt-1">
                      <StatusBadge status={employee.statut} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Date d'ajout</p>
                    <p className="text-sm">{dateCreation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Dernière connexion</p>
                    <p className="text-sm">{lastLogin}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
