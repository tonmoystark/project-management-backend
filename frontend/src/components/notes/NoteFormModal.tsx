import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { Note, NotePayload } from "@/api/note.api";
import { getApiFieldErrors } from "@/api/axios";
import { useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface NoteFormModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  note?: Note | null;
}

export const NoteFormModal = ({
  projectId,
  open,
  onClose,
  note = null,
}: NoteFormModalProps) => {
  const isEditing = Boolean(note);
  const createNote = useCreateNote(projectId);
  const updateNote = useUpdateNote(projectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<NotePayload>({
    defaultValues: {
      title: note?.title ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({ title: note?.title ?? "" });
  }, [open, note, reset]);

  const applyServerErrors = (error: unknown) => {
    const fieldErrors = getApiFieldErrors(error);
    if (fieldErrors.title) {
      setError("title", { type: "server", message: fieldErrors.title });
    }
  };

  const onSubmit = (values: NotePayload) => {
    const trimmedTitle = values.title.trim();

    if (isEditing && note) {
      updateNote.mutate(
        { noteId: note._id, payload: { title: trimmedTitle } },
        {
          onSuccess: () => onClose(),
          onError: applyServerErrors,
        },
      );
      return;
    }

    createNote.mutate(
      { title: trimmedTitle },
      {
        onSuccess: () => {
          reset({ title: "" });
          onClose();
        },
        onError: applyServerErrors,
      },
    );
  };

  const isPending = createNote.isPending || updateNote.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit note" : "New personal note"}
      description="Only you can view, edit, and delete your notes in this project."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="note-title"
          label="Note"
          error={errors.title?.message}
        >
          <Textarea
            id="note-title"
            placeholder="Write a reminder, meeting note, or idea..."
            className="min-h-32"
            hasError={Boolean(errors.title)}
            {...register("title", {
              required: "Note cannot be empty",
              validate: (value) =>
                value.trim().length > 0 || "Note cannot be empty",
            })}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            loadingText={isEditing ? "Saving..." : "Creating..."}
          >
            {isEditing ? "Save changes" : "Create note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
