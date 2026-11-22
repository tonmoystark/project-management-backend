import { Router } from "express";
import {
  getProjects,
  getProjectId,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
} from "../controllers/project.controller.js";
import {
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
  validateAddMemberToProject,
  validateCreateProject,
  validateUpdateMemberRole,
  validateUpdateProject,
} from "../validators";
import { validate } from "../middlewares/validator.middleware.js";
import { availableUsers, userRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(getProjects)
  .post(validateCreateProject(), validate, createProject);

router
  .route("/:projectId")
  .get(validateProjectPermission(availableUsers), getProjectId)
  .put(
    validateProjectPermission([userRolesEnum.ADMIN]),
    validateUpdateProject(),
    validate,
    updateProject,
  )
  .delete(validateProjectPermission([userRolesEnum.ADMIN]), deleteProject);

router
  .route("/:projectId/members")
  .get(validateProjectPermission(availableUsers), getProjectMembers)
  .post(
    validateProjectPermission(availableUsers),
    validateAddMemberToProject(),
    validate,
    addMembersToProject,
  );

router
  .route("/:projectId/members/:userId")
  .put(
    validateProjectPermission([userRolesEnum.ADMIN]),
    validateUpdateMemberRole(),
    validate,
    updateMemberRole,
  )
  .delete(validateProjectPermission([userRolesEnum.ADMIN]), deleteMember);

export default router;
