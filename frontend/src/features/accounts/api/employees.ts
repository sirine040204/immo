import { apiClient } from "@/services/api/client";
import { Employee, EmployeeUpdate, Role } from "../types/employee";

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<Employee[]>("/api/v1/accounts/employees/");
  return response.data;
};

export const getEmployee = async (id: number | string): Promise<Employee> => {
  const response = await apiClient.get<Employee>(`/api/v1/accounts/employees/${id}/`);
  return response.data;
};

export const updateEmployee = async (data: { id: number | string, payload: EmployeeUpdate }): Promise<Employee> => {
  const response = await apiClient.patch<Employee>(`/api/v1/accounts/employees/${data.id}/`, data.payload);
  return response.data;
};

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get<Role[]>("/api/v1/accounts/roles/");
  return response.data;
};

export const inviteEmployee = async (payload: { nom: string, prenom: string, email: string, role: number }): Promise<{ message: string, user_id: number }> => {
  const response = await apiClient.post<{ message: string, user_id: number }>("/api/v1/accounts/employees/invite/", payload);
  return response.data;
};

export const deactivateEmployee = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/api/v1/accounts/employees/${id}/deactivate/`);
  return response.data;
};

export const reactivateEmployee = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/api/v1/accounts/employees/${id}/reactivate/`);
  return response.data;
};

export const verifyActivationToken = async (token: string): Promise<{ message: string, email: string }> => {
  const response = await apiClient.get<{ message: string, email: string }>(`/api/v1/accounts/employees/activate/?token=${token}`);
  return response.data;
};

export const activateEmployee = async (payload: { token: string, mot_de_passe: string }): Promise<{ message: string, user_id: number }> => {
  const response = await apiClient.post<{ message: string, user_id: number }>("/api/v1/accounts/employees/activate/", payload);
  return response.data;
};

export const cancelEmployeeInvitation = async (id: string | number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/accounts/employees/${id}/cancel-invitation/`);
  return response.data;
};

export const fetchEmployeeExtraPermissions = async (id: string | number): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/api/v1/accounts/employees/${id}/extra-permissions/`);
  return response.data;
};

export const addEmployeeExtraPermission = async (id: string | number, permissionId: number): Promise<any> => {
  const response = await apiClient.post<any>(`/api/v1/accounts/employees/${id}/extra-permissions/`, { permission_id: permissionId });
  return response.data;
};

export const removeEmployeeExtraPermission = async (id: string | number, permissionId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/accounts/employees/${id}/extra-permissions/${permissionId}/`);
};
