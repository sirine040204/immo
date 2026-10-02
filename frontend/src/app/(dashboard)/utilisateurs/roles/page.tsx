"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "@/features/accounts/api/roles";
import { Role } from "@/features/accounts/types/employee";
import { Plus, Edit2, Trash2, Archive, Shield, Search, ChevronLeft, ChevronRight, RotateCcw, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { RoleDialog } from "@/features/accounts/components/RoleDialog";
import { RoleArchiveDialog } from "@/features/accounts/components/RoleArchiveDialog";
import { RoleReactivateDialog } from "@/features/accounts/components/RoleReactivateDialog";
import { AssignRoleDialog } from "@/features/accounts/components/AssignRoleDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export default function RolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "ARCHIVE">("ALL");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: roles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles(true),
  });

  const filteredRoles = roles?.filter((role) => {
    const matchesSearch = role.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || role.statut === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const currentRoles = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const activeRolesCount = roles?.filter((role) => role.statut === "ACTIF").length || 0;

  const handleCreateClick = () => {
    setSelectedRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleArchiveClick = (role: Role) => {
    setSelectedRole(role);
    setIsArchiveDialogOpen(true);
  };

  const handleReactivateClick = (role: Role) => {
    setSelectedRole(role);
    setIsReactivateDialogOpen(true);
  };

  const handleAssignClick = (role: Role) => {
    setSelectedRole(role);
    setIsAssignDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rôles</h1>
          <p className="text-slate-500 mt-1">
            Gérez les rôles et permissions des employés de votre entreprise.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Créer un rôle
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-green" />
              Liste des rôles
            </CardTitle>
            <CardDescription>
              {activeRolesCount} rôle(s) actif(s) dans votre entreprise.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs uniquement</SelectItem>
                <SelectItem value="ARCHIVE">Archivés uniquement</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un rôle..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand-green"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des rôles...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les rôles. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredRoles && filteredRoles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Nom du Rôle</TableHead>
                    <TableHead className="font-semibold text-slate-700">Description</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date de Création</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRoles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="font-medium text-slate-900">
                        {role.nom}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">
                        {role.description || <span className="text-slate-400 italic">Aucune description</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={role.statut === "ACTIF" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {role.statut === "ACTIF" ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(role.date_creation)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {role.statut === "ACTIF" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(role); }}
                                title="Modifier ce rôle"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleArchiveClick(role); }}
                                title="Archiver ce rôle"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                onClick={(e) => { e.stopPropagation(); handleAssignClick(role); }}
                                title="Assigner à un utilisateur"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                              onClick={(e) => { e.stopPropagation(); handleReactivateClick(role); }}
                              title="Réactiver ce rôle"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={Shield}
                title="Aucun rôle trouvé"
                description={searchQuery ? "Aucun rôle ne correspond à votre recherche." : "Vous n'avez pas encore créé de rôle. Commencez par en créer un !"}
                actionLabel={searchQuery ? "Effacer la recherche" : "Créer un rôle"}
                onAction={() => searchQuery ? setSearchQuery("") : handleCreateClick()}
              />
            </div>
          )}
        </CardContent>
        {/* Compact Pagination Footer */}
        {filteredRoles && filteredRoles.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500 rounded-b-lg">
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
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length}
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
      </Card>

      <RoleDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        role={selectedRole}
      />

      <RoleArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        role={selectedRole}
      />

      <RoleReactivateDialog
        isOpen={isReactivateDialogOpen}
        onClose={() => setIsReactivateDialogOpen(false)}
        role={selectedRole}
      />

      <AssignRoleDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        role={selectedRole}
      />
    </div>
  );
}
