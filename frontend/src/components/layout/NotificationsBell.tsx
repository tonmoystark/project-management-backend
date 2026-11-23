import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Inbox, X } from "lucide-react";

import type { ProjectInvitation } from "@/api/project.api";
import {
  useAcceptInvitation,
  useInvitations,
  useRejectInvitation,
} from "@/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/RoleBadge";

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: invitations = [], isLoading } = useInvitations();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleAccept = (invitation: ProjectInvitation) => {
    setActiveId(invitation._id);
    acceptInvitation.mutate(invitation._id, {
      onSuccess: () => {
        setOpen(false);
        navigate(`/projects/${invitation.project._id}/tasks`);
      },
      onSettled: () => setActiveId(null),
    });
  };

  const handleReject = (invitationId: string) => {
    setActiveId(invitationId);
    rejectInvitation.mutate(invitationId, {
      onSettled: () => setActiveId(null),
    });
  };

  const pendingCount = invitations.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Project invitations"
        aria-expanded={open}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Project Invitations</h3>
            {pendingCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {pendingCount} pending
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : pendingCount === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <Inbox className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No pending invitations
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  When someone invites you to a project, it will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {invitations.map((invitation) => {
                  const isBusy = activeId === invitation._id;
                  const inviterName =
                    invitation.invitedBy?.fullName ||
                    invitation.invitedBy?.username ||
                    "Someone";

                  return (
                    <li key={invitation._id} className="space-y-3 p-4">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm leading-snug text-foreground">
                            <span className="font-medium">{inviterName}</span>{" "}
                            invited you to{" "}
                            <span className="font-semibold">
                              {invitation.project.name}
                            </span>
                          </p>
                          <RoleBadge
                            role={invitation.role}
                            className="shrink-0"
                          />
                        </div>

                        {invitation.project.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {invitation.project.description}
                          </p>
                        )}

                        {invitation.createdAt && (
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(invitation.createdAt),
                              { addSuffix: true },
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          isLoading={isBusy && acceptInvitation.isPending}
                          disabled={isBusy}
                          onClick={() => handleAccept(invitation)}
                          className="flex-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          isLoading={isBusy && rejectInvitation.isPending}
                          disabled={isBusy}
                          onClick={() => handleReject(invitation._id)}
                          className="flex-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
