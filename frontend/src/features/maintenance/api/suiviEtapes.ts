import { apiClient } from "@/services/api/client";
import { SuiviEtapeIntervention, CreateSuiviEtapeDTO, UpdateSuiviEtapeDTO } from "../types/intervention";

const BASE_URL = "/api/v1/maintenance/suivis-etapes/";

export const fetchSuivisEtapes = async (interventionId?: number): Promise<SuiviEtapeIntervention[]> => {
  const params = interventionId ? { intervention: interventionId } : undefined;
  const response = await apiClient.get(BASE_URL, { params });
  return response.data.results || response.data;
};

export const createSuiviEtape = async (data: CreateSuiviEtapeDTO): Promise<SuiviEtapeIntervention> => {
  const response = await apiClient.post(BASE_URL, data);
  return response.data;
};

export const updateSuiviEtape = async ({ id, data }: { id: number; data: UpdateSuiviEtapeDTO }): Promise<SuiviEtapeIntervention> => {
  const response = await apiClient.patch(`${BASE_URL}${id}/`, data);
  return response.data;
};

export const deleteSuiviEtape = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}${id}/`);
};
