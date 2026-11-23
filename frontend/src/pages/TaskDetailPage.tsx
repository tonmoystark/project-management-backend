import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Paperclip,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import type { TaskUser } from "@/api/task.api";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteTask, useTask, useUpdateTaskStatus } from "@/hooks/useTasks";
import { useProjectWorkspace } from "@/components/projects/ProjectWorkspaceLayout";
import {
  AVAILABLE_TASK_STATUSES,
  TASK_STATUS_LABELS,
  USER_ROLES,
  type TaskStatus,
} from "@/utils/constants";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { SubTaskSection } from "@/components/tasks/SubTaskSection";

const getAssigneeObj = (
  assignedTo: TaskUser | string | null | undefined,
): TaskUser | null => {
  if (!assignedTo || typeof assignedTo === "string") return null;
  return assignedTo;
};

const getAssigneeId = (
  assignedTo: TaskUser | string | null | undefined,
): string | undefined => {
  if (!assignedTo) return undefined;
  return typeof assignedTo === "string" ? assignedTo : assignedTo._id;
};

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { project, role } = useProjectWorkspace();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useTask(project._id, taskId);

  const updateTaskStatus = useUpdateTaskStatus(project._id, taskId ?? "");
  const deleteTask = useDeleteTask(project._id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-44 animate-pulse rounded-xl border border-border bg-card p-6" />
        <div className="h-44 animate-pulse rounded-xl border border-border bg-card p-6" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <h2 className="text-base font-semibold">Task not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {getApiErrorMessage(error, "Could not load this task.")}
        </p>
        <Link
          to={`/projects/${project._id}/tasks`}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  const assignee = getAssigneeObj(task.assignedTo);
  const isAdmin = role === USER_ROLES.ADMIN;
  const isProjectAdmin = role === USER_ROLES.PROJECT_ADMIN;
  const isAssignee =
    Boolean(currentUser?._id) &&
    getAssigneeId(task.assignedTo) === currentUser?._id;

  const canManipulateTask = isAdmin;
  const canChangeStatus = isAdmin || isProjectAdmin || isAssignee;
  const canManageSubTasks = isAdmin || isProjectAdmin;

  const attachments = task.attatchments ?? [];
  const subTasks = task.subTasks ?? [];

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus.mutate(newStatus);
  };

  const handleConfirmDelete = () => {
    deleteTask.mutate(task._id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        navigate(`/projects/${project._id}/tasks`, { replace: true });
      },
    });
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/projects/${project._id}/tasks`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tasks
      </Link>

      {/* Main Task Card */}
      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {task.name}
              </h1>
              <StatusBadge status={task.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                {assignee?.avatar?.url ? (
                  <img
                    src={assignee.avatar.url}
                    alt={assignee.username}
                    className="h-5 w-5 rounded-full border border-border object-cover"
                  />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" />
                )}
                Assigned to:{" "}
                <strong className="font-medium text-foreground">
                  {assignee
                    ? assignee.fullName || assignee.username
                    : "Unassigned"}
                </strong>
              </span>

              {task.createdAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {format(new Date(task.createdAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canChangeStatus && (
              <Select
                aria-label="Change task status"
                value={task.status}
                disabled={updateTaskStatus.isPending}
                onChange={(e) =>
                  handleStatusChange(e.target.value as TaskStatus)
                }
                className="h-9 w-36 text-xs"
              >
                {AVAILABLE_TASK_STATUSES.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {TASK_STATUS_LABELS[statusOption]}
                  </option>
                ))}
              </Select>
            )}

            {canManipulateTask && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}

            {canManipulateTask && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {task.content || (
              <span className="text-muted-foreground italic">
                No description provided.
              </span>
            )}
          </p>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Paperclip className="h-3.5 w-3.5" />
              Attachments ({attachments.length})
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attachments.map((file, index) => {
                const mime = file.MimeType || file.mimetype || "";
                const isImage = mime.startsWith("image/");
                const fileName =
                  file.url.split("/").pop() || `Attachment ${index + 1}`;

                return (
                  <a
                    key={file._id ?? `${file.url}-${index}`}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-muted/60"
                  >
                    {isImage ? (
                      <img
                        src={file.url}
                        alt={fileName}
                        className="h-10 w-10 shrink-0 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                        {fileName}
                      </p>
                      {file.size !== undefined && (
                        <p className="text-[11px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>

                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Subtasks */}
      <SubTaskSection
        projectId={project._id}
        taskId={task._id}
        subTasks={subTasks}
        canManage={canManageSubTasks}
      />

      <TaskFormModal
        projectId={project._id}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        task={task}
      />

      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete task?"
        description={`Are you sure you want to delete "${task.name}"? This cannot be undone.`}
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={deleteTask.isPending}
            loadingText="Deleting..."
            onClick={handleConfirmDelete}
          >
            Delete task
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
