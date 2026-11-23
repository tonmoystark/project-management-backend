export const USER_ROLES = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const AVAILABLE_USER_ROLES: UserRole[] = Object.values(USER_ROLES);

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  project_admin: "Project Admin",
  member: "Member",
};

export const TASK_STATUSES = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const AVAILABLE_TASK_STATUSES: TaskStatus[] =
  Object.values(TASK_STATUSES);

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};
