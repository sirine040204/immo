import { apiClient } from "@/services/api/client";
import { Permission, RolePermission } from "../types/permissions";

export const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get("/api/v1/accounts/permissions/");
  return response.data;
};

export const fetchRolePermissions = async (roleId: number): Promise<RolePermission[]> => {
  const response = await apiClient.get(`/api/v1/accounts/roles/${roleId}/permissions/`);
  return response.data;
};

export const assignPermissionToRole = async ({
  roleId,
  permissionId,
}: {
  roleId: number;
  permissionId: number;
}): Promise<RolePermission> => {
  const response = await apiClient.post(`/api/v1/accounts/roles/${roleId}/permissions/`, {
    permission: permissionId,
  });
  return response.data;
};

export const removePermissionFromRole = async ({
  roleId,
  permissionId,
}: {
  roleId: number;
  permissionId: number;
}): Promise<void> => {
  await apiClient.delete(`/api/v1/accounts/roles/${roleId}/permissions/${permissionId}/`);
};

export const fetchPermissionRequests = async (): Promise<any[]> => {
  const response = await apiClient.get("/api/v1/accounts/permissions/requests/");
  return response.data;
};

export const fetchMyPermissionRequests = async (): Promise<any[]> => {
  const response = await apiClient.get("/api/v1/accounts/permissions/requests/me/");
  return response.data;
};

export const processPermissionRequest = async (id: number, data: { action: "ACCEPT" | "REJECT" | "REVOKE", motif_rejet?: string }): Promise<void> => {
  const response = await apiClient.post(`/api/v1/accounts/permissions/requests/${id}/process/`, data);
  return response.data;
};

export const deletePermissionRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/accounts/permissions/requests/${id}/process/`);
};
