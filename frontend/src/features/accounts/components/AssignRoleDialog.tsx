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
import { Role } from "../types/employee";
import { getEmployees, updateEmployee } from "../api/employees";

interface AssignRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export function AssignRoleDialog({
  isOpen,
  onClose,
  role,
}: AssignRoleDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: isOpen,
  });

  // Filtrer les employés:
  // - on peut filtrer par nom/prenom/email
  // - optionnel : exclure ceux qui ont déjà ce rôle ou les admins (les admins n'ont pas de rôle modifiable via cette API)
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        emp.nom.toLowerCase().includes(search) ||
        emp.prenom.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search);
      
      return matchesSearch && emp.statut !== "DESACTIVE";
    });
  }, [employees, searchQuery]);

  const mutation = useMutation({
    mutationFn: (employeeId: number) => {
      return updateEmployee({
        id: employeeId,
        payload: { role: role!.id },
      });
    },
    onSuccess: () => {
      toast.success("Rôle assigné avec succès");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] }); // au cas où
      handleClose();
    },
    onError: (error: Error | any) => {
      const errorData = error.response?.data;
      toast.error(errorData?.detail || "Une erreur est survenue lors de l'assignation du rôle.");
    },
  });

  const handleClose = () => {
    setSelectedUserId("");
    setSearchQuery("");
    onClose();
  };

  const handleAssign = () => {
    if (!selectedUserId || !role) return;
    mutation.mutate(Number(selectedUserId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assigner le rôle</DialogTitle>
          <DialogDescription>
            Assignez le rôle <span className="font-semibold">{role?.nom}</span> à un utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Utilisateur</label>
            <Select
              value={selectedUserId}
              onValueChange={(val) => setSelectedUserId(val || "")}
            >
              <SelectTrigger className={!selectedUserId ? "text-slate-500" : ""}>
                <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner un utilisateur"}>
                  {selectedUserId && employees.find(e => e.id_utilisateur.toString() === selectedUserId)
                    ? (() => {
                        const emp = employees.find(e => e.id_utilisateur.toString() === selectedUserId);
                        return `${emp?.prenom} ${emp?.nom} (${emp?.email})`;
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/50">
                  <input
                    type="text"
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring focus:border-input"
                    placeholder="Rechercher (nom, email)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredEmployees.map((emp) => (
                  <SelectItem key={emp.id_utilisateur} value={emp.id_utilisateur.toString()}>
                    <div className="flex flex-col">
                      <span>{emp.prenom} {emp.nom}</span>
                      <span className="text-xs text-slate-500">{emp.email} {emp.role === role?.id && "(A déjà ce rôle)"}</span>
                    </div>
                  </SelectItem>
                ))}
                {filteredEmployees.length === 0 && (
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
            disabled={!selectedUserId || mutation.isPending}
            className="bg-brand-green hover:bg-brand-green-hover text-white"
          >
            {mutation.isPending ? "Assignation..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
