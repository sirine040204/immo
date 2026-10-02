"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPermissionRequests, processPermissionRequest, deletePermissionRequest, fetchPermissions } from "@/features/accounts/api/permissions";
import { getEmployees } from "@/features/accounts/api/employees";
import { PermissionRequest, Permission } from "@/features/accounts/types/permissions";
import { Employee } from "@/features/accounts/types/employee";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";
import { Check, X, Shield, Clock, ShieldCheck, XCircle, Search, Loader2, ChevronLeft, ChevronRight, Trash2, Undo2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

export default function PermissionRequestsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tous les statuts");
  const [userFilter, setUserFilter] = useState<string>("Tous les utilisateurs");
  const [permissionFilter, setPermissionFilter] = useState<string>("Toutes les permissions");
  const [dateFilter, setDateFilter] = useState<string>("Toutes les dates");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    type: "ACCEPT" | "REJECT" | "REVOKE" | "DELETE" | null;
    request: PermissionRequest | null;
  }>({ isOpen: false, type: null, request: null });
  const [rejectMotif, setRejectMotif] = useState("");

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery<PermissionRequest[]>({
    queryKey: ["permissionRequests"],
    queryFn: fetchPermissionRequests,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
  });

  const processMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { action: "ACCEPT" | "REJECT" | "REVOKE"; motif_rejet?: string } }) =>
      processPermissionRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissionRequests"] });
      toast.success("Demande traitée avec succès");
      setActionDialog({ isOpen: false, type: null, request: null });
      setRejectMotif("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erreur lors du traitement de la demande");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePermissionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissionRequests"] });
      toast.success("Demande supprimée avec succès");
      setActionDialog({ isOpen: false, type: null, request: null });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erreur lors de la suppression de la demande");
    }
  });

  const userOptions = useMemo(() => {
    return [
      { value: "Tous les utilisateurs", label: "Tous les utilisateurs" },
      ...employees.map((emp) => ({
        value: emp.email,
        label: `${emp.prenom} ${emp.nom}`
      }))
    ];
  }, [employees]);

  const permissionOptions = useMemo(() => {
    return [
      { value: "Toutes les permissions", label: "Toutes les permissions" },
      ...allPermissions.map((perm) => ({
        value: perm.code,
        label: perm.nom
      }))
    ];
  }, [allPermissions]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const searchStr = `${req.user_nom} ${req.user_prenom} ${req.user_email} ${req.permission_code} ${req.permission_nom}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "Tous les statuts" || req.statut === statusFilter;
      const matchesUser = userFilter === "Tous les utilisateurs" || req.user_email === userFilter;
      const matchesPerm = permissionFilter === "Toutes les permissions" || req.permission_code === permissionFilter;

      let matchesDate = true;
      if (dateFilter !== "Toutes les dates") {
        const date = new Date(req.date_demande);
        const now = new Date();
        if (dateFilter === "7DAYS") {
          matchesDate = (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
        } else if (dateFilter === "30DAYS") {
          matchesDate = (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30;
        } else if (dateFilter === "THIS_MONTH") {
          matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesUser && matchesPerm && matchesDate;
    });
  }, [requests, searchTerm, statusFilter, userFilter, permissionFilter, dateFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const currentRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-brand-green/20 text-brand-green hover:bg-brand-green/20 border-brand-green/30"><ShieldCheck className="w-3 h-3 mr-1" /> Acceptée</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejetée</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const handleProcess = (req: PermissionRequest, action: "ACCEPT" | "REJECT" | "REVOKE" | "DELETE") => {
    setRejectMotif("");
    setActionDialog({ isOpen: true, type: action, request: req });
  };

  const confirmProcess = () => {
    if (!actionDialog.request || !actionDialog.type) return;

    if (actionDialog.type === "DELETE") {
      deleteMutation.mutate(actionDialog.request.id);
    } else {
      processMutation.mutate({
        id: actionDialog.request.id,
        data: {
          action: actionDialog.type,
          motif_rejet: (actionDialog.type === "REJECT" || actionDialog.type === "REVOKE") ? rejectMotif : undefined,
        },
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-green" />
            Demandes de Permissions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez les demandes de permissions spécifiques soumises par les employés de l'entreprise.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
          <div className="flex flex-col xl:flex-row items-center gap-3 w-full">
            <div className="relative w-full xl:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Rechercher..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              <Select value={statusFilter} onValueChange={(val: string | null) => { if (val) { setStatusFilter(val); setCurrentPage(1); } }}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="ACCEPTED">Acceptées</SelectItem>
                  <SelectItem value="REJECTED">Rejetées</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(val: string | null) => { if (val) { setDateFilter(val); setCurrentPage(1); } }}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toutes les dates">Toutes les dates</SelectItem>
                  <SelectItem value="7DAYS">7 derniers jours</SelectItem>
                  <SelectItem value="30DAYS">30 derniers jours</SelectItem>
                  <SelectItem value="THIS_MONTH">Ce mois-ci</SelectItem>
                </SelectContent>
              </Select>

              <SearchableSelect
                options={userOptions}
                value={userFilter}
                onValueChange={(val) => { setUserFilter(val); setCurrentPage(1); }}
                placeholder="Utilisateurs"
                className="w-full bg-white"
              />

              <SearchableSelect
                options={permissionOptions}
                value={permissionFilter}
                onValueChange={(val) => { setPermissionFilter(val); setCurrentPage(1); }}
                placeholder="Permissions"
                className="w-full bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 text-slate-600">
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Permission Demandée</TableHead>
                <TableHead>Date de Demande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isRequestsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : currentRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    Aucune demande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                currentRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-medium text-slate-900">{req.user_prenom} {req.user_nom}</div>
                      <div className="text-xs text-slate-500">{req.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{req.permission_nom}</div>
                      <div className="text-xs font-mono text-slate-500">{req.permission_code}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(req.date_demande), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(req.statut)}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.statut === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-slate-500 hover:text-brand-green hover:bg-brand-green-light hover:border-brand-green/30"
                            onClick={() => handleProcess(req, "ACCEPT")}
                          >
                            <Check className="h-4 w-4 mr-1" /> Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            onClick={() => handleProcess(req, "REJECT")}
                          >
                            <X className="h-4 w-4 mr-1" /> Rejeter
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-xs text-slate-400 mr-2">
                            Traitée le {req.date_traitement ? format(new Date(req.date_traitement), "dd/MM/yyyy") : "N/A"}
                          </span>
                          {req.statut === "ACCEPTED" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                              onClick={() => handleProcess(req, "REVOKE")}
                              title="Révoquer"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            onClick={() => handleProcess(req, "DELETE")}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Compact Pagination Footer */}
        {filteredRequests.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val: string | null) => {
                  if (val) {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-fit border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-0">
                  <SelectValue placeholder={`${itemsPerPage} par page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 par page</SelectItem>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="25">25 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} sur {filteredRequests.length}
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

      <Dialog open={actionDialog.isOpen} onOpenChange={(open: boolean) => !open && setActionDialog({ isOpen: false, type: null, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "ACCEPT" && "Accepter la demande"}
              {actionDialog.type === "REJECT" && "Rejeter la demande"}
              {actionDialog.type === "REVOKE" && "Révoquer la permission"}
              {actionDialog.type === "DELETE" && "Supprimer la demande"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "ACCEPT" && `Êtes-vous sûr de vouloir accorder la permission "${actionDialog.request?.permission_nom}" à ${actionDialog.request?.user_prenom} ${actionDialog.request?.user_nom} ?`}
              {actionDialog.type === "REJECT" && `Veuillez spécifier un motif pour le rejet de la demande de ${actionDialog.request?.user_prenom}.`}
              {actionDialog.type === "REVOKE" && `Êtes-vous sûr de vouloir révoquer cette permission ? Elle sera retirée de l'utilisateur ${actionDialog.request?.user_prenom}.`}
              {actionDialog.type === "DELETE" && `Êtes-vous sûr de vouloir supprimer définitivement cette demande de l'historique ?`}
            </DialogDescription>
          </DialogHeader>

          {(actionDialog.type === "REJECT" || actionDialog.type === "REVOKE") && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Motif (obligatoire)</Label>
                <Input
                  value={rejectMotif}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectMotif(e.target.value)}
                  placeholder="Ex: Raison de cette action..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ isOpen: false, type: null, request: null })}>
              Annuler
            </Button>
            <Button
              variant={actionDialog.type === "ACCEPT" ? "default" : "destructive"}
              className={actionDialog.type === "ACCEPT" ? "bg-brand-green hover:bg-brand-green-hover text-white" : ""}
              onClick={confirmProcess}
              disabled={processMutation.isPending || deleteMutation.isPending || ((actionDialog.type === "REJECT" || actionDialog.type === "REVOKE") && !rejectMotif.trim())}
            >
              {(processMutation.isPending || deleteMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
