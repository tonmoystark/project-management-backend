import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Check, ListTodo, Pencil, Plus, Trash2, X } from "lucide-react";

import type { CreateSubTaskPayload, SubTask } from "@/api/task.api";
import {
  useCreateSubTask,
  useDeleteSubTask,
  useUpdateSubTask,
} from "@/hooks/useTasks";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface SubTaskSectionProps {
  projectId: string;
  taskId: string;
  subTasks: SubTask[];
  canManage: boolean;
}

export const SubTaskSection = ({
  projectId,
  taskId,
  subTasks,
  canManage,
}: SubTaskSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subTaskToDelete, setSubTaskToDelete] = useState<SubTask | null>(null);

  const createSubTask = useCreateSubTask(projectId, taskId);
  const updateSubTask = useUpdateSubTask(projectId, taskId);
  const deleteSubTask = useDeleteSubTask(projectId, taskId);

  const createForm = useForm<CreateSubTaskPayload>({
    defaultValues: { title: "", content: "" },
  });

  const editForm = useForm<CreateSubTaskPayload>({
    defaultValues: { title: "", content: "" },
  });

  const handleCreate = (values: CreateSubTaskPayload) => {
    createSubTask.mutate(
      {
        title: values.title.trim(),
        content: values.content.trim(),
      },
      {
        onSuccess: () => {
          createForm.reset();
          setIsAdding(false);
        },
      },
    );
  };

  const startEditing = (subTask: SubTask) => {
    setEditingId(subTask._id);
    editForm.reset({
      title: subTask.title,
      content: subTask.content,
    });
  };

  const handleUpdate = (values: CreateSubTaskPayload) => {
    if (!editingId) return;
    updateSubTask.mutate(
      {
        subTaskId: editingId,
        payload: {
          title: values.title.trim(),
          content: values.content.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!subTaskToDelete) return;
    deleteSubTask.mutate(subTaskToDelete._id, {
      onSuccess: () => setSubTaskToDelete(null),
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            Subtasks ({subTasks.length})
          </h2>
        </div>

        {canManage && !isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Subtask
          </Button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="mb-5 space-y-3 rounded-lg border border-border bg-muted/30 p-4"
          noValidate
        >
          <FormField
            id="new-subtask-title"
            label="Subtask title"
            error={createForm.formState.errors.title?.message}
          >
            <Input
              id="new-subtask-title"
              placeholder="e.g. Create API schema"
              hasError={Boolean(createForm.formState.errors.title)}
              {...createForm.register("title", {
                required: "Title is required",
                validate: (v) => v.trim().length > 0 || "Title cannot be empty",
              })}
            />
          </FormField>

          <FormField
            id="new-subtask-content"
            label="Details"
            error={createForm.formState.errors.content?.message}
          >
            <Textarea
              id="new-subtask-content"
              placeholder="What needs to be done for this subtask?"
              className="min-h-20"
              hasError={Boolean(createForm.formState.errors.content)}
              {...createForm.register("content", {
                required: "Details are required",
                validate: (v) =>
                  v.trim().length > 0 || "Details cannot be empty",
              })}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                createForm.reset();
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createSubTask.isPending}
              loadingText="Adding..."
            >
              Add subtask
            </Button>
          </div>
        </form>
      )}

      {subTasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No subtasks yet.
          {canManage && " Click “Add Subtask” to break this task down."}
        </p>
      ) : (
        <ul className="space-y-3">
          {subTasks.map((subTask) => {
            const isEditing = editingId === subTask._id;

            if (isEditing) {
              return (
                <li
                  key={subTask._id}
                  className="rounded-lg border border-primary/40 bg-muted/30 p-4"
                >
                  <form
                    onSubmit={editForm.handleSubmit(handleUpdate)}
                    className="space-y-3"
                    noValidate
                  >
                    <FormField
                      id={`edit-subtask-title-${subTask._id}`}
                      label="Title"
                      error={editForm.formState.errors.title?.message}
                    >
                      <Input
                        id={`edit-subtask-title-${subTask._id}`}
                        hasError={Boolean(editForm.formState.errors.title)}
                        {...editForm.register("title", {
                          required: "Title is required",
                          validate: (v) =>
                            v.trim().length > 0 || "Title cannot be empty",
                        })}
                      />
                    </FormField>

                    <FormField
                      id={`edit-subtask-content-${subTask._id}`}
                      label="Details"
                      error={editForm.formState.errors.content?.message}
                    >
                      <Textarea
                        id={`edit-subtask-content-${subTask._id}`}
                        className="min-h-20"
                        hasError={Boolean(editForm.formState.errors.content)}
                        {...editForm.register("content", {
                          required: "Details are required",
                          validate: (v) =>
                            v.trim().length > 0 || "Details cannot be empty",
                        })}
                      />
                    </FormField>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={updateSubTask.isPending}
                        loadingText="Saving..."
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  </form>
                </li>
              );
            }

            return (
              <li
                key={subTask._id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {subTask.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {subTask.content}
                  </p>
                  {subTask.createdAt && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Created{" "}
                      {format(new Date(subTask.createdAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${subTask.title}`}
                      onClick={() => startEditing(subTask)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${subTask.title}`}
                      onClick={() => setSubTaskToDelete(subTask)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(subTaskToDelete)}
        onClose={() => setSubTaskToDelete(null)}
        title="Delete subtask?"
        description={
          subTaskToDelete
            ? `Are you sure you want to delete "${subTaskToDelete.title}"?`
            : undefined
        }
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubTaskToDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteSubTask.isPending}
            loadingText="Deleting..."
            onClick={handleConfirmDelete}
          >
            Delete subtask
          </Button>
        </div>
      </Modal>
    </section>
  );
};
