import { apiClient as client } from "@/services/api/client";
import { TypeEntretien, CreateTypeEntretienDTO, UpdateTypeEntretienDTO } from "../types/typeEntretien";

const TYPES_ENTRETIEN_URL = "/api/v1/maintenance/types-entretien/";

export const fetchTypesEntretien = async (): Promise<TypeEntretien[]> => {
  const response = await client.get(TYPES_ENTRETIEN_URL);
  return response.data;
};

export const fetchTypeEntretien = async (id: number): Promise<TypeEntretien> => {
  const response = await client.get(`${TYPES_ENTRETIEN_URL}${id}/`);
  return response.data;
};

export const createTypeEntretien = async (data: CreateTypeEntretienDTO): Promise<TypeEntretien> => {
  const response = await client.post(TYPES_ENTRETIEN_URL, data);
  return response.data;
};

export const updateTypeEntretien = async ({ id, data }: { id: number; data: UpdateTypeEntretienDTO }): Promise<TypeEntretien> => {
  const response = await client.patch(`${TYPES_ENTRETIEN_URL}${id}/`, data);
  return response.data;
};

export const deleteTypeEntretien = async (id: number): Promise<void> => {
  await client.delete(`${TYPES_ENTRETIEN_URL}${id}/delete/`);
};

export const archiveTypeEntretien = async (id: number): Promise<void> => {
  await client.post(`${TYPES_ENTRETIEN_URL}${id}/archive/`);
};

export const restoreTypeEntretien = async (id: number): Promise<void> => {
  await client.post(`${TYPES_ENTRETIEN_URL}${id}/restore/`);
};
