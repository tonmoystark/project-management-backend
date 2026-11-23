import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi, type RegisterPayload } from "@/api/auth.api";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/axios";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface RegisterFormValues extends RegisterPayload {
  confirmPassword: string;
}

interface RegisterFormProps {
  onSuccess: (email: string) => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (response, variables) => {
      toast.success(
        response.message || "Account created! Please verify your email.",
      );
      onSuccess(variables.email);
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      const validFields: Array<keyof RegisterFormValues> = [
        "username",
        "email",
        "password",
      ];

      validFields.forEach((field) => {
        if (fieldErrors[field]) {
          setError(field, { type: "server", message: fieldErrors[field] });
        }
      });

      toast.error(getApiErrorMessage(error, "Registration failed"));
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      username: values.username.trim().toLowerCase(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="username"
        label="Username"
        error={errors.username?.message}
        hint="3–20 lowercase characters."
      >
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="johndoe"
          hasError={Boolean(errors.username)}
          {...register("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            maxLength: {
              value: 20,
              message: "Username must be at most 20 characters",
            },
            validate: (value) =>
              value === value.toLowerCase() || "Username must be lowercase",
          })}
        />
      </FormField>

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

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Create a password"
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
        label="Confirm password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          toggleLabel="confirm password"
          hasError={Boolean(errors.confirmPassword)}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) =>
              value === passwordValue || "Passwords do not match",
          })}
        />
      </FormField>

      <Button
        type="submit"
        isLoading={registerMutation.isPending}
        loadingText="Creating account..."
        className="mt-2 w-full"
      >
        Create account
      </Button>
    </form>
  );
};
