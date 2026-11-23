import apiClient, { type ApiResponse } from "@/api/axios";
import type { UserAvatar } from "@/api/auth.api";
import type { MemberStatus, UserRole } from "@/utils/constants";

export interface Project {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectSummary extends Project {
  members: number;
}

export interface ProjectListItem {
  project: ProjectSummary;
  role: UserRole;
}

export interface ProjectMemberUser {
  _id: string;
  username: string;
  fullName?: string;
  email: string;
  avatar?: UserAvatar;
}

export interface ProjectMember {
  project: string;
  role?: UserRole;
  status?: MemberStatus;
  user: ProjectMemberUser;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInvitation {
  _id: string;
  role: UserRole;
  status: MemberStatus;
  project: {
    _id: string;
    name: string;
    description?: string;
  };
  invitedBy?: {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: UserAvatar;
  };
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
}

export interface AddMemberPayload {
  email: string;
  role: UserRole;
}

export const projectApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<ProjectListItem[]>>(
      "/projects",
    );
    return data;
  },

  getById: async (projectId: string) => {
    const { data } = await apiClient.get<ApiResponse<Project>>(
      `/projects/${projectId}`,
    );
    return data;
  },

  create: async (payload: CreateProjectPayload) => {
    const { data } = await apiClient.post<ApiResponse<Project>>(
      "/projects",
      payload,
    );
    return data;
  },

  update: async (projectId: string, payload: UpdateProjectPayload) => {
    const { data } = await apiClient.put<ApiResponse<Project>>(
      `/projects/${projectId}`,
      payload,
    );
    return data;
  },

  delete: async (projectId: string) => {
    const { data } = await apiClient.delete<
      ApiResponse<Record<string, never>>
    >(`/projects/${projectId}`);
    return data;
  },

  getMembers: async (projectId: string) => {
    const { data } = await apiClient.get<ApiResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`,
    );
    return data;
  },

  addMember: async (projectId: string, payload: AddMemberPayload) => {
    const { data } = await apiClient.post<ApiResponse<Record<string, never>>>(
      `/projects/${projectId}/members`,
      payload,
    );
    return data;
  },

  updateMemberRole: async (
    projectId: string,
    userId: string,
    newRole: UserRole,
  ) => {
    const { data } = await apiClient.put<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { newRole },
    );
    return data;
  },

  deleteMember: async (projectId: string, userId: string) => {
    const { data } = await apiClient.delete<
      ApiResponse<Record<string, never>>
    >(`/projects/${projectId}/members/${userId}`);
    return data;
  },

  getMyInvitations: async () => {
    const { data } = await apiClient.get<ApiResponse<ProjectInvitation[]>>(
      "/projects/invitations",
    );
    return data;
  },

  acceptInvitation: async (invitationId: string) => {
    const { data } = await apiClient.patch<ApiResponse<ProjectMember>>(
      `/projects/invitations/${invitationId}/accept`,
    );
    return data;
  },

  rejectInvitation: async (invitationId: string) => {
    const { data } = await apiClient.patch<ApiResponse<Record<string, never>>>(
      `/projects/invitations/${invitationId}/reject`,
    );
    return data;
  },
};
