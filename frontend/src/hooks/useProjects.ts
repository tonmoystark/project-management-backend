import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  projectApi,
  type AddMemberPayload,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from "@/api/project.api";
import { getApiErrorMessage } from "@/api/axios";
import type { UserRole } from "@/utils/constants";

export const projectKeys = {
  all: ["projects"] as const,
  invitations: ["projects", "invitations"] as const,
  detail: (projectId: string) => ["projects", projectId] as const,
  members: (projectId: string) => ["projects", projectId, "members"] as const,
};

export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const response = await projectApi.getAll();
      return response.data;
    },
  });
};

export const useProject = (projectId: string | undefined) => {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: async () => {
      const response = await projectApi.getById(projectId!);
      return response.data;
    },
    enabled: Boolean(projectId),
  });
};

export const useProjectRole = (
  projectId: string | undefined,
): UserRole | undefined => {
  const { data: projects } = useProjects();
  if (!projectId || !projects) return undefined;
  return projects.find((item) => item.project._id === projectId)?.role;
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectApi.create(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Project created successfully");
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create project"));
    },
  });
};

export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) =>
      projectApi.update(projectId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Project updated successfully");
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update project"));
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectApi.delete(projectId),
    onSuccess: (response, projectId) => {
      toast.success(response.message || "Project deleted successfully");
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete project"));
    },
  });
};

export const useProjectMembers = (projectId: string | undefined) => {
  return useQuery({
    queryKey: projectKeys.members(projectId ?? ""),
    queryFn: async () => {
      const response = await projectApi.getMembers(projectId!);
      return response.data;
    },
    enabled: Boolean(projectId),
  });
};

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddMemberPayload) =>
      projectApi.addMember(projectId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Member added successfully");
      void queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to add member"));
    },
  });
};

export const useUpdateMemberRole = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: UserRole }) =>
      projectApi.updateMemberRole(projectId, userId, newRole),
    onSuccess: (response) => {
      toast.success(response.message || "Member role updated");
      void queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update member role"));
    },
  });
};

export const useDeleteProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => projectApi.deleteMember(projectId, userId),
    onSuccess: (response) => {
      toast.success(response.message || "Member removed from project");
      void queryClient.invalidateQueries({
        queryKey: projectKeys.members(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to remove member"));
    },
  });
};

export const useInvitations = () => {
  return useQuery({
    queryKey: projectKeys.invitations,
    queryFn: async () => {
      const response = await projectApi.getMyInvitations();
      return response.data;
    },
    refetchInterval: 30_000,
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      projectApi.acceptInvitation(invitationId),
    onSuccess: (response) => {
      toast.success(response.message || "Invitation accepted!");
      void queryClient.invalidateQueries({ queryKey: projectKeys.invitations });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to accept invitation"));
    },
  });
};

export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      projectApi.rejectInvitation(invitationId),
    onSuccess: (response) => {
      toast.success(response.message || "Invitation declined");
      void queryClient.invalidateQueries({ queryKey: projectKeys.invitations });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to decline invitation"));
    },
  });
};
