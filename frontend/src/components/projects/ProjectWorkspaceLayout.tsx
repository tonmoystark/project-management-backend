import { Link, NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Settings,
  StickyNote,
  Users,
} from "lucide-react";

import type { Project } from "@/api/project.api";
import { useProject, useProjectRole } from "@/hooks/useProjects";
import { USER_ROLES, type UserRole } from "@/utils/constants";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { cn } from "@/lib/utils";

export interface ProjectWorkspaceContext {
  project: Project;
  role: UserRole | undefined;
}

export const useProjectWorkspace = () => {
  return useOutletContext<ProjectWorkspaceContext>();
};

export const ProjectWorkspaceLayout = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, isError } = useProject(projectId);
  const role = useProjectRole(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This project doesn&apos;t exist or you don&apos;t have access to view
          it.
        </p>
        <Link
          to="/projects"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const tabs = [
    { to: "tasks", label: "Tasks", icon: CheckSquare, visible: true },
    { to: "members", label: "Members", icon: Users, visible: true },
    { to: "notes", label: "Notes", icon: StickyNote, visible: true },
    {
      to: "settings",
      label: "Settings",
      icon: Settings,
      visible: role === USER_ROLES.ADMIN,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Projects
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              {role && <RoleBadge role={role} />}
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border pt-1">
          {tabs
            .filter((tab) => tab.visible)
            .map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </NavLink>
              );
            })}
        </nav>
      </div>

      <Outlet context={{ project, role } satisfies ProjectWorkspaceContext} />
    </div>
  );
};
