import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyPermissionRequests } from "../api/permissions";
import { PermissionRequest } from "../types/permissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Shield, Clock, ShieldCheck, XCircle, Search, Loader2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function UserPermissionRequestsList() {
  const { data: requests = [], isLoading } = useQuery<PermissionRequest[]>({
    queryKey: ["myPermissionRequests"],
    queryFn: fetchMyPermissionRequests,
  });

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-green" />
          Mes demandes de permissions
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Suivez l'état de vos demandes de permissions supplémentaires.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 text-slate-600">
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Date de Demande</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Détails / Motif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  Vous n'avez fait aucune demande de permission.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/50">
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
                  <TableCell className="text-slate-500 text-sm">
                    {req.statut === "REJECTED" && req.motif_rejet && (
                      <span className="text-red-600">Motif : {req.motif_rejet}</span>
                    )}
                    {req.statut !== "PENDING" && !req.motif_rejet && (
                      <span className="text-slate-400">
                        Traitée le {req.date_traitement ? format(new Date(req.date_traitement), "dd/MM/yyyy") : "N/A"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
