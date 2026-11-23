import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/axios";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

interface ForgotPasswordValues {
  email: string;
}

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
}

export const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    defaultValues: { email: "" },
  });

  const forgotMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (response, email) => {
      toast.success(
        response.message || "Password reset email sent successfully.",
      );
      onSuccess(email);
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      if (fieldErrors.email) {
        setError("email", { type: "server", message: fieldErrors.email });
      }
      toast.error(getApiErrorMessage(error, "Failed to send reset email"));
    },
  });

  const onSubmit = (values: ForgotPasswordValues) => {
    forgotMutation.mutate(values.email.trim().toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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

      <Button
        type="submit"
        isLoading={forgotMutation.isPending}
        loadingText="Sending reset link..."
        className="mt-2 w-full"
      >
        Send reset link
      </Button>
    </form>
  );
};
