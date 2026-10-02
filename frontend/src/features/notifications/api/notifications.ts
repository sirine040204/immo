import { apiClient as api } from "@/services/api/client";
import { AppNotification } from "../types";

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get("/api/v1/notifications/");
  return response.data;
};

export const fetchNotification = async (id: number): Promise<AppNotification> => {
  const response = await api.get(`/api/v1/notifications/${id}/`);
  return response.data;
};

export const markAsRead = async (id: number): Promise<AppNotification> => {
  const response = await api.patch(`/api/v1/notifications/${id}/read/`);
  return response.data;
};

export const markAsUnread = async (id: number): Promise<AppNotification> => {
  const response = await api.patch(`/api/v1/notifications/${id}/unread/`);
  return response.data;
};

export const markAllAsRead = async (): Promise<{ message: string; nombre_modifie: number }> => {
  const response = await api.patch("/api/v1/notifications/read-all/");
  return response.data;
};

export const deleteNotification = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/api/v1/notifications/${id}/`);
  return response.data;
};

export const deleteAllReadNotifications = async (): Promise<{ message: string; nombre_supprime: number }> => {
  const response = await api.delete("/api/v1/notifications/delete-read/");
  return response.data;
};
