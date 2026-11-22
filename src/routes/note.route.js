import { Router } from "express";
import { validate } from "../middlewares/validator.middleware.js";
import {
  validateNotePermission,
  validateProjectPermission,
  verifyJWT,
} from "../middlewares/auth.middleware.js";
import { availableUsers } from "../utils/constants.js";
import { validateCreateNote, validateUpdateNote } from "../validators/index.js";
import {
  createNote,
  deleteNote,
  getAllNotes,
  updateNote,
} from "../controllers/note.controller.js";

const router = Router({ mergeParams: true });
router.use(verifyJWT);

router
  .route("/")
  .get(validateProjectPermission(availableUsers), getAllNotes)
  .post(
    validateProjectPermission(availableUsers),
    validateCreateNote(),
    validate,
    createNote,
  );

router
  .route("/:noteId")
  .put(
    validateProjectPermission(availableUsers),
    validateNotePermission(),
    validateUpdateNote(),
    validate,
    updateNote,
  )
  .delete(
    validateProjectPermission(availableUsers),
    validateNotePermission(),
    deleteNote,
  );

export default router;
