import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  login,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLoginUser,
  validateRegisterUser,
  validateResetPassword,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// unsecured routes

router.route("/register").post(validateRegisterUser(), validate, registerUser);
router.route("/login").post(validateLoginUser(), validate, login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/forgot-password")
  .post(validateForgotPassword(), validate, forgotPasswordRequest);

router
  .route("/reset-password/:token")
  .post(validateResetPassword(), validate, resetForgotPassword);

// secured routes

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(verifyJWT, validateChangePassword(), validate, changeCurrentPassword);

router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);

export default router;
