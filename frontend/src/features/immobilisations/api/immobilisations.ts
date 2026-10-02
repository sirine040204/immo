import { apiClient as api } from "@/services/api/client";
import { Immobilisation, ImmobilisationFormData, ValeurAttribut, ValeurAttributFormData } from "../types/immobilisation";

export const fetchImmobilisations = async (): Promise<Immobilisation[]> => {
  const response = await api.get("/api/v1/immobilisations/immobilisations/");
  return response.data;
};

export const fetchImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.get(`/api/v1/immobilisations/immobilisations/${id}/`);
  return response.data;
};

export const fetchDocumentsRequis = async (id: number): Promise<any> => {
  const response = await api.get(`/api/v1/immobilisations/immobilisations/${id}/documents-requis/`);
  return response.data;
};

export const updateImmobilisation = async ({
  id,
  data,
}: {
  id: number;
  data: Partial<ImmobilisationFormData>;
}): Promise<Immobilisation> => {
  const response = await api.patch(`/api/v1/immobilisations/immobilisations/${id}/`, data);
  return response.data;
};

export const deleteImmobilisation = async (id: number): Promise<void> => {
  await api.delete(`/api/v1/immobilisations/immobilisations/${id}/delete/`);
};

export const activateImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/activate/`);
  return response.data;
};

export const archiveImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/archive/`);
  return response.data;
};

export const restoreImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/restore/`);
  return response.data;
};

export const mettreHorsServiceImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/hors-service/`);
  return response.data;
};

export const remettreEnServiceImmobilisation = async (id: number): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/remettre-en-service/`);
  return response.data;
};

export const reformerImmobilisation = async ({
  id,
  data,
}: {
  id: number;
  data: { date_cession: string; prix_cession: number | null; motif_sortie: string };
}): Promise<Immobilisation> => {
  const response = await api.post(`/api/v1/immobilisations/immobilisations/${id}/reformer/`, data);
  return response.data;
};

export const createImmobilisation = async (data: ImmobilisationFormData): Promise<Immobilisation> => {
  const response = await api.post("/api/v1/immobilisations/immobilisations/", data);
  return response.data;
};

// Valeur Attribut API
export const fetchValeursAttributs = async (immobilisationId: number): Promise<ValeurAttribut[]> => {
  const response = await api.get(`/api/v1/immobilisations/valeurs-attributs/?immobilisation=${immobilisationId}`);
  return response.data;
};

export const createValeurAttribut = async (data: ValeurAttributFormData): Promise<ValeurAttribut> => {
  const response = await api.post("/api/v1/immobilisations/valeurs-attributs/", data);
  return response.data;
};

export const updateValeurAttribut = async ({
  id,
  data,
}: {
  id: number;
  data: Partial<ValeurAttributFormData>;
}): Promise<ValeurAttribut> => {
  const response = await api.patch(`/api/v1/immobilisations/valeurs-attributs/${id}/`, data);
  return response.data;
};
