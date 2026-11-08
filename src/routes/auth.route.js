import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { validateRegisterUser } from "../validators/index.js";
const router = Router();

router.route("/register").post(validateRegisterUser(), validate, registerUser);

export default router;
