import { apiClient } from "@/services/api/client";
import { AttributDynamique, CreateAttributDTO, UpdateAttributDTO, OptionAttribut, CreateOptionAttributDTO, UpdateOptionAttributDTO } from "../types/attribut";

const ATTRIBUTS_URL = "/api/v1/immobilisations/attributs/";

export const fetchAttributs = async (familleId?: number): Promise<AttributDynamique[]> => {
  const url = familleId ? `${ATTRIBUTS_URL}?famille=${familleId}` : ATTRIBUTS_URL;
  const response = await apiClient.get(url);
  return response.data;
};

export const fetchAttribut = async (id: number): Promise<AttributDynamique> => {
  const response = await apiClient.get(`${ATTRIBUTS_URL}${id}/`);
  return response.data;
};

export const createAttribut = async (data: CreateAttributDTO): Promise<AttributDynamique> => {
  const response = await apiClient.post(ATTRIBUTS_URL, data);
  return response.data;
};

export const updateAttribut = async ({ id, data }: { id: number; data: UpdateAttributDTO }): Promise<AttributDynamique> => {
  const response = await apiClient.patch(`${ATTRIBUTS_URL}${id}/`, data);
  return response.data;
};

export const archiveAttribut = async (id: number): Promise<AttributDynamique> => {
  const response = await apiClient.post(`${ATTRIBUTS_URL}${id}/archive/`);
  return response.data;
};

export const restoreAttribut = async (id: number): Promise<AttributDynamique> => {
  const response = await apiClient.post(`${ATTRIBUTS_URL}${id}/restore/`);
  return response.data;
};

// Options API
export const fetchOptions = async (attributId: number): Promise<OptionAttribut[]> => {
  const response = await apiClient.get(`${ATTRIBUTS_URL}${attributId}/options/`);
  return response.data;
};

export const createOption = async (attributId: number, data: CreateOptionAttributDTO): Promise<OptionAttribut> => {
  const response = await apiClient.post(`${ATTRIBUTS_URL}${attributId}/options/`, data);
  return response.data;
};

export const updateOption = async ({
  attributId,
  optionId,
  data,
}: {
  attributId: number;
  optionId: number;
  data: UpdateOptionAttributDTO;
}): Promise<OptionAttribut> => {
  const response = await apiClient.patch(`${ATTRIBUTS_URL}${attributId}/options/${optionId}/`, data);
  return response.data;
};

export const archiveOption = async (attributId: number, optionId: number): Promise<OptionAttribut> => {
  const response = await apiClient.post(`${ATTRIBUTS_URL}${attributId}/options/${optionId}/archive/`);
  return response.data;
};

export const restoreOption = async (attributId: number, optionId: number): Promise<OptionAttribut> => {
  const response = await apiClient.post(`${ATTRIBUTS_URL}${attributId}/options/${optionId}/restore/`);
  return response.data;
};

export const deleteOption = async (attributId: number, optionId: number): Promise<void> => {
  await apiClient.delete(`${ATTRIBUTS_URL}${attributId}/options/${optionId}/`);
};

export const deleteAttribut = async (id: number): Promise<void> => {
  await apiClient.delete(`${ATTRIBUTS_URL}${id}/`);
};
