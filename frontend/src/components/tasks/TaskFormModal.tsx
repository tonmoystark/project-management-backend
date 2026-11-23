import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/api/task.api";
import { getApiFieldErrors } from "@/api/axios";
import { useProjectMembers } from "@/hooks/useProjects";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import {
  AVAILABLE_TASK_STATUSES,
  MEMBER_STATUSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/utils/constants";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const MAX_FILE_SIZE_BYTES = 1 * 1000 * 1000; // Matches backend Multer 1MB limit

interface TaskFormValues {
  name: string;
  content: string;
  status: TaskStatus;
  assignedTo: string;
}

interface TaskFormModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  task?: Task | null;
}

const getAssignedToId = (assignedTo: Task["assignedTo"]): string => {
  if (!assignedTo) return "";
  if (typeof assignedTo === "string") return assignedTo;
  return assignedTo._id;
};

export const TaskFormModal = ({
  projectId,
  open,
  onClose,
  task = null,
}: TaskFormModalProps) => {
  const isEditing = Boolean(task);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: members } = useProjectMembers(projectId);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId, task?._id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      name: task?.name ?? "",
      content: task?.content ?? "",
      status: task?.status ?? TASK_STATUSES.TODO,
      assignedTo: getAssignedToId(task?.assignedTo),
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: task?.name ?? "",
      content: task?.content ?? "",
      status: task?.status ?? TASK_STATUSES.TODO,
      assignedTo: getAssignedToId(task?.assignedTo),
    });
    setSelectedFiles([]);
  }, [open, task, reset]);

  const handleClose = () => {
    setSelectedFiles([]);
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    const validFiles: File[] = [];

    incoming.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" exceeds the 1MB size limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const applyServerErrors = (error: unknown) => {
    const fieldErrors = getApiFieldErrors(error);
    const fields: Array<keyof TaskFormValues> = [
      "name",
      "content",
      "status",
      "assignedTo",
    ];
    fields.forEach((field) => {
      if (fieldErrors[field]) {
        setError(field, { type: "server", message: fieldErrors[field] });
      }
    });
  };

  const onSubmit = (values: TaskFormValues) => {
    if (isEditing && task) {
      updateTask.mutate(
        {
          name: values.name.trim(),
          content: values.content.trim(),
          status: values.status,
          assignedTo: values.assignedTo || undefined,
          attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
        },
        {
          onSuccess: () => handleClose(),
          onError: applyServerErrors,
        },
      );
      return;
    }

    createTask.mutate(
      {
        name: values.name.trim(),
        content: values.content.trim() || undefined,
        status: values.status,
        assignedTo: values.assignedTo,
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      },
      {
        onSuccess: () => handleClose(),
        onError: applyServerErrors,
      },
    );
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit task" : "Create new task"}
      description={
        isEditing
          ? "Update task details or attach additional files."
          : "Assign a task to a team member and track its progress."
      }
      className="max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="task-name" label="Title" error={errors.name?.message}>
          <Input
            id="task-name"
            type="text"
            placeholder="e.g. Build authentication UI"
            hasError={Boolean(errors.name)}
            {...register("name", {
              required: "Task title is required",
              validate: (value) =>
                value.trim().length > 0 || "Task title cannot be empty",
            })}
          />
        </FormField>

        <FormField
          id="task-content"
          label="Description"
          error={errors.content?.message}
        >
          <Textarea
            id="task-content"
            placeholder="Add details, acceptance criteria, or links..."
            hasError={Boolean(errors.content)}
            {...register("content")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="task-status"
            label="Status"
            error={errors.status?.message}
          >
            <Select
              id="task-status"
              hasError={Boolean(errors.status)}
              {...register("status", { required: "Status is required" })}
            >
              {AVAILABLE_TASK_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {TASK_STATUS_LABELS[statusOption]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            id="task-assignee"
            label="Assignee"
            error={errors.assignedTo?.message}
          >
            <Select
              id="task-assignee"
              hasError={Boolean(errors.assignedTo)}
              {...register("assignedTo", {
                required: !isEditing ? "Please select an assignee" : false,
              })}
            >
              <option value="">Select member...</option>
              {members
                ?.filter((member) => member.status !== MEMBER_STATUSES.PENDING)
                .map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.fullName || member.user.username} (@
                    {member.user.username})
                  </option>
                ))}
            </Select>
          </FormField>
        </div>

        <FormField
          id="task-attachments"
          label={isEditing ? "Add attachments" : "Attachments"}
          hint="Optional. Max 1MB per file."
        >
          <label
            htmlFor="task-attachments"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Upload className="h-4 w-4" />
            <span>Choose files to upload</span>
            <input
              id="task-attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {selectedFiles.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isPending}
            loadingText={isEditing ? "Saving..." : "Creating..."}
          >
            {isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
