import { apiClient as client } from "@/services/api/client";
import { ModeleEntretien, CreateModeleEntretienDTO, UpdateModeleEntretienDTO } from "../types/modeleEntretien";

const MODELES_ENTRETIEN_URL = "/api/v1/maintenance/modeles-entretien/";

export const fetchModelesEntretien = async (): Promise<ModeleEntretien[]> => {
  const response = await client.get(MODELES_ENTRETIEN_URL);
  return response.data;
};

export const fetchModeleEntretien = async (id: number): Promise<ModeleEntretien> => {
  const response = await client.get(`${MODELES_ENTRETIEN_URL}${id}/`);
  return response.data;
};

export const createModeleEntretien = async (data: CreateModeleEntretienDTO): Promise<ModeleEntretien> => {
  const response = await client.post(MODELES_ENTRETIEN_URL, data);
  return response.data;
};

export const updateModeleEntretien = async ({ id, data }: { id: number; data: UpdateModeleEntretienDTO }): Promise<ModeleEntretien> => {
  const response = await client.patch(`${MODELES_ENTRETIEN_URL}${id}/`, data);
  return response.data;
};

export const deleteModeleEntretien = async (id: number): Promise<void> => {
  await client.delete(`${MODELES_ENTRETIEN_URL}${id}/delete/`);
};

export const archiveModeleEntretien = async (id: number): Promise<void> => {
  await client.post(`${MODELES_ENTRETIEN_URL}${id}/archive/`);
};

export const restoreModeleEntretien = async (id: number): Promise<void> => {
  await client.post(`${MODELES_ENTRETIEN_URL}${id}/restore/`);
};
