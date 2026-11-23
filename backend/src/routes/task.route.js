import { Router } from "express";

import {
  validateProjectPermission,
  validateTaskPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validator.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import {
  validateCreateSubTask,
  validateCreateTask,
  validateUpdateSubTask,
  validateUpdateTask,
  validateUpdateTaskStatus,
} from "../validators/index.js";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getSubTask,
  getTaskId,
  getTasks,
  updateSubTask,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller.js";

const router = Router({ mergeParams: true });
router.use(verifyJWT);

router
  .route("/")
  .get(validateProjectPermission(availableUsers), getTasks)
  .post(
    validateProjectPermission([userRolesEnum.ADMIN]),
    upload.array("attachments"),
    validateCreateTask(),
    validate,
    createTask,
  );

router
  .route("/:taskId")
  .get(validateProjectPermission(availableUsers), getTaskId)
  .put(
    validateProjectPermission([userRolesEnum.ADMIN]),
    validateTaskPermission([userRolesEnum.ADMIN]),
    upload.array("attachments"),
    validateUpdateTask(),
    validate,
    updateTask,
  )
  .delete(
    validateProjectPermission([userRolesEnum.ADMIN]),
    validateTaskPermission([userRolesEnum.ADMIN]),
    deleteTask,
  );

router
  .route("/:taskId/status")
  .patch(
    validateProjectPermission(availableUsers),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    validateUpdateTaskStatus(),
    validate,
    updateTaskStatus,
  );

router
  .route("/:taskId/subtask")
  .get(validateProjectPermission(availableUsers), getSubTask)
  .post(
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN]),
    validateCreateSubTask(),
    validate,
    createSubTask,
  );

router
  .route("/:taskId/subtask/:subTaskId")
  .put(
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN]),
    validateUpdateSubTask(),
    validate,
    updateSubTask,
  )
  .delete(
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN]),
    deleteSubTask,
  );

export default router;
