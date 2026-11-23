import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Paperclip, User as UserIcon } from "lucide-react";

import type { Task, TaskUser } from "@/api/task.api";

interface TaskCardProps {
  projectId: string;
  task: Task;
}

const getAssignee = (assignedTo: Task["assignedTo"]): TaskUser | null => {
  if (!assignedTo || typeof assignedTo === "string") return null;
  return assignedTo;
};

export const TaskCard = ({ projectId, task }: TaskCardProps) => {
  const assignee = getAssignee(task.assignedTo);
  const attachmentCount = task.attatchments?.length ?? 0;

  return (
    <Link
      to={`/projects/${projectId}/tasks/${task._id}`}
      className="group block rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary">
        {task.name}
      </h4>

      {task.content && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {task.content}
        </p>
      )}

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          {assignee ? (
            <>
              {assignee.avatar?.url ? (
                <img
                  src={assignee.avatar.url}
                  alt={assignee.username}
                  className="h-5 w-5 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">
                {assignee.fullName || assignee.username}
              </span>
            </>
          ) : (
            <span className="italic">Unassigned</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </span>
          )}
          {task.createdAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.createdAt), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
