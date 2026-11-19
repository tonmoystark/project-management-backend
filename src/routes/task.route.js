import { Router } from "express";

import {
  validateProjectPermission,
  validateTaskPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validator.middleware.js";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import {
  validateCreateSubTask,
  validateCreateTask,
  validateUpdateTask,
} from "../validators/index.js";
import {
  createSubTask,
  createTask,
  deleteTask,
  getTaskId,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";

const router = Router({ mergeParams: true });
router.use(verifyJWT);

router
  .route("/")
  .get(validateProjectPermission(availableUsers), getTasks)
  .post(
    validateCreateTask(),
    validate,
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    createTask,
  );

router
  .route("/:taskId")
  .get(validateProjectPermission(availableUsers), getTaskId)
  .put(
    validateUpdateTask(),
    validate,
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    updateTask,
  )
  .delete(
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN]),
    deleteTask,
  );

router
  .route("/:taskId/subtask")
  .get(validateProjectPermission(availableUsers), getSubTask)
  .post(
    validateCreateSubTask(),
    validate,
    validateProjectPermission(),
    createSubTask,
  );

export default router;
