import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Paperclip, User as UserIcon } from "lucide-react";

import type { Task, TaskUser } from "@/api/task.api";
import { StatusBadge } from "@/components/tasks/StatusBadge";

interface TaskListTableProps {
  projectId: string;
  tasks: Task[];
}

const getAssignee = (assignedTo: Task["assignedTo"]): TaskUser | null => {
  if (!assignedTo || typeof assignedTo === "string") return null;
  return assignedTo;
};

export const TaskListTable = ({ projectId, tasks }: TaskListTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3">Task</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assignee</th>
              <th className="hidden px-5 py-3 sm:table-cell">Files</th>
              <th className="hidden px-5 py-3 md:table-cell">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const assignee = getAssignee(task.assignedTo);
              const attachmentCount = task.attatchments?.length ?? 0;

              return (
                <tr
                  key={task._id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/projects/${projectId}/tasks/${task._id}`}
                      className="block font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {task.name}
                    </Link>
                    {task.content && (
                      <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted-foreground">
                        {task.content}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={task.status} />
                  </td>

                  <td className="px-5 py-3.5">
                    {assignee ? (
                      <div className="flex items-center gap-2 text-xs">
                        {assignee.avatar?.url ? (
                          <img
                            src={assignee.avatar.url}
                            alt={assignee.username}
                            className="h-6 w-6 rounded-full border border-border object-cover"
                          />
                        ) : (
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{assignee.fullName || assignee.username}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="hidden px-5 py-3.5 text-xs text-muted-foreground sm:table-cell">
                    {attachmentCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" />
                        {attachmentCount}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="hidden px-5 py-3.5 text-xs text-muted-foreground md:table-cell">
                    {task.createdAt
                      ? format(new Date(task.createdAt), "MMM d, yyyy")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
