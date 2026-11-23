import { useForm } from "react-hook-form";

import type { CreateProjectPayload } from "@/api/project.api";
import { getApiFieldErrors } from "@/api/axios";
import { useCreateProject } from "@/hooks/useProjects";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({
  open,
  onClose,
}: CreateProjectModalProps) => {
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateProjectPayload>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: CreateProjectPayload) => {
    createProject.mutate(
      {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.name) {
            setError("name", { type: "server", message: fieldErrors.name });
          }
          if (fieldErrors.description) {
            setError("description", {
              type: "server",
              message: fieldErrors.description,
            });
          }
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new project"
      description="Set up a workspace for your team's tasks, subtasks, and notes."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="project-name"
          label="Project name"
          error={errors.name?.message}
        >
          <Input
            id="project-name"
            type="text"
            placeholder="e.g. Mobile App Redesign"
            hasError={Boolean(errors.name)}
            {...register("name", {
              required: "Project name is required",
              validate: (value) =>
                value.trim().length > 0 || "Project name cannot be empty",
            })}
          />
        </FormField>

        <FormField
          id="project-description"
          label="Description"
          hint="Optional summary of goals or scope."
          error={errors.description?.message}
        >
          <Textarea
            id="project-description"
            placeholder="Describe what this project is about..."
            hasError={Boolean(errors.description)}
            {...register("description")}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createProject.isPending}
            loadingText="Creating..."
          >
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
