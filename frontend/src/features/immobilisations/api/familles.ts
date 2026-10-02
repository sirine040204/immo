import { apiClient as client } from "@/services/api/client";
import { Famille, CreateFamilleDTO, UpdateFamilleDTO } from "../types/famille";

const FAMILLES_URL = "/api/v1/immobilisations/familles/";

export const fetchFamilles = async (): Promise<Famille[]> => {
  const response = await client.get(FAMILLES_URL);
  return response.data;
};

export const fetchFamille = async (id: number): Promise<Famille> => {
  const response = await client.get(`${FAMILLES_URL}${id}/`);
  return response.data;
};

export const createFamille = async (data: CreateFamilleDTO): Promise<Famille> => {
  const formData = new FormData();
  formData.append("code", data.code);
  formData.append("nom", data.nom);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.taux_amortissement !== undefined && data.taux_amortissement !== null) {
    formData.append("taux_amortissement", data.taux_amortissement.toString());
  }
  if (data.icone instanceof File) {
    formData.append("icone", data.icone);
  }

  const response = await client.post(FAMILLES_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateFamille = async ({ id, data }: { id: number; data: UpdateFamilleDTO }): Promise<Famille> => {
  const formData = new FormData();
  if (data.code !== undefined) formData.append("code", data.code);
  if (data.nom !== undefined) formData.append("nom", data.nom);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.taux_amortissement !== undefined) {
    formData.append("taux_amortissement", data.taux_amortissement === null ? "" : data.taux_amortissement.toString());
  }
  if (data.icone instanceof File) {
    formData.append("icone", data.icone);
  } else if (data.icone === null) {
    formData.append("icone", "");
  }

  const response = await client.patch(`${FAMILLES_URL}${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteFamille = async (id: number): Promise<void> => {
  await client.delete(`${FAMILLES_URL}${id}/`);
};

export const archiveFamille = async (id: number): Promise<void> => {
  await client.post(`${FAMILLES_URL}${id}/archive/`);
};

export const restoreFamille = async (id: number): Promise<void> => {
  await client.post(`${FAMILLES_URL}${id}/restore/`);
};
