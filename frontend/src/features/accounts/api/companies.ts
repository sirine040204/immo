import { apiClient } from "@/services/api/client";
import { CompanyProfile, CompanyProfileUpdate } from "../types/company";

export const getCompanyProfile = async (): Promise<CompanyProfile> => {
  const response = await apiClient.get<CompanyProfile>("/api/v1/accounts/companies/me/");
  return response.data;
};

export const updateCompanyProfile = async (data: CompanyProfileUpdate): Promise<CompanyProfile> => {
  const response = await apiClient.patch<CompanyProfile>("/api/v1/accounts/companies/me/", data);
  return response.data;
};
