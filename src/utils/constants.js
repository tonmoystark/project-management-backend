export const userRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const avalableUsers = Object.values(userRolesEnum);

export const taskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const avalableTaskStatus = Object.values(taskStatus);
