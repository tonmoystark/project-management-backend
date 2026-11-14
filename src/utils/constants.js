export const userRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const availableUsers = Object.values(userRolesEnum);

export const taskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const availableTaskStatus = Object.values(taskStatus);
