import type { Task } from "@/api/task.api";
import {
  AVAILABLE_TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/utils/constants";
import { TaskCard } from "@/components/tasks/TaskCard";
import { cn } from "@/lib/utils";

const columnDotStyles: Record<TaskStatus, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
};

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
}

export const KanbanBoard = ({ projectId, tasks }: KanbanBoardProps) => {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {AVAILABLE_TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className="flex flex-col rounded-xl border border-border bg-muted/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-2.5 w-2.5 rounded-full", columnDotStyles[status])}
                />
                <h3 className="text-sm font-semibold">
                  {TASK_STATUS_LABELS[status]}
                </h3>
              </div>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5">
              {columnTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No tasks in {TASK_STATUS_LABELS[status].toLowerCase()}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task._id} projectId={projectId} task={task} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
