import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

import { authApi } from "@/api/auth.api";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export const EmailVerifyBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendEmailVerification(),
    onSuccess: (response) => {
      toast.success(
        response.message || "Verification email sent! Check your inbox.",
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to resend verification email"),
      );
    },
  });

  if (!user || user.isEmailVerified || dismissed) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Your email <span className="font-medium">{user.email}</span> is not
            verified yet.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={resendMutation.isPending}
            loadingText="Sending..."
            onClick={() => resendMutation.mutate()}
          >
            Resend email
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss verification banner"
            className="rounded p-1 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
