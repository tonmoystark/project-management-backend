import apiClient, { type ApiResponse } from "@/api/axios";
import type { UserAvatar } from "@/api/auth.api";

export interface NoteAuthor {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  avatar?: UserAvatar;
}

export interface NoteProject {
  _id: string;
  name: string;
  description?: string;
}

export interface Note {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  project?: NoteProject;
  createdBy?: NoteAuthor;
}

export interface NotePayload {
  title: string;
}

export const noteApi = {
  getAll: async (projectId: string) => {
    const { data } = await apiClient.get<ApiResponse<Note[]>>(
      `/projects/${projectId}/notes`,
    );
    return data;
  },

  create: async (projectId: string, payload: NotePayload) => {
    const { data } = await apiClient.post<ApiResponse<Note>>(
      `/projects/${projectId}/notes`,
      payload,
    );
    return data;
  },

  update: async (projectId: string, noteId: string, payload: NotePayload) => {
    const { data } = await apiClient.put<ApiResponse<Note>>(
      `/projects/${projectId}/notes/${noteId}`,
      payload,
    );
    return data;
  },

  delete: async (projectId: string, noteId: string) => {
    const { data } = await apiClient.delete<
      ApiResponse<Record<string, never>>
    >(`/projects/${projectId}/notes/${noteId}`);
    return data;
  },
};
