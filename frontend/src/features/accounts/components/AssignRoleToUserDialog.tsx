import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Employee } from "../types/employee";
import { getRoles, updateEmployee } from "../api/employees";

interface AssignRoleToUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function AssignRoleToUserDialog({
  isOpen,
  onClose,
  employee,
}: AssignRoleToUserDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: isOpen,
  });

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = r.nom.toLowerCase().includes(search);
      return matchesSearch && r.statut === "ACTIF";
    });
  }, [roles, searchQuery]);

  const mutation = useMutation({
    mutationFn: (roleId: number) => {
      return updateEmployee({
        id: employee!.id_utilisateur,
        payload: { role: roleId },
      });
    },
    onSuccess: () => {
      toast.success("Rôle assigné avec succès");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", String(employee?.id_utilisateur)] });
      handleClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorData = error.response?.data;
      toast.error(errorData?.detail || "Une erreur est survenue lors de l'assignation du rôle.");
    },
  });

  const handleClose = () => {
    setSelectedRoleId("");
    setSearchQuery("");
    onClose();
  };

  const handleAssign = () => {
    if (!selectedRoleId || !employee) return;
    mutation.mutate(Number(selectedRoleId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assigner un rôle</DialogTitle>
          <DialogDescription>
            Choisissez un rôle à assigner à <span className="font-semibold">{employee?.prenom} {employee?.nom}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rôle</label>
            <Select
              value={selectedRoleId}
              onValueChange={(val) => setSelectedRoleId(val || "")}
            >
              <SelectTrigger className={!selectedRoleId ? "text-slate-500" : ""}>
                <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner un rôle"}>
                  {selectedRoleId && roles.find(r => r.id.toString() === selectedRoleId)
                    ? roles.find(r => r.id.toString() === selectedRoleId)?.nom
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/50">
                  <input
                    type="text"
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    placeholder="Rechercher un rôle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    <div className="flex flex-col">
                      <span>{r.nom}</span>
                      {employee?.role === r.id && (
                        <span className="text-xs text-slate-500">(Rôle actuel)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {filteredRoles.length === 0 && (
                  <div className="p-2 text-sm text-center text-slate-500">Aucun résultat</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedRoleId || mutation.isPending}
            className="bg-brand-green hover:bg-brand-green-hover text-white"
          >
            {mutation.isPending ? "Assignation..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
