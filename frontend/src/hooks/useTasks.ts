import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  taskApi,
  type CreateSubTaskPayload,
  type CreateTaskPayload,
  type UpdateSubTaskPayload,
  type UpdateTaskPayload,
} from "@/api/task.api";
import { getApiErrorMessage } from "@/api/axios";
import type { TaskStatus } from "@/utils/constants";

export const taskKeys = {
  list: (projectId: string) => ["projects", projectId, "tasks"] as const,
  detail: (projectId: string, taskId: string) =>
    ["projects", projectId, "tasks", taskId] as const,
};

export const useTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: taskKeys.list(projectId ?? ""),
    queryFn: async () => {
      const response = await taskApi.getAll(projectId!);
      return response.data;
    },
    enabled: Boolean(projectId),
  });
};

export const useTask = (
  projectId: string | undefined,
  taskId: string | undefined,
) => {
  return useQuery({
    queryKey: taskKeys.detail(projectId ?? "", taskId ?? ""),
    queryFn: async () => {
      const response = await taskApi.getById(projectId!, taskId!);
      return response.data;
    },
    enabled: Boolean(projectId && taskId),
  });
};

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      taskApi.create(projectId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Task created successfully");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.list(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create task"));
    },
  });
};

export const useUpdateTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) =>
      taskApi.update(projectId, taskId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Task updated successfully");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.list(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update task"));
    },
  });
};

export const useUpdateTaskStatus = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TaskStatus) =>
      taskApi.updateStatus(projectId, taskId, status),
    onSuccess: (response) => {
      toast.success(response.message || "Task status updated");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.list(projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update task status"));
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(projectId, taskId),
    onSuccess: (response, taskId) => {
      toast.success(response.message || "Task deleted successfully");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.list(projectId),
      });
      queryClient.removeQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete task"));
    },
  });
};

export const useCreateSubTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubTaskPayload) =>
      taskApi.createSubTask(projectId, taskId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Subtask created");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create subtask"));
    },
  });
};

export const useUpdateSubTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subTaskId,
      payload,
    }: {
      subTaskId: string;
      payload: UpdateSubTaskPayload;
    }) => taskApi.updateSubTask(projectId, taskId, subTaskId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Subtask updated");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update subtask"));
    },
  });
};

export const useDeleteSubTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subTaskId: string) =>
      taskApi.deleteSubTask(projectId, taskId, subTaskId),
    onSuccess: (response) => {
      toast.success(response.message || "Subtask deleted");
      void queryClient.invalidateQueries({
        queryKey: taskKeys.detail(projectId, taskId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete subtask"));
    },
  });
};
