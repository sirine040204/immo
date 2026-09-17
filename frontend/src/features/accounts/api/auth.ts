import { apiClient } from "@/services/api/client";
import { AuthResponse, LoginCredentials } from "../types/auth";

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/v1/accounts/login/", credentials);
  return response.data;
};
