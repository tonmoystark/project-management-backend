import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShieldAlert, Trash2 } from "lucide-react";

import type { UpdateProjectPayload } from "@/api/project.api";
import { getApiFieldErrors } from "@/api/axios";
import { useDeleteProject, useUpdateProject } from "@/hooks/useProjects";
import { useProjectWorkspace } from "@/components/projects/ProjectWorkspaceLayout";
import { USER_ROLES } from "@/utils/constants";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const ProjectSettingPage = () => {
  const { project, role } = useProjectWorkspace();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const updateProject = useUpdateProject(project._id);
  const deleteProject = useDeleteProject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectPayload>({
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description ?? "",
    });
  }, [project, reset]);

  if (role !== USER_ROLES.ADMIN) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <h2 className="text-base font-semibold">Admin access required</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only project administrators can modify or delete this project.
        </p>
      </div>
    );
  }

  const onSubmit = (values: UpdateProjectPayload) => {
    updateProject.mutate(
      {
        name: values.name.trim(),
        description: values.description?.trim() ?? "",
      },
      {
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

  const handleDelete = () => {
    deleteProject.mutate(project._id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        navigate("/projects", { replace: true });
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold">General Settings</h2>
          <p className="text-xs text-muted-foreground">
            Update the project&apos;s name and description.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            id="settings-name"
            label="Project name"
            error={errors.name?.message}
          >
            <Input
              id="settings-name"
              type="text"
              hasError={Boolean(errors.name)}
              {...register("name", {
                required: "Project name is required",
                validate: (value) =>
                  value.trim().length > 0 || "Project name cannot be empty",
              })}
            />
          </FormField>

          <FormField
            id="settings-description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="settings-description"
              hasError={Boolean(errors.description)}
              {...register("description")}
            />
          </FormField>

          <Button
            type="submit"
            disabled={!isDirty}
            isLoading={updateProject.isPending}
            loadingText="Saving changes..."
          >
            Save changes
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-destructive/40 bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-destructive">
              Danger Zone
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently delete{" "}
              <span className="font-medium text-foreground">
                {project.name}
              </span>
              . This action cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            Delete project
          </Button>
        </div>
      </section>

      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete project?"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteProject.isPending}
            loadingText="Deleting..."
            onClick={handleDelete}
          >
            Yes, delete project
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectSettingPage;
