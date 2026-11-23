import { useMemo, useState } from "react";
import { AlertCircle, FolderPlus, Plus, Search } from "lucide-react";

import { useProjects } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/api/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

const ProjectPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects, isLoading, isError, error, refetch } = useProjects();

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter(
      ({ project }) =>
        project.name.toLowerCase().includes(normalized) ||
        project.description?.toLowerCase().includes(normalized),
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Select a project workspace or create a new one.
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects && projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-xl border border-border bg-card p-5"
            >
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-full rounded bg-muted" />
              <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-base font-semibold">Failed to load projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Could not fetch your projects.")}
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
      ) : !projects || projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first project to start organizing tasks, inviting team
            members, and taking notes.
          </p>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-5"
          >
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No projects match &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((item) => (
            <ProjectCard key={item.project._id} item={item} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

export default ProjectPage;
