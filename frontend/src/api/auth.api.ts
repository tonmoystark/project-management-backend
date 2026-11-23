import apiClient, { type ApiResponse } from "@/api/axios";

export interface UserAvatar {
  url: string;
  localPath: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: UserAvatar;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
      "/auth/register",
      payload,
    );
    return data;
  },

  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<LoginData>>(
      "/auth/login",
      payload,
    );
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      "/auth/logout",
    );
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>(
      "/auth/current-user",
    );
    return data;
  },

  verifyEmail: async (verificationToken: string) => {
    const { data } = await apiClient.get<ApiResponse<{ isVerified: boolean }>>(
      `/auth/verify-email/${verificationToken}`,
    );
    return data;
  },

  resendEmailVerification: async () => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      "/auth/resend-email-verification",
    );
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      "/auth/forgot-password",
      { email },
    );
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      `/auth/reset-password/${token}`,
      { password },
    );
    return data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      "/auth/change-password",
      payload,
    );
    return data;
  },
};
