"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getEmployees, deactivateEmployee, reactivateEmployee, getRoles, cancelEmployeeInvitation } from "@/features/accounts/api/employees";
import { Employee } from "@/features/accounts/types/employee";
import { Users, Search, ChevronLeft, ChevronRight, MoreHorizontal, UserPlus, Eye, Edit2, UserMinus, UserCheck, Loader2, Trash2, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { EmployeeInviteDialog } from "@/features/accounts/components/EmployeeInviteDialog";
import { AssignRoleToUserDialog } from "@/features/accounts/components/AssignRoleToUserDialog";
import { toast } from "sonner";
import { differenceInDays, isPast } from "date-fns";

export default function UtilisateursPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EN_ATTENTE">("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: employees, isLoading, isError } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string | number) => deactivateEmployee(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", String(id)] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string | number) => reactivateEmployee(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", String(id)] });
      toast.success("Employé réactivé avec succès.");
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: (id: string | number) => cancelEmployeeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("L'invitation a été annulée et l'email a été envoyé.");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation de l'invitation.");
    }
  });

  const getExpirationText = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    if (isPast(date)) {
      return <span className="text-red-500 font-medium">Expiré</span>;
    }
    const days = differenceInDays(date, new Date());
    if (days === 0) return <span className="text-orange-500">Expire aujourd'hui</span>;
    return <span className="text-slate-500">Expire dans {days} jour(s)</span>;
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((emp: Employee) => {
      const searchStr = `${emp.nom} ${emp.prenom} ${emp.email} ${emp.role_nom}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || emp.statut === statusFilter;
      const matchesRole = roleFilter === "ALL" || emp.role_nom === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [employees, searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  
  const currentEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  const handleRowClick = (id: number) => {
    router.push(`/utilisateurs/utilisateurs/${id}`);
  };

  const handleAssignRoleClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsAssignRoleOpen(true);
  };

  if (isError) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          Une erreur est survenue lors de la récupération des utilisateurs.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les employés et leurs accès à la plateforme.</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="bg-brand-green hover:bg-brand-green-hover text-white gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          Inviter un employé
        </Button>
      </div>

      <EmployeeInviteDialog 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        roles={roles} 
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input 
                placeholder="Rechercher un utilisateur..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white">
                <SelectValue placeholder="Statut">
                  {statusFilter === "ALL" 
                    ? "Tous les statuts" 
                    : statusFilter === "ACTIVE" 
                      ? "Actifs" 
                      : statusFilter === "INACTIVE" 
                        ? "Inactifs" 
                        : "En attente"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="INACTIVE">Inactifs</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(val: any) => { setRoleFilter(val || "ALL"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Rôle">
                  {roleFilter === "ALL" ? "Tous les rôles" : roleFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                {roles.map((r: any) => (
                  <SelectItem key={r.id} value={r.nom}>{r.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Total : {filteredEmployees.length} utilisateur{filteredEmployees.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Téléphone</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Ajouté le</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
                    </div>
                  </td>
                </tr>
              ) : currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p>Aucun utilisateur trouvé.</p>
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp: Employee) => (
                  <tr 
                    key={emp.id_utilisateur} 
                    onClick={() => handleRowClick(emp.id_utilisateur)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center font-semibold text-sm">
                          {emp.prenom.charAt(0)}{emp.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-brand-green transition-colors">
                            {emp.prenom} {emp.nom}
                          </p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.role_nom || "Non défini"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {emp.telephone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.statut} />
                      {emp.statut === "EN_ATTENTE" && emp.invitation_expires_at && (
                        <div className="text-[11px] mt-1">
                          {getExpirationText(emp.invitation_expires_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(emp.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                          title="Voir le profil"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/utilisateurs/utilisateurs/${emp.id_utilisateur}?edit=true`);
                          }}
                          disabled={emp.statut === "DESACTIVE"}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignRoleClick(emp);
                          }}
                          disabled={emp.statut === "DESACTIVE"}
                          className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                          title="Assigner un rôle"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        {emp.statut === "ACTIVE" ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deactivateMutation.mutate(emp.id_utilisateur);
                            }}
                            disabled={deactivateMutation.isPending || reactivateMutation.isPending}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Désactiver"
                          >
                            {deactivateMutation.isPending && deactivateMutation.variables === emp.id_utilisateur ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                          </Button>
                        ) : emp.statut === "DESACTIVE" ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              reactivateMutation.mutate(emp.id_utilisateur);
                            }}
                            disabled={deactivateMutation.isPending || reactivateMutation.isPending}
                            className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                            title="Réactiver"
                          >
                            {reactivateMutation.isPending && reactivateMutation.variables === emp.id_utilisateur ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        ) : null}
                        {emp.statut === "EN_ATTENTE" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Voulez-vous vraiment annuler cette invitation ?")) {
                                cancelInvitationMutation.mutate(emp.id_utilisateur);
                              }
                            }}
                            disabled={cancelInvitationMutation.isPending}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Annuler l'invitation"
                          >
                            {cancelInvitationMutation.isPending && cancelInvitationMutation.variables === emp.id_utilisateur ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Footer */}
        {filteredEmployees.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-fit border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-0">
                  <SelectValue placeholder={`${itemsPerPage} per page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <AssignRoleToUserDialog
        isOpen={isAssignRoleOpen}
        onClose={() => setIsAssignRoleOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
