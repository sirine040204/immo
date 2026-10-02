import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEmployeeExtraPermissions, addEmployeeExtraPermission, removeEmployeeExtraPermission } from "../api/employees";
import { fetchPermissions } from "../api/permissions";
import { Permission } from "../types/permissions";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Shield, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { SearchableSelect } from "@/shared/components/ui/searchable-select";

interface Props {
  employeeId: string | number;
}

export function EmployeeExtraPermissions({ employeeId }: Props) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>("");

  const { data: extraPermissions = [], isLoading: isLoadingExtra } = useQuery<any[]>({
    queryKey: ["employeeExtraPermissions", employeeId],
    queryFn: () => fetchEmployeeExtraPermissions(employeeId),
  });

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
  });

  const addMutation = useMutation({
    mutationFn: (permId: number) => addEmployeeExtraPermission(employeeId, permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeExtraPermissions", employeeId] });
      toast.success("Permission ajoutée avec succès");
      setIsDialogOpen(false);
      setSelectedPermission("");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout de la permission");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (permId: number) => removeEmployeeExtraPermission(employeeId, permId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeExtraPermissions", employeeId] });
      toast.success("Permission retirée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la permission");
    },
  });

  const availablePermissions = allPermissions.filter(
    (p) => !extraPermissions.some((ep) => ep.id === p.id)
  );

  const handleAdd = () => {
    if (!selectedPermission) return;
    addMutation.mutate(parseInt(selectedPermission, 10));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-green" />
            Permissions Supplémentaires
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Permissions attribuées individuellement (outre le rôle).
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {isLoadingExtra ? (
        <div className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : extraPermissions.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-slate-200 rounded-lg text-slate-500">
          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p>Aucune permission supplémentaire.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {extraPermissions.map((perm) => (
            <Badge 
              key={perm.id} 
              variant="outline" 
              className="px-3 py-1.5 bg-slate-50 flex items-center gap-2"
            >
              <span>{perm.nom} <span className="text-slate-400 font-mono text-[10px] ml-1">({perm.code})</span></span>
              <button 
                onClick={() => removeMutation.mutate(perm.id)}
                disabled={removeMutation.isPending}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Retirer cette permission"
              >
                {removeMutation.isPending && removeMutation.variables === perm.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une permission supplémentaire</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <SearchableSelect
              value={selectedPermission}
              onValueChange={(val) => setSelectedPermission(val || "")}
              placeholder="Sélectionner une permission..."
              searchPlaceholder="Rechercher..."
              options={availablePermissions.map(p => ({
                value: p.id.toString(),
                label: `${p.nom} (${p.code})`
              }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-brand-green hover:bg-brand-green-hover text-white"
              onClick={handleAdd}
              disabled={!selectedPermission || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
