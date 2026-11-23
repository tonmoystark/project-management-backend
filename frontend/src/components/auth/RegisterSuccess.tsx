import { Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

interface RegisterSuccessProps {
  email: string;
}

export const RegisterSuccess = ({ email }: RegisterSuccessProps) => {
  return (
    <AuthCard
      title="Check your email"
      icon={
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      }
    >
      <p className="text-center text-sm text-muted-foreground">
        We sent a verification link to{" "}
        <span className="font-medium text-foreground">{email}</span>. Click the
        link in your inbox to verify your account.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Mail className="h-4 w-4 shrink-0" />
        <span>
          In development, verification emails arrive in your Mailtrap inbox.
        </span>
      </div>

      <Link
        to="/login"
        className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Continue to Sign In
      </Link>
    </AuthCard>
  );
};
