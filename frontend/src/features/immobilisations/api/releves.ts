import { apiClient } from "@/services/api/client";
import { ReleveUsage } from "../types/immobilisation";

const RELEVES_URL = "/api/v1/immobilisations/releves-usage/";

export const fetchRelevesUsage = async (immobilisationId?: number): Promise<ReleveUsage[]> => {
  const url = immobilisationId ? `${RELEVES_URL}?immobilisation=${immobilisationId}` : RELEVES_URL;
  const response = await apiClient.get(url);
  return response.data;
};

export const deleteReleveUsage = async (releveId: number): Promise<void> => {
  await apiClient.delete(`${RELEVES_URL}${releveId}/`);
};
