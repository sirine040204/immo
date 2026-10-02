import { apiClient as client } from "@/services/api/client";
import { TypeDocument, CreateTypeDocumentDTO, UpdateTypeDocumentDTO } from "../types/type-document";

const TYPE_DOCUMENTS_URL = "/api/v1/documents/types/";

export const fetchTypeDocuments = async (): Promise<TypeDocument[]> => {
  const response = await client.get(TYPE_DOCUMENTS_URL);
  return response.data;
};

export const fetchTypeDocumentFamilles = async (): Promise<any[]> => {
  const response = await client.get("/api/v1/documents/types-familles/");
  return response.data;
};

export const createTypeDocumentFamille = async (data: { type_document: number; famille: number; obligatoire?: boolean; }): Promise<any> => {
  const response = await client.post("/api/v1/documents/types-familles/", data);
  return response.data;
};

export const updateTypeDocumentFamille = async ({ id, data }: { id: number; data: { type_document?: number; famille?: number; obligatoire?: boolean; } }): Promise<any> => {
  const response = await client.patch(`/api/v1/documents/types-familles/${id}/`, data);
  return response.data;
};

export const deleteTypeDocumentFamille = async (id: number): Promise<void> => {
  await client.delete(`/api/v1/documents/types-familles/${id}/`);
};

export const fetchTypeDocument = async (id: number): Promise<TypeDocument> => {
  const response = await client.get(`${TYPE_DOCUMENTS_URL}${id}/`);
  return response.data;
};

export const createTypeDocument = async (data: CreateTypeDocumentDTO): Promise<TypeDocument> => {
  const response = await client.post(TYPE_DOCUMENTS_URL, data);
  return response.data;
};

export const updateTypeDocument = async ({ id, data }: { id: number; data: UpdateTypeDocumentDTO }): Promise<TypeDocument> => {
  // Use PUT or PATCH based on backend config, views.py indicates both work, we'll use PATCH for partial updates usually, or PUT since all fields might be sent.
  // The serializer handles partial=False for PUT, but since we're using a JSON payload, PUT is fine if we send all required. Let's use PATCH just to be safe if it's a partial update. Wait, views.py line 147: `return self.update(request, type_document_id, partial=False)` for PUT, and for PATCH it's `partial=True`.
  const response = await client.patch(`${TYPE_DOCUMENTS_URL}${id}/`, data);
  return response.data;
};

export const deleteTypeDocument = async (id: number): Promise<void> => {
  await client.delete(`${TYPE_DOCUMENTS_URL}${id}/`);
};

export const archiveTypeDocument = async (id: number): Promise<void> => {
  await client.post(`${TYPE_DOCUMENTS_URL}${id}/archive/`);
};

export const restoreTypeDocument = async (id: number): Promise<void> => {
  await client.post(`${TYPE_DOCUMENTS_URL}${id}/restore/`);
};
