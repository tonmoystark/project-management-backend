import { ROLE_LABELS, type UserRole } from "@/utils/constants";
import { cn } from "@/lib/utils";

const roleStyles: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  project_admin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  member: "bg-muted text-muted-foreground border-border",
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        roleStyles[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
};
