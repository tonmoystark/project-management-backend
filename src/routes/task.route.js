import { Router } from "express";

import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validator.middleware.js";
import { availableUsers, userRolesEnum } from "../utils/constants.js";
import { validateCreateSubTask, validateCreateTask, validateUpdateTask } from "../validators/index.js";
import {
    createSubTask,
  createTask,
  deleteTask,
  getTaskId,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";


const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(validateProjectPermission(availableUsers), getTasks)
  .post(
    validateCreateTask(),
    validate,
    validateProjectPermission([userRolesEnum.ADMIN], createTask),
  );

router
  .route("/:taskId")
  .get(validateProjectPermission(availableUsers), getTaskId)
  .put(
    validateUpdateTask(),
    validate,
    validateProjectPermission([userRolesEnum.ADMIN]),
    updateTask,
  )
  .delete(validateProjectPermission([userRolesEnum.ADMIN]), deleteTask);

router
  .route("/:taskId/subtask")
  .get(validateProjectPermission(availableUsers), getSubTask)
  .post(validateCreateSubTask(), validate, validateProjectPermission ,createSubTask)

export default router;
