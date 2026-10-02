import { apiClient as api } from "@/services/api/client";
import { Document, CreateDocumentDTO, UpdateDocumentDTO } from "../types/document";

export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await api.get("/api/v1/documents/");
  return response.data;
};

export const fetchDocument = async (id: number): Promise<Document> => {
  const response = await api.get(`/api/v1/documents/${id}/`);
  return response.data;
};

export const createDocument = async (data: CreateDocumentDTO): Promise<Document> => {
  const formData = new FormData();

  formData.append("type_document", data.type_document.toString());
  if (data.immobilisation) {
    formData.append("immobilisation", data.immobilisation.toString());
  }
  formData.append("nom", data.nom);
  if (data.description) {
    formData.append("description", data.description);
  }
  formData.append("fichier", data.fichier);
  if (data.date_debut_validite) {
    formData.append("date_debut_validite", data.date_debut_validite);
  }
  if (data.date_fin_validite) {
    formData.append("date_fin_validite", data.date_fin_validite);
  }

  const response = await api.post("/api/v1/documents/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateDocument = async ({ id, data }: { id: number; data: UpdateDocumentDTO }): Promise<Document> => {
  const formData = new FormData();

  if (data.type_document) formData.append("type_document", data.type_document.toString());

  // Note: if immobilisation is intentionally null to detach it, we might need to send empty string or something. 
  // Django REST handles empty string in FormData as null for ForeignKey if allow_null=True.
  if (data.immobilisation !== undefined) {
    if (data.immobilisation === null) {
      formData.append("immobilisation", "");
    } else {
      formData.append("immobilisation", data.immobilisation.toString());
    }
  }

  if (data.nom) formData.append("nom", data.nom);
  if (data.description !== undefined) {
    formData.append("description", data.description);
  }

  if (data.fichier) {
    formData.append("fichier", data.fichier);
  }

  if (data.date_debut_validite !== undefined) {
    if (data.date_debut_validite === null) {
      formData.append("date_debut_validite", "");
    } else {
      formData.append("date_debut_validite", data.date_debut_validite);
    }
  }

  if (data.date_fin_validite !== undefined) {
    if (data.date_fin_validite === null) {
      formData.append("date_fin_validite", "");
    } else {
      formData.append("date_fin_validite", data.date_fin_validite);
    }
  }

  const response = await api.patch(`/api/v1/documents/${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const archiveDocument = async (id: number): Promise<void> => {
  const response = await api.post(`/api/v1/documents/${id}/archive/`);
  return response.data;
};

export const restoreDocument = async (id: number): Promise<void> => {
  const response = await api.post(`/api/v1/documents/${id}/restore/`);
  return response.data;
};

export const deleteDocument = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/v1/documents/${id}/`);
  return response.data;
};

export const fetchDocumentsExpiration = async (): Promise<import("../types/document").DocumentExpirationResponse> => {
  const response = await api.get("/api/v1/documents/expiration/");
  return response.data;
};

