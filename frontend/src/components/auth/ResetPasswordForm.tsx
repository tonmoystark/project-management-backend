import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/axios";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface ResetPasswordValues {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export const ResetPasswordForm = ({
  token,
  onSuccess,
}: ResetPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const resetMutation = useMutation({
    mutationFn: (password: string) => authApi.resetPassword(token, password),
    onSuccess: (response) => {
      toast.success(response.message || "Password reset successfully.");
      onSuccess();
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      if (fieldErrors.password) {
        setError("password", { type: "server", message: fieldErrors.password });
      }
      toast.error(
        getApiErrorMessage(error, "Reset link is invalid or has expired"),
      );
    },
  });

  const onSubmit = (values: ResetPasswordValues) => {
    resetMutation.mutate(values.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="password"
        label="New password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          toggleLabel="new password"
          hasError={Boolean(errors.password)}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label="Confirm new password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          toggleLabel="confirm new password"
          hasError={Boolean(errors.confirmPassword)}
          {...register("confirmPassword", {
            required: "Please confirm your new password",
            validate: (value) =>
              value === passwordValue || "Passwords do not match",
          })}
        />
      </FormField>

      <Button
        type="submit"
        isLoading={resetMutation.isPending}
        loadingText="Resetting password..."
        className="mt-2 w-full"
      >
        Reset password
      </Button>
    </form>
  );
};
