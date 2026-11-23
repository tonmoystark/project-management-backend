import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { type LoginPayload } from "@/api/auth.api";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (user) => {
      toast.success(`Welcome back, ${user.username}!`);
      onSuccess();
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      const validFields: Array<keyof LoginPayload> = ["email", "password"];

      validFields.forEach((field) => {
        if (fieldErrors[field]) {
          setError(field, { type: "server", message: fieldErrors[field] });
        }
      });

      toast.error(getApiErrorMessage(error, "Invalid credentials"));
    },
  });

  const onSubmit = (values: LoginPayload) => {
    loginMutation.mutate({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
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

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        labelExtra={
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          hasError={Boolean(errors.password)}
          {...register("password", {
            required: "Password is required",
          })}
        />
      </FormField>

      <Button
        type="submit"
        isLoading={loginMutation.isPending}
        loadingText="Signing in..."
        className="mt-2 w-full"
      >
        Sign in
      </Button>
    </form>
  );
};
