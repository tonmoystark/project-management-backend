import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi, type ChangePasswordPayload } from "@/api/auth.api";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/axios";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface ChangePasswordValues extends ChangePasswordPayload {
  confirmNewPassword: string;
}

export const ChangePasswordForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword");

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApi.changePassword(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Password changed successfully");
      reset();
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      const validFields: Array<keyof ChangePasswordPayload> = [
        "oldPassword",
        "newPassword",
      ];

      validFields.forEach((field) => {
        if (fieldErrors[field]) {
          setError(field, { type: "server", message: fieldErrors[field] });
        }
      });

      toast.error(getApiErrorMessage(error, "Failed to change password"));
    },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    changePasswordMutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4"
      noValidate
    >
      <FormField
        id="oldPassword"
        label="Current password"
        error={errors.oldPassword?.message}
      >
        <PasswordInput
          id="oldPassword"
          autoComplete="current-password"
          placeholder="Enter your current password"
          toggleLabel="current password"
          hasError={Boolean(errors.oldPassword)}
          {...register("oldPassword", {
            required: "Current password is required",
          })}
        />
      </FormField>

      <FormField
        id="newPassword"
        label="New password"
        error={errors.newPassword?.message}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="Enter a new password"
          toggleLabel="new password"
          hasError={Boolean(errors.newPassword)}
          {...register("newPassword", {
            required: "New password is required",
            minLength: {
              value: 6,
              message: "New password must be at least 6 characters",
            },
          })}
        />
      </FormField>

      <FormField
        id="confirmNewPassword"
        label="Confirm new password"
        error={errors.confirmNewPassword?.message}
      >
        <PasswordInput
          id="confirmNewPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          toggleLabel="confirm new password"
          hasError={Boolean(errors.confirmNewPassword)}
          {...register("confirmNewPassword", {
            required: "Please confirm your new password",
            validate: (value) =>
              value === newPasswordValue || "Passwords do not match",
          })}
        />
      </FormField>

      <Button
        type="submit"
        isLoading={changePasswordMutation.isPending}
        loadingText="Updating password..."
      >
        Update password
      </Button>
    </form>
  );
};
