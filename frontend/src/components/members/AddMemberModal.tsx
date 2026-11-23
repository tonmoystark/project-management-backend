import { useForm } from "react-hook-form";

import type { AddMemberPayload } from "@/api/project.api";
import { getApiFieldErrors } from "@/api/axios";
import { useAddProjectMember } from "@/hooks/useProjects";
import {
  AVAILABLE_USER_ROLES,
  ROLE_LABELS,
  USER_ROLES,
} from "@/utils/constants";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface AddMemberModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export const AddMemberModal = ({
  projectId,
  open,
  onClose,
}: AddMemberModalProps) => {
  const addMember = useAddProjectMember(projectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddMemberPayload>({
    defaultValues: {
      email: "",
      role: USER_ROLES.MEMBER,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: AddMemberPayload) => {
    addMember.mutate(
      {
        email: values.email.trim().toLowerCase(),
        role: values.role,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          if (fieldErrors.email) {
            setError("email", { type: "server", message: fieldErrors.email });
          }
          if (fieldErrors.role) {
            setError("role", { type: "server", message: fieldErrors.role });
          }
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add team member"
      description="Invite an existing registered user to this project by email."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="member-email"
          label="User email"
          error={errors.email?.message}
        >
          <Input
            id="member-email"
            type="email"
            placeholder="teammate@example.com"
            hasError={Boolean(errors.email)}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
          />
        </FormField>

        <FormField
          id="member-role"
          label="Role"
          error={errors.role?.message}
          hint="Admins can manage settings and members. Project Admins can manage tasks."
        >
          <Select
            id="member-role"
            hasError={Boolean(errors.role)}
            {...register("role", { required: "Role is required" })}
          >
            {AVAILABLE_USER_ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {ROLE_LABELS[roleOption]}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={addMember.isPending}
            loadingText="Adding..."
          >
            Add member
          </Button>
        </div>
      </form>
    </Modal>
  );
};
