import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckSquare,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";

import { useTasks } from "@/hooks/useTasks";
import { useProjectMembers } from "@/hooks/useProjects";
import { getApiErrorMessage } from "@/api/axios";
import { useProjectWorkspace } from "@/components/projects/ProjectWorkspaceLayout";
import {
  AVAILABLE_TASK_STATUSES,
  TASK_STATUS_LABELS,
  USER_ROLES,
  type TaskStatus,
} from "@/utils/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskListTable } from "@/components/tasks/TaskListTable";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

export const ProjectTasksPage = () => {
  const { project, role } = useProjectWorkspace();

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useTasks(project._id);
  const { data: members } = useProjectMembers(project._id);

  const canCreateTask = role === USER_ROLES.ADMIN;

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const normalized = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      if (assigneeFilter !== "all") {
        const assigneeId =
          typeof task.assignedTo === "string"
            ? task.assignedTo
            : task.assignedTo?._id;
        if (assigneeId !== assigneeFilter) {
          return false;
        }
      }

      if (normalized) {
        const matchesName = task.name.toLowerCase().includes(normalized);
        const matchesContent = task.content?.toLowerCase().includes(normalized);
        if (!matchesName && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {tasks
              ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} in this project`
              : "Track and manage work across your team."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {canCreateTask && (
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      {tasks && tasks.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9"
            />
          </div>

          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | "all")
            }
            className="sm:w-40"
          >
            <option value="all">All statuses</option>
            {AVAILABLE_TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by assignee"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="sm:w-44"
          >
            <option value="all">All assignees</option>
            {members?.map((member) => (
              <option key={member.user._id} value={member.user._id}>
                {member.user.fullName || member.user.username}
              </option>
            ))}
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="space-y-3 rounded-xl border border-border bg-muted/40 p-3"
            >
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-28 animate-pulse rounded-lg bg-card" />
              <div className="h-28 animate-pulse rounded-lg bg-card" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h3 className="text-base font-semibold">Failed to load tasks</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Could not fetch tasks.")}
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
      ) : !tasks || tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <CheckSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">No tasks yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {canCreateTask
              ? "Create your first task and assign it to a team member."
              : "Tasks added to this project will appear here."}
          </p>
          {canCreateTask && (
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4" />
              Create first task
            </Button>
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks match your current filters.
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard projectId={project._id} tasks={filteredTasks} />
      ) : (
        <TaskListTable projectId={project._id} tasks={filteredTasks} />
      )}

      <TaskFormModal
        projectId={project._id}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
