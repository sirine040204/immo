import { apiClient as api } from "@/services/api/client";
import { CoutImmobilisation, CreateCoutDTO, UpdateCoutDTO } from "../types/costs";

export const fetchCosts = async (): Promise<CoutImmobilisation[]> => {
  const response = await api.get("/api/v1/costs/");
  return response.data;
};

export const fetchCostById = async (id: number): Promise<CoutImmobilisation> => {
  const response = await api.get(`/api/v1/costs/${id}/`);
  return response.data;
};

export const createCost = async (data: CreateCoutDTO): Promise<CoutImmobilisation> => {
  const response = await api.post("/api/v1/costs/", data);
  return response.data;
};

export const updateCost = async ({ id, data }: { id: number; data: UpdateCoutDTO }): Promise<CoutImmobilisation> => {
  const response = await api.patch(`/api/v1/costs/${id}/`, data);
  return response.data;
};

export const deleteCost = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/v1/costs/${id}/`);
  return response.data;
};

export const submitCost = async (id: number): Promise<CoutImmobilisation> => {
  const response = await api.post(`/api/v1/costs/${id}/submit/`);
  return response.data;
};

export const validateCost = async (id: number): Promise<CoutImmobilisation> => {
  const response = await api.post(`/api/v1/costs/${id}/validate/`);
  return response.data;
};

export const rejectCost = async ({ id, motif_rejet }: { id: number; motif_rejet: string }): Promise<CoutImmobilisation> => {
  const response = await api.post(`/api/v1/costs/${id}/reject/`, { motif_rejet });
  return response.data;
};

export const archiveCost = async (id: number): Promise<CoutImmobilisation> => {
  const response = await api.post(`/api/v1/costs/${id}/archive/`);
  return response.data;
};

export const unarchiveCost = async (id: number): Promise<CoutImmobilisation> => {
  const response = await api.post(`/api/v1/costs/${id}/unarchive/`);
  return response.data;
};

export const exportCostsToCSV = async (): Promise<Blob> => {
  const response = await api.get("/api/v1/costs/export/csv/", {
    responseType: 'blob',
  });
  return response.data;
};
