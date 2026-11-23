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
} from "../controllers/task.controller.js";

const router = Router({ mergeParams: true });
router.use(verifyJWT);

router
  .route("/")
  .get(validateProjectPermission(availableUsers), getTasks)
  .post(
    validateProjectPermission([
      userRolesEnum.ADMIN,
      userRolesEnum.PROJECT_ADMIN,
    ]),
    upload.array("attachments"),
    validateCreateTask(),
    validate,
    createTask,
  );

router
  .route("/:taskId")
  .get(validateProjectPermission(availableUsers), getTaskId)
  .put(
    validateProjectPermission(availableUsers),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    upload.array("attachments"),
    validateUpdateTask(),
    validate,
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
    validateProjectPermission(availableUsers),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    validateCreateSubTask(),
    validate,
    createSubTask,
  );

router
  .route("/:taskId/subtask/:subTaskId")
  .put(
    validateProjectPermission(availableUsers),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    validateUpdateSubTask(),
    validate,
    updateSubTask,
  )
  .delete(
    validateProjectPermission(availableUsers),
    validateTaskPermission([userRolesEnum.ADMIN, userRolesEnum.PROJECT_ADMIN], {
      allowAssignee: true,
    }),
    deleteSubTask,
  );

export default router;
