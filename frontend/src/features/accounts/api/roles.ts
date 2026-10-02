import { apiClient } from "@/services/api/client";
import { Role } from "../types/employee";

export const fetchRoles = async (includeArchived: boolean = false): Promise<Role[]> => {
  const response = await apiClient.get(`/api/v1/accounts/roles/?include_archived=${includeArchived}`);
  return response.data;
};

export const getRole = async (id: number): Promise<Role> => {
  const response = await apiClient.get(`/api/v1/accounts/roles/${id}/`);
  return response.data;
};

export const createRole = async (data: { nom: string; description?: string }): Promise<Role> => {
  const response = await apiClient.post("/api/v1/accounts/roles/", data);
  return response.data;
};

export const updateRole = async ({
  id,
  data,
}: {
  id: number;
  data: { nom?: string; description?: string };
}): Promise<Role> => {
  const response = await apiClient.patch(`/api/v1/accounts/roles/${id}/`, data);
  return response.data;
};

export const archiveRole = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/accounts/roles/${id}/`);
};

export const reactivateRole = async (id: number): Promise<void> => {
  await apiClient.post(`/api/v1/accounts/roles/${id}/reactivate/`);
};
