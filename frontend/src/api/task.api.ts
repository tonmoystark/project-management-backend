import apiClient, { type ApiResponse } from "@/api/axios";
import type { UserAvatar } from "@/api/auth.api";
import type { TaskStatus } from "@/utils/constants";

export interface TaskUser {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: UserAvatar;
}

export interface TaskAttachment {
  _id?: string;
  url: string;
  fileId?: string;
  thumbnailUrl?: string;
  MimeType?: string;
  mimetype?: string;
  size?: number;
}

export interface SubTask {
  _id: string;
  title: string;
  content: string;
  task: string;
  createdBy?: TaskUser;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  name: string;
  content?: string;
  status: TaskStatus;
  assignedTo?: TaskUser | string | null;
  assignedBy?: TaskUser | string;
  project: string;
  attatchments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail extends Task {
  subTasks?: SubTask[];
}

export interface CreateTaskPayload {
  name: string;
  content?: string;
  status: TaskStatus;
  assignedTo: string;
  attachments?: File[];
}

export interface UpdateTaskPayload {
  name?: string;
  content?: string;
  status?: TaskStatus;
  assignedTo?: string;
  attachments?: File[];
}

export interface CreateSubTaskPayload {
  title: string;
  content: string;
}

export interface UpdateSubTaskPayload {
  title?: string;
  content?: string;
}

const buildTaskFormData = (
  payload: CreateTaskPayload | UpdateTaskPayload,
): FormData => {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.content !== undefined)
    formData.append("content", payload.content);
  if (payload.status !== undefined) formData.append("status", payload.status);
  if (payload.assignedTo !== undefined) {
    formData.append("assignedTo", payload.assignedTo);
  }
  if (payload.attachments && payload.attachments.length > 0) {
    payload.attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }

  return formData;
};

export const taskApi = {
  getAll: async (projectId: string) => {
    const { data } = await apiClient.get<ApiResponse<Task[]>>(
      `/projects/${projectId}/tasks`,
    );
    return data;
  },

  getById: async (projectId: string, taskId: string) => {
    const { data } = await apiClient.get<ApiResponse<TaskDetail>>(
      `/projects/${projectId}/tasks/${taskId}`,
    );
    return data;
  },

  create: async (projectId: string, payload: CreateTaskPayload) => {
    const formData = buildTaskFormData(payload);
    const { data } = await apiClient.post<ApiResponse<Task>>(
      `/projects/${projectId}/tasks`,
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  },

  update: async (
    projectId: string,
    taskId: string,
    payload: UpdateTaskPayload,
  ) => {
    const formData = buildTaskFormData(payload);
    const { data } = await apiClient.put<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}`,
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  },

  updateStatus: async (
    projectId: string,
    taskId: string,
    status: TaskStatus,
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}/status`,
      { status },
    );
    return data;
  },

  delete: async (projectId: string, taskId: string) => {
    const { data } = await apiClient.delete<
      ApiResponse<Record<string, never>>
    >(`/projects/${projectId}/tasks/${taskId}`);
    return data;
  },

  createSubTask: async (
    projectId: string,
    taskId: string,
    payload: CreateSubTaskPayload,
  ) => {
    const { data } = await apiClient.post<ApiResponse<SubTask>>(
      `/projects/${projectId}/tasks/${taskId}/subtask`,
      payload,
    );
    return data;
  },

  updateSubTask: async (
    projectId: string,
    taskId: string,
    subTaskId: string,
    payload: UpdateSubTaskPayload,
  ) => {
    const { data } = await apiClient.put<ApiResponse<SubTask>>(
      `/projects/${projectId}/tasks/${taskId}/subtask/${subTaskId}`,
      payload,
    );
    return data;
  },

  deleteSubTask: async (
    projectId: string,
    taskId: string,
    subTaskId: string,
  ) => {
    const { data } = await apiClient.delete<
      ApiResponse<Record<string, never>>
    >(`/projects/${projectId}/tasks/${taskId}/subtask/${subTaskId}`);
    return data;
  },
};
