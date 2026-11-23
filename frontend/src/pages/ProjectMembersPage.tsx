import { useState } from "react";
import { AlertCircle, UserPlus, Users } from "lucide-react";

import { useProjectMembers } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/api/axios";
import { useProjectWorkspace } from "@/components/projects/ProjectWorkspaceLayout";
import { USER_ROLES } from "@/utils/constants";
import { Button } from "@/components/ui/Button";
import { MemberTable } from "@/components/members/MemberTable";
import { AddMemberModal } from "@/components/members/AddMemberModal";

const ProjectMembersPage = () => {
  const { project, role } = useProjectWorkspace();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const {
    data: members,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjectMembers(project._id);

  const canAddMembers =
    role === USER_ROLES.ADMIN || role === USER_ROLES.PROJECT_ADMIN;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            {members
              ? `${members.length} ${members.length === 1 ? "person" : "people"} in this project`
              : "Manage who has access to this project."}
          </p>
        </div>

        {canAddMembers && (
          <Button type="button" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h3 className="text-base font-semibold">Failed to load members</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Could not fetch project members.")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      ) : !members || members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">No members found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add teammates to collaborate on tasks in this project.
          </p>
          {canAddMembers && (
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="mt-4"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>
      ) : (
        <MemberTable
          projectId={project._id}
          members={members}
          currentUserRole={role}
        />
      )}

      <AddMemberModal
        projectId={project._id}
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
};

export default ProjectMembersPage;
