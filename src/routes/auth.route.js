import { Router } from "express";
import { login, registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  validateLoginUser,
  validateRegisterUser,
} from "../validators/index.js";
const router = Router();

router.route("/register").post(validateRegisterUser(), validate, registerUser);
router.route("/login").post(validateLoginUser(), validate, login);

export default router;
