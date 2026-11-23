import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { noteApi, type NotePayload } from "@/api/note.api";
import { getApiErrorMessage } from "@/api/axios";

export const noteKeys = {
  list: (projectId: string) => ["projects", projectId, "notes"] as const,
};

export const useNotes = (projectId: string | undefined) => {
  return useQuery({
    queryKey: noteKeys.list(projectId ?? ""),
    queryFn: async () => {
      const response = await noteApi.getAll(projectId!);
      return response.data;
    },
    enabled: Boolean(projectId),
  });
};

export const useCreateNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotePayload) => noteApi.create(projectId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Note created successfully");
      void queryClient.invalidateQueries({
        queryKey: noteKeys.list(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create note"));
    },
  });
};

export const useUpdateNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: NotePayload;
    }) => noteApi.update(projectId, noteId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Note updated successfully");
      void queryClient.invalidateQueries({
        queryKey: noteKeys.list(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update note"));
    },
  });
};

export const useDeleteNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => noteApi.delete(projectId, noteId),
    onSuccess: (response) => {
      toast.success(response.message || "Note deleted successfully");
      void queryClient.invalidateQueries({
        queryKey: noteKeys.list(projectId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete note"));
    },
  });
};
