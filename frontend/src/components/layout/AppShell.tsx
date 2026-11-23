import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderKanban, LogOut, User as UserIcon } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { EmailVerifyBanner } from "@/components/layout/EmailVerifyBanner";
import { cn } from "@/lib/utils";

export const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              to="/projects"
              className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FolderKanban className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">ProjectHub</span>
            </Link>

            <nav className="flex items-center gap-1">
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )
                }
              >
                Projects
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )
              }
            >
              {user?.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt={user.username}
                  className="h-6 w-6 rounded-full border border-border object-cover"
                />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{user?.username}</span>
            </NavLink>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              isLoading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <EmailVerifyBanner />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};
