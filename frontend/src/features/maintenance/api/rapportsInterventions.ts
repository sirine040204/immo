import { apiClient } from "@/services/api/client";
import { RapportIntervention, CreateRapportInterventionDTO, UpdateRapportInterventionDTO } from "../types/rapportIntervention";

const BASE_URL = "/api/v1/maintenance/rapports-intervention/";

export const fetchRapportsInterventions = async (): Promise<RapportIntervention[]> => {
  const response = await apiClient.get(BASE_URL);
  return response.data.results || response.data;
};

export const fetchRapportIntervention = async (id: number): Promise<RapportIntervention> => {
  const response = await apiClient.get(`${BASE_URL}${id}/`);
  return response.data;
};

export const createRapportIntervention = async (data: CreateRapportInterventionDTO): Promise<RapportIntervention> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateRapportIntervention = async ({ id, data }: { id: number; data: UpdateRapportInterventionDTO }): Promise<RapportIntervention> => {
  const response = await apiClient.patch(`${BASE_URL}${id}/`, data);
  return response.data;
};

export const deleteRapportIntervention = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}${id}/`);
};
