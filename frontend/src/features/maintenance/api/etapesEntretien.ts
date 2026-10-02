import { apiClient as client } from "@/services/api/client";
import { EtapeEntretien, CreateEtapeEntretienDTO, UpdateEtapeEntretienDTO } from "../types/etapeEntretien";

const ETAPES_ENTRETIEN_URL = "/api/v1/maintenance/etapes-entretien/";

export const fetchEtapesEntretien = async (): Promise<EtapeEntretien[]> => {
  const response = await client.get(ETAPES_ENTRETIEN_URL);
  return response.data;
};

export const fetchEtapeEntretien = async (id: number): Promise<EtapeEntretien> => {
  const response = await client.get(`${ETAPES_ENTRETIEN_URL}${id}/`);
  return response.data;
};

export const createEtapeEntretien = async (data: CreateEtapeEntretienDTO): Promise<EtapeEntretien> => {
  const response = await client.post(ETAPES_ENTRETIEN_URL, data);
  return response.data;
};

export const updateEtapeEntretien = async ({ id, data }: { id: number; data: UpdateEtapeEntretienDTO }): Promise<EtapeEntretien> => {
  const response = await client.patch(`${ETAPES_ENTRETIEN_URL}${id}/`, data);
  return response.data;
};

export const deleteEtapeEntretien = async (id: number): Promise<void> => {
  await client.delete(`${ETAPES_ENTRETIEN_URL}${id}/delete/`);
};

export const archiveEtapeEntretien = async (id: number): Promise<void> => {
  await client.post(`${ETAPES_ENTRETIEN_URL}${id}/archive/`);
};

export const restoreEtapeEntretien = async (id: number): Promise<void> => {
  await client.post(`${ETAPES_ENTRETIEN_URL}${id}/restore/`);
};
