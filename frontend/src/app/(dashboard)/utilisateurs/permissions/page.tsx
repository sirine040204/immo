"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchPermissions, 
  fetchRolePermissions, 
  assignPermissionToRole, 
  removePermissionFromRole 
} from "@/features/accounts/api/permissions";
import { fetchRoles } from "@/features/accounts/api/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import { Key, Plus, Shield, ShieldCheck, Trash2, Search, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@/features/accounts/types/employee";

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionToAssign, setSelectedPermissionToAssign] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchPermissionQuery, setSearchPermissionQuery] = useState("");
  const [searchRoleQuery, setSearchRoleQuery] = useState("");

  // 1. Fetch all roles (we only want active ones for assigning permissions)
  const { 
    data: roles, 
    isLoading: isRolesLoading, 
    isError: isRolesError 
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles(false), // don't include archived
  });

  // 2. Fetch all system permissions
  const { data: allPermissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
  });

  // 3. Fetch permissions for the selected role
  const { 
    data: rolePermissions = [], 
    isLoading: isRolePermissionsLoading 
  } = useQuery({
    queryKey: ["role-permissions", selectedRoleId],
    queryFn: () => fetchRolePermissions(selectedRoleId!),
    enabled: !!selectedRoleId,
  });

  // 4. Mutations
  const assignMutation = useMutation({
    mutationFn: assignPermissionToRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", selectedRoleId] });
      toast.success("Permission attribuée avec succès");
      setSelectedPermissionToAssign(""); // reset dropdown
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erreur lors de l'attribution de la permission");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removePermissionFromRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", selectedRoleId] });
      toast.success("Permission retirée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors du retrait de la permission");
    },
  });

  const handleAssign = () => {
    if (!selectedRoleId || !selectedPermissionToAssign) return;
    assignMutation.mutate({ 
      roleId: selectedRoleId, 
      permissionId: parseInt(selectedPermissionToAssign) 
    });
  };

  const handleRemove = (permissionId: number) => {
    if (!selectedRoleId) return;
    removeMutation.mutate({ roleId: selectedRoleId, permissionId });
  };

  // Filter available permissions for the dropdown (hide those already assigned and match search query)
  const availablePermissions = allPermissions.filter((ap) => {
    const isNotAssigned = !rolePermissions.some((rp) => rp.permission === ap.id);
    const matchesSearch = ap.nom.toLowerCase().includes(searchPermissionQuery.toLowerCase()) || 
                          ap.code.toLowerCase().includes(searchPermissionQuery.toLowerCase());
    return isNotAssigned && matchesSearch;
  });

  const selectedRole = roles?.find(r => r.id === selectedRoleId);

  const filteredRoles = roles?.filter((role) => 
    role.nom.toLowerCase().includes(searchRoleQuery.toLowerCase())
  ) || [];

  if (isRolesError) {
    return <ErrorMessage message="Impossible de charger la liste des rôles." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Permissions</h1>
        <p className="text-slate-500 mt-1">
          Gérez les permissions attribuées à chaque rôle de votre entreprise.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Roles List */}
        <div className="w-full lg:w-1/3">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-green" />
                Sélectionnez un rôle
              </CardTitle>
              <CardDescription className="mb-4">
                {filteredRoles.length} rôle(s) actif(s) disponible(s)
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un rôle..."
                  className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand-green w-full"
                  value={searchRoleQuery}
                  onChange={(e) => setSearchRoleQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isRolesLoading ? (
                <div className="p-8 text-center text-slate-500">Chargement des rôles...</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {filteredRoles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${
                        selectedRoleId === role.id ? "bg-brand-green-light/50 border-l-4 border-brand-green/20" : "border-l-4 border-transparent"
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${selectedRoleId === role.id ? "text-brand-green" : "text-slate-900"}`}>
                          {role.nom}
                        </div>
                        {role.description && (
                          <div className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredRoles.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      Aucun rôle actif trouvé.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permissions Management */}
        <div className="w-full lg:w-2/3">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    Permissions du rôle
                  </CardTitle>
                  <CardDescription>
                    {selectedRole ? `Gérez les accès pour "${selectedRole.nom}"` : "Sélectionnez un rôle à gauche"}
                  </CardDescription>
                </div>

                {/* Assignment Controls */}
                {selectedRoleId && (
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <PopoverTrigger
                        className="flex h-10 w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="truncate">
                          {selectedPermissionToAssign
                            ? allPermissions.find((p) => p.id.toString() === selectedPermissionToAssign)?.nom
                            : "Choisir une permission..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0" align="start">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Rechercher..."
                            value={searchPermissionQuery}
                            onChange={(e) => setSearchPermissionQuery(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {availablePermissions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-500">
                              Aucune permission trouvée.
                            </div>
                          ) : (
                            availablePermissions.map((p) => (
                              <button
                                key={p.id}
                                className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 ${
                                  selectedPermissionToAssign === p.id.toString() ? "bg-slate-100 font-medium" : ""
                                }`}
                                onClick={() => {
                                  setSelectedPermissionToAssign(p.id.toString());
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {selectedPermissionToAssign === p.id.toString() && (
                                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <Check className="h-4 w-4 text-brand-green" />
                                  </span>
                                )}
                                <span className="truncate text-left">{p.nom}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button 
                      onClick={handleAssign}
                      disabled={!selectedPermissionToAssign || assignMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {!selectedRoleId ? (
                <div className="py-16">
                  <EmptyState
                    icon={ShieldCheck}
                    title="Aucun rôle sélectionné"
                    description="Veuillez sélectionner un rôle dans le panneau de gauche pour voir et modifier ses permissions."
                  />
                </div>
              ) : isRolePermissionsLoading ? (
                <div className="p-16 text-center text-slate-500">Chargement des permissions...</div>
              ) : rolePermissions.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={Key}
                    title="Aucune permission"
                    description="Ce rôle n'a actuellement aucune permission. Utilisez le menu ci-dessus pour lui en attribuer."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {rolePermissions.map((rp) => (
                    <div key={rp.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                      <div>
                        <div className="font-medium text-slate-900">{rp.permission_nom}</div>
                        <div className="text-sm font-mono text-slate-500 mt-0.5">{rp.permission_code}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(rp.permission)}
                        disabled={removeMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Retirer cette permission"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
