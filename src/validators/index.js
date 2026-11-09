import { body } from "express-validator";

export const validateRegisterUser = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be within 3 to 20 characters")
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase"),
    body("password").isEmpty().withMessage("Password is required"),
    //   .isStrongPassword({
    //     minLength: 8,
    //     minLowercase: 1,
    //     minUppercase: 1,
    //     minNumbers: 1,
    //   })
    //   .withMessage("Password must be strong"),
  ];
};

export const validateLoginUser = () => {
  return [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
    body("password").isEmpty().withMessage("Password is required"),
  ];
};

export const validateForgotPassword = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Email is not valid")
      .notEmpty()
      .withMessage("Email is required"),
  ];
};

export const validateResetPassword = () => {
  return [
    body("password")
      // .isStrongPassword({
      //   minLength: 8,
      //   minLowercase: 1,
      //   minUppercase: 1,
      //   minNumbers: 1,
      // })
      // .withMessage("Password must be strong"),
      .notEmpty()
      .withMessage("Password is required"),
  ];
};

export const validateChangePassword = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),
    body("newPassword")
      // .isStrongPassword({
      //   minLength: 8,
      //   minLowercase: 1,
      //   minUppercase: 1,
      //   minNumbers: 1,
      // })
      // .withMessage("Password must be strong"),
      .notEmpty()
      .withMessage("New password is required"),
  ];
};
