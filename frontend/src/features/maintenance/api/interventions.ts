import { apiClient } from "@/services/api/client";
import { Intervention, CreateInterventionDTO, UpdateInterventionDTO, PatchInterventionStatutDTO } from "../types/intervention";

const BASE_URL = "/api/v1/maintenance/interventions/";

export const fetchInterventions = async (): Promise<Intervention[]> => {
  const response = await apiClient.get<Intervention[]>(BASE_URL);
  return response.data;
};

export const fetchIntervention = async (id: number): Promise<Intervention> => {
  const response = await apiClient.get<Intervention>(`${BASE_URL}${id}/`);
  return response.data;
};

export const createIntervention = async (data: CreateInterventionDTO): Promise<Intervention> => {
  const response = await apiClient.post<Intervention>(BASE_URL, data);
  return response.data;
};

export const updateIntervention = async ({ id, data }: { id: number; data: UpdateInterventionDTO }): Promise<Intervention> => {
  const response = await apiClient.patch<Intervention>(`${BASE_URL}${id}/`, data);
  return response.data;
};

export const deleteIntervention = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}${id}/`);
};

export const updateInterventionStatut = async ({ id, data }: { id: number; data: PatchInterventionStatutDTO }): Promise<Intervention> => {
  const response = await apiClient.patch<Intervention>(`${BASE_URL}${id}/statut/`, data);
  return response.data;
};

export const fetchMaintenanceKPIs = async (): Promise<{ mttr_hours: number; mtbf_days: number; mttr_trend: number; mtbf_trend: number }> => {
  const response = await apiClient.get<{ mttr_hours: number; mtbf_days: number; mttr_trend: number; mtbf_trend: number }>("/api/v1/maintenance/kpis/");
  return response.data;
};
