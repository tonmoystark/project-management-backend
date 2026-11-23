import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { authApi } from "@/api/auth.api";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard } from "@/components/auth/AuthCard";

type VerificationStatus = "verifying" | "success" | "error";

const VerifyEmailPage = () => {
  const { verificationToken } = useParams<{ verificationToken: string }>();
  const { isAuthenticated, refreshUser } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>(
    verificationToken ? "verifying" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    verificationToken
      ? ""
      : "Verification token is missing from the link.",
  );

  // Guard against React StrictMode double-invoking a one-time verification token
  const attemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!verificationToken || attemptedTokenRef.current === verificationToken) {
      return;
    }
    attemptedTokenRef.current = verificationToken;

    const verify = async () => {
      try {
        await authApi.verifyEmail(verificationToken);
        setStatus("success");
        if (isAuthenticated) {
          await refreshUser();
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          getApiErrorMessage(
            error,
            "This verification link is invalid or has expired.",
          ),
        );
      }
    };

    void verify();
  }, [verificationToken, isAuthenticated, refreshUser]);

  if (status === "verifying") {
    return (
      <AuthCard
        title="Verifying your email..."
        subtitle="Please wait a moment while we confirm your email address."
        icon={
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <div className="h-2" />
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard
        title="Email verified!"
        subtitle="Your email address has been confirmed. You're all set."
        icon={
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        }
      >
        <Link
          to={isAuthenticated ? "/projects" : "/login"}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isAuthenticated ? "Go to Projects" : "Continue to Sign In"}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verification failed"
      subtitle={errorMessage}
      icon={
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
      }
    >
      <Link
        to={isAuthenticated ? "/profile" : "/login"}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isAuthenticated ? "Resend from Profile" : "Back to Sign In"}
      </Link>
    </AuthCard>
  );
};

export default VerifyEmailPage;
