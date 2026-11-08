import { Router } from "express";
import {
  login,
  logoutUser,
  registerUser,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  validateLoginUser,
  validateRegisterUser,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(validateRegisterUser(), validate, registerUser);
router.route("/login").post(validateLoginUser(), validate, login);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
