import { useState } from "react";
import { format } from "date-fns";
import { Trash2, User as UserIcon } from "lucide-react";

import type { ProjectMember } from "@/api/project.api";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteProjectMember,
  useUpdateMemberRole,
} from "@/hooks/useProjects";
import {
  AVAILABLE_USER_ROLES,
  ROLE_LABELS,
  USER_ROLES,
  type UserRole,
} from "@/utils/constants";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface MemberTableProps {
  projectId: string;
  members: ProjectMember[];
  currentUserRole: UserRole | undefined;
}

export const MemberTable = ({
  projectId,
  members,
  currentUserRole,
}: MemberTableProps) => {
  const { user: currentUser } = useAuth();
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(
    null,
  );

  const updateRole = useUpdateMemberRole(projectId);
  const deleteMember = useDeleteProjectMember(projectId);

  const isAdmin = currentUserRole === USER_ROLES.ADMIN;

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateRole.mutate({ userId, newRole });
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    deleteMember.mutate(memberToRemove.user._id, {
      onSuccess: () => {
        setMemberToRemove(null);
      },
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Role</th>
                <th className="hidden px-5 py-3 sm:table-cell">Joined</th>
                {isAdmin && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isSelf = member.user._id === currentUser?._id;
                const displayRole = member.role ?? (isSelf ? currentUserRole : undefined);

                return (
                  <tr
                    key={member.user._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {member.user.avatar?.url ? (
                          <img
                            src={member.user.avatar.url}
                            alt={member.user.username}
                            className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-foreground">
                              {member.user.fullName || member.user.username}
                            </p>
                            {isSelf && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                You
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {isAdmin && !isSelf ? (
                        <Select
                          aria-label={`Change role for ${member.user.username}`}
                          value={displayRole ?? USER_ROLES.MEMBER}
                          disabled={updateRole.isPending}
                          onChange={(e) =>
                            handleRoleChange(
                              member.user._id,
                              e.target.value as UserRole,
                            )
                          }
                          className="h-8 w-36 text-xs"
                        >
                          {AVAILABLE_USER_ROLES.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {ROLE_LABELS[roleOption]}
                            </option>
                          ))}
                        </Select>
                      ) : displayRole ? (
                        <RoleBadge role={displayRole} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="hidden px-5 py-3.5 text-xs text-muted-foreground sm:table-cell">
                      {member.createdAt
                        ? format(new Date(member.createdAt), "MMM d, yyyy")
                        : "—"}
                    </td>

                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        {!isSelf && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRemove(member)}
                            aria-label={`Remove ${member.user.username}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title="Remove member?"
        description={
          memberToRemove
            ? `Remove ${memberToRemove.user.fullName || memberToRemove.user.username} (${memberToRemove.user.email}) from this project?`
            : undefined
        }
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMemberToRemove(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteMember.isPending}
            loadingText="Removing..."
            onClick={handleConfirmRemove}
          >
            Remove member
          </Button>
        </div>
      </Modal>
    </>
  );
};
