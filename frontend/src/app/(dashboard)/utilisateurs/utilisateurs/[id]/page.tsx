"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getEmployee, getRoles, deactivateEmployee, reactivateEmployee } from "@/features/accounts/api/employees";
import { EmployeeDetailDisplay } from "@/features/accounts/components/EmployeeDetailDisplay";
import { EmployeeDetailForm } from "@/features/accounts/components/EmployeeDetailForm";
import { EmployeeExtraPermissions } from "@/features/accounts/components/EmployeeExtraPermissions";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function EmployeeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;
  
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");

  const { data: employee, isLoading, isError } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: !!employeeId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-3">
          <p>Employé introuvable ou erreur de chargement.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/utilisateurs/utilisateurs")}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/utilisateurs/utilisateurs")}
          className="text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux utilisateurs
        </Button>
      </div>

      {!isEditing ? (
        <>
          <EmployeeDetailDisplay 
            employee={employee} 
            onEditClick={() => setIsEditing(true)} 
            onDeactivateClick={() => deactivateMutation.mutate()}
            onReactivateClick={() => reactivateMutation.mutate()}
            isMutating={deactivateMutation.isPending || reactivateMutation.isPending}
          />
          <EmployeeExtraPermissions employeeId={employeeId} />
        </>
      ) : (
        <EmployeeDetailForm 
          employee={employee} 
          roles={roles}
          onCancel={() => setIsEditing(false)} 
          onSuccess={() => setIsEditing(false)} 
        />
      )}
    </div>
  );
}
