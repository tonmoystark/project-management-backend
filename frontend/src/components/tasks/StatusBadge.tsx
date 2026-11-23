import { TASK_STATUS_LABELS, type TaskStatus } from "@/utils/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  done: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
};
