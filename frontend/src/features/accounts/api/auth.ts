import { apiClient } from "@/services/api/client";
import { AuthResponse, LoginCredentials, RegisterCredentials, RegisterResponse } from "../types/auth";

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/api/v1/accounts/login/", credentials);
  return response.data;
};

export const registerCompany = async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>("/api/v1/accounts/register/", credentials);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get("/api/v1/accounts/me/");
  return response.data;
};

export const updateUserProfile = async (data: { nom: string; prenom: string; telephone?: string; email?: string; photo?: string }) => {
  const response = await apiClient.patch("/api/v1/accounts/me/", data);
  return response.data;
};
export const requestPasswordReset = async (data: { email: string; method: "OTP" | "LINK" }) => {
  const response = await apiClient.post("/api/v1/accounts/password-reset/request/", data);
  return response.data;
};

export const verifyPasswordResetOTP = async (data: { email: string; otp_code: string }) => {
  const response = await apiClient.post("/api/v1/accounts/password-reset/verify-otp/", data);
  return response.data;
};

export const confirmPasswordReset = async (data: { token: string; mot_de_passe: string }) => {
  const response = await apiClient.post("/api/v1/accounts/password-reset/confirm/", data);
  return response.data;
};
