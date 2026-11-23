import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { BadgeCheck, Clock, Mail, ShieldCheck, User as UserIcon } from "lucide-react";

import { authApi } from "@/api/auth.api";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

const ProfilePage = () => {
  const { user } = useAuth();

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

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and security settings.
        </p>
      </div>

      {/* Account info card */}
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={user.username}
                className="h-16 w-16 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserIcon className="h-8 w-8" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold">
                {user.fullName || user.username}
              </h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {user.isEmailVerified ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified email
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                Unverified
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={resendMutation.isPending}
                loadingText="Sending..."
                onClick={() => resendMutation.mutate()}
              >
                Resend verification
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {user.createdAt && (
            <div className="flex items-center gap-2.5 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Security / Change Password card */}
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Change Password</h2>
            <p className="text-xs text-muted-foreground">
              Update your password regularly to keep your account secure.
            </p>
          </div>
        </div>

        <ChangePasswordForm />
      </section>
    </div>
  );
};

export default ProfilePage;
