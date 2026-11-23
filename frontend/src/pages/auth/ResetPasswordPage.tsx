import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="The password reset token is missing."
        icon={
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
        }
      >
        <Link
          to="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Request a new reset link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Enter your new password below to regain access to your account."
      footer={
        <>
          Back to{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm
        token={token}
        onSuccess={() => navigate("/login", { replace: true })}
      />
    </AuthCard>
  );
};

export default ResetPasswordPage;
